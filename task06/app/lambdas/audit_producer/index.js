const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const AUDIT_TABLE = process.env.target_table;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const auditRecords = event.Records.map((record) => {
    const { eventName, dynamodb } = record;

    if (!dynamodb || !dynamodb.Keys) {
      console.error("Skipping record due to missing Keys:", JSON.stringify(record, null, 2));
      return null;
    }

    const itemKey = dynamodb.Keys.key.S;
    const modificationTime = new Date().toISOString();

    let auditItem = {
      id: uuidv4(),
      itemKey,
      modificationTime,
    };

    if (eventName === "INSERT" && dynamodb.NewImage) {
      auditItem.newValue = {
        key: dynamodb.NewImage.key.S,
        value: Number(dynamodb.NewImage.value.N),
      };
    } else if (eventName === "MODIFY" && dynamodb.OldImage && dynamodb.NewImage) {
      auditItem.oldValue = Number(dynamodb.OldImage.value.N);
      auditItem.newValue = Number(dynamodb.NewImage.value.N);
    } else {
      console.log(`Skipping unsupported event type: ${eventName}`);
      return null;
    }

    return {
      TableName: AUDIT_TABLE,
      Item: auditItem,
    };
  }).filter((item) => item !== null);

  try {
    await Promise.all(auditRecords.map((params) => dynamoDB.put(params).promise()));
    console.log("Successfully saved audit records.");
  } catch (error) {
    console.error("Error saving audit records:", error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processed successfully." }),
  };
};
