import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { corsHeaders, handleCors } from "./utils/cors";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const SUB_TABLE = process.env.SUBSCRIPTIONS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;
  const userEmail = event.requestContext?.authorizer?.claims?.email;
  if (!userEmail) {
    return {
      statusCode: 401,      body: JSON.stringify({ message: "Unauthorized" }),
      headers: corsHeaders
    };
  }

  try {
    const result = await ddb.send(new QueryCommand({
      TableName: SUB_TABLE,
      KeyConditionExpression: "subscriber = :email",
      ExpressionAttributeValues: {
        ":email": { S: userEmail }
      }
    }));

    const organizers = result.Items?.map(item => item.organizer.S);

    return {
      statusCode: 200,      body: JSON.stringify({ organizers }),
      headers: corsHeaders
    };
  } catch (err) {
    console.error("Error querying subscriptions:", err);
    return {
      statusCode: 500,      body: JSON.stringify({ message: "Server error" }),
      headers: corsHeaders
    };
  }
};
