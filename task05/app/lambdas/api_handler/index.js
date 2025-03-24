const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.target_table;

exports.handler = async (event) => {
  console.log("Received Event:", event);

  try {
    const requestBody = JSON.parse(event.body || "{}");
    const { principalId, content } = requestBody;

    if (
      !principalId ||
      !content ||
      typeof principalId !== "number" ||
      typeof content !== "object"
    ) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "'principalId' (number) and 'content' (object) are required fields.",
        }),
      };
    }

    const newEvent = {
      id: uuidv4(),
      principalId: principalId,
      createdAt: new Date().toISOString(),
      body: content,
    };

    await dynamoDB
      .put({
        TableName: TABLE_NAME,
        Item: newEvent,
      })
      .promise();

    console.log("Successfully saved event:", newEvent);

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 201,
        event: newEvent,
      }),
    };
  } catch (error) {
    console.error("Error saving the event to DynamoDB:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Internal server error occurred while saving the event.",
        error: error.message,
      }),
    };
  }
};
