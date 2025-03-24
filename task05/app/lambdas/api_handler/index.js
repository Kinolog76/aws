const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// DynamoDB Client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TARGET_TABLE;

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { principalId, content } = body;
        
        if (!principalId || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid request. 'principalId' and 'content' are required." })
            };
        }

        const timestamp = new Date().toISOString();
        const id = uuidv4();

        const item = {
            id,
            principalId,
            createdAt: timestamp,
            body: content
        };

        // Save the event to DynamoDB
        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: item
        }).promise();

        // Return the response
        return {
            statusCode: 201,
            body: JSON.stringify({ statusCode: 201, event: item })
        };
    } catch (error) {
        console.error("Error saving event:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to save the event." })
        };
    }
};