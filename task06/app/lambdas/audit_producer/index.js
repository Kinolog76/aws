const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TARGET_TABLE = process.env.target_table;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const auditPromises = event.Records.map(async (record) => {
    const currentTime = new Date().toISOString();

    const { eventName, dynamodb } = record;
    const keys = dynamodb.Keys.key.S;

    let auditItem = {
      id: uuidv4(),
      itemKey: keys,
      modificationTime: currentTime,
    };

    if (eventName === "INSERT") {
      auditItem.newValue = {
        key: dynamodb.NewImage.key.S,
        value: Number(dynamodb.NewImage.value.N),
      };
    } else if (eventName === "MODIFY") {
      auditItem.oldValue = Number(dynamodb.OldImage.value.N);
      auditItem.newValue = Number(dynamodb.NewImage.value.N);
    } else {
      console.log(`Skipping unsupported event type: ${eventName}`);
      return;
    }

    const params = {
      TableName: TARGET_TABLE,
      Item: auditItem,
    };

    console.log("Saving audit record:", JSON.stringify(params, null, 2));
    return dynamoDB.put(params).promise();
  });

  try {
    await Promise.all(auditPromises);
    console.log("Successfully processed all records.");
  } catch (error) {
    console.error("Error saving audit records:", error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processed successfully." }),
  };
};
