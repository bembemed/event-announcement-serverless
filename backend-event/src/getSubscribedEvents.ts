// getSubscribedEvents.ts
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { Readable } from "stream";
import { corsHeaders, handleCors } from "./utils/cors";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME!;
const SUB_TABLE = process.env.SUBSCRIPTIONS_TABLE!;

async function streamToString(stream: Readable): Promise<string> {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

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
    // Step 1: Get subscribed organizers
    const subs = await ddb.send(new QueryCommand({
      TableName: SUB_TABLE,
      KeyConditionExpression: "subscriber = :email",
      ExpressionAttributeValues: {
        ":email": { S: userEmail }
      }
    }));

    const organizerEmails = (subs.Items || []).map(i => i.organizer.S);
    if (organizerEmails.length === 0) {
      return {
        statusCode: 200,        body: JSON.stringify([]),
        headers: corsHeaders
      };
    }

    // Step 2: Filter events by organizer
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "events/"
    }));

    const keys = list.Contents?.map(o => o.Key!).filter(Boolean) || [];
    const result = [];

    for (const key of keys) {
      try {
        const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
        const s3obj = await s3.send(getCmd);
        const content = await streamToString(s3obj.Body as Readable);
        const parsed = JSON.parse(content);

        if (organizerEmails.includes(parsed.submittedBy)) {
          result.push(parsed);
        }
      } catch (e) {
        console.warn("Skip unreadable event", key);
      }
    }

    return {
      statusCode: 200,      body: JSON.stringify(result),
      headers: corsHeaders
    };
  } catch (err) {
    console.error("Failed to get subscribed events:", err);
    return {
      statusCode: 500,      body: JSON.stringify({ message: "Internal Server Error" }),
      headers: corsHeaders
    };
  }
};