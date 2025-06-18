import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME!;
const EVENT_PREFIX = "events/";
const MAX_AGE_DAYS = 90;

async function streamToString(stream: Readable): Promise<string> {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

export const handler = async () => {
  const now = Date.now();
  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  try {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: EVENT_PREFIX,
    }));

    if (!list.Contents) return { statusCode: 200, body: "No events found." };

    for (const obj of list.Contents) {
      const key = obj.Key!;
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        const content = await streamToString(res.Body as Readable);
        const event = JSON.parse(content);

        const createdAt = new Date(event.createdAt).getTime();
        if (now - createdAt > maxAgeMs) {
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
          console.log(`Deleted old event: ${key}`);
        }
      } catch (e) {
        console.warn(`Failed to process ${key}:`, e);
      }
    }

    return { statusCode: 200, body: "Cleanup completed." };
  } catch (e) {
    console.error("Cleanup failed:", e);
    return { statusCode: 500, body: "Cleanup failed." };
  }
};
