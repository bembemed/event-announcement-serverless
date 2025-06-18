import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME!;

async function streamToString(stream: Readable): Promise<string> {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const userEmail = event.requestContext?.authorizer?.claims?.email;  
  const headers = {
    "Access-Control-Allow-Origin": "https://eventfront.dlblnz5yjhuti.amplifyapp.com",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (!userEmail) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: "Unauthorized" })
    };
  }

  try {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: "events/"
    }));

    const keys = list.Contents?.map(o => o.Key!).filter(Boolean) || [];
    const events = [];

    for (const key of keys) {
      try {
        const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
        const result = await s3.send(getCmd);
        const content = await streamToString(result.Body as Readable);
        const parsed = JSON.parse(content);

        if (parsed.submittedBy === userEmail) {
          events.push(parsed);
        }
      } catch (e) {
        console.warn("Error processing", key, e);
      }
    }    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(events)
    };
  } catch (err) {
    console.error("Error listing events:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      },
      body: JSON.stringify({ message: "Failed to fetch user events" })
    };
  }
};