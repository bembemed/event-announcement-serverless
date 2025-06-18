import { SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { getOrCreateTopicArn } from "./organizerTopicManager";
import { corsHeaders, handleCors } from "./utils/cors";

const sns = new SNSClient({ region: process.env.AWS_REGION });
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const SUBSCRIPTION_TABLE = process.env.SUBSCRIPTION_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;
  const { organizerEmail} = JSON.parse(event.body || "{}");
  const email = event.requestContext?.authorizer?.claims?.email;

  if (!organizerEmail || !email) {
    return {      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Missing organizerEmail or email." })
    };
  }

  try {
    const topicArn = await getOrCreateTopicArn(organizerEmail);

    await sns.send(
      new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: "email",
        Endpoint: email,
      })
    );

    await ddb.send(
      new PutItemCommand({
        TableName: SUBSCRIPTION_TABLE,
        Item: {
          subscriber: { S: email },
          organizer: { S: organizerEmail },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Subscription initiated." })
    };
  } catch (err) {
    console.error("Error subscribing to organizer topic:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
