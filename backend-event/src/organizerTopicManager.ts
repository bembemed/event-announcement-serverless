import { SNSClient, CreateTopicCommand, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const sns = new SNSClient({ region: process.env.AWS_REGION });
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TOPIC_TABLE = process.env.TOPIC_TABLE!;

export async function getOrCreateTopicArn(organizerEmail: string): Promise<string> {
  // Check in DynamoDB first
  const existing = await ddb.send(
    new GetItemCommand({
      TableName: TOPIC_TABLE,
      Key: {
        organizerEmail: { S: organizerEmail },
      },
    })
  );

  if (existing.Item && existing.Item.topicArn?.S) {
    return existing.Item.topicArn.S;
  }

  // Create SNS topic if not exist
  const createTopic = await sns.send(
    new CreateTopicCommand({
      Name: `organizer-${organizerEmail.replace(/[@.]/g, "-")}`,
    })
  );

  const topicArn = createTopic.TopicArn!;

  // Save in DynamoDB
  await ddb.send(
    new PutItemCommand({
      TableName: TOPIC_TABLE,
      Item: {
        organizerEmail: { S: organizerEmail },
        topicArn: { S: topicArn },
      },
    })
  );

  return topicArn;
}