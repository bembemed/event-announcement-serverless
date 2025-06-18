import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";
import slugify from "slugify";
import { getOrCreateTopicArn } from "./organizerTopicManager";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const s3 = new S3Client({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME!;

import { corsHeaders, handleCors } from "./utils/cors";

export const handler: APIGatewayProxyHandler = async (event) => {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;
  const organizerEmail = event.requestContext?.authorizer?.claims?.email;
  if (!organizerEmail) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
      headers: corsHeaders
    };
  }

  try {
    const newEvent = JSON.parse(event.body || "{}");

    const timestamp = Math.floor(Date.now() / 1000);
    const filename = `${timestamp}-${slugify(newEvent.title || 'untitled')}.json`;
    const s3Key = `events/${filename}`;    // Validate required fields
    if (!newEvent.title?.trim() || !newEvent.date?.trim() || !newEvent.location?.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Title, date, and location are required." }),
        headers: corsHeaders,
      };
    }
    const eventEntry = {
      ...newEvent,
      organizerName: organizerEmail, // Use email as organizer name
      submittedBy: organizerEmail,
      createdAt: new Date().toISOString(),
    };

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: JSON.stringify(eventEntry, null, 2),
      ContentType: "application/json"
    }));

    // Get or create SNS topic for this organizer
    const topicArn = await getOrCreateTopicArn(organizerEmail);

    const message = `📢 New Event Submitted\n📝 Title: ${newEvent.title}\n📅 Date: ${newEvent.date}\n📍 Location: ${newEvent.location}\n👤 Organizer: ${organizerEmail}\n📖 Description: ${newEvent.description || "N/A"}\n📬 Submitted At: ${new Date().toLocaleString()}`;

    await sns.send(new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      Subject: "New Event Announcement"
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event submitted and notification sent." }),
      headers: corsHeaders
    };
  } catch (err) {
    console.error("Error submitting event:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to submit event." }),
      headers: corsHeaders
    };
  }
};
