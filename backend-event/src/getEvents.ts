
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";
import { Readable } from "stream";
import { corsHeaders, handleCors } from "./utils/cors";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME!;

function streamToString(stream: Readable): Promise<string> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;
  try {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: "events/" }));
    const keys = listed.Contents?.map(obj => obj.Key!).filter(Boolean) || [];

    const events = await Promise.all(keys.map(async (key) => {
      try {
        const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        const content = await streamToString(obj.Body as Readable);
        return JSON.parse(content);
      } catch (e) {
        console.warn(`Skipping file ${key}`);
        return null;
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(events.filter(Boolean)),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to load events" }) };
  }
};

