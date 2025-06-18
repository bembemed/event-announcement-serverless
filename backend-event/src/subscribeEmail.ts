import { SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { corsHeaders, handleCors } from "./utils/cors";

const snsSub = new SNSClient({ region: process.env.AWS_REGION });
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TOPIC = process.env.TOPIC_ARN!;
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const email = JSON.parse(event.body || '{}').email;
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Invalid email address" })
      };
    }

    const now = Math.floor(Date.now() / 1000);

  const existing = await ddb.send(new GetItemCommand({
    TableName: RATE_LIMIT_TABLE,
    Key: { email: { S: email } }
  }));

  if (existing.Item && now - parseInt(existing.Item.timestamp.N || '0') < 60) {
    return { 
      statusCode: 429, 
      headers: corsHeaders,
      body: JSON.stringify({ message: "Rate limit exceeded" }) 
    };
  }

  await ddb.send(new PutItemCommand({
    TableName: RATE_LIMIT_TABLE,
    Item: { email: { S: email }, timestamp: { N: now.toString() } }
  }));

  await snsSub.send(new SubscribeCommand({
    TopicArn: TOPIC,
    Protocol: "email",
    Endpoint: email
  }));    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Subscription sent. Check your email." })
    };
  } catch (err) {
    console.error("Error processing subscription:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Failed to process subscription" })
    };
  }
};
