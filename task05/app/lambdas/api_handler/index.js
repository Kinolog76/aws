const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TARGET_TABLE || 'Events';

exports.handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const { principalId, content } = requestBody;

        if (!principalId || !content || typeof principalId !== 'number' || typeof content !== 'object') {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "'principalId' (number) and 'content' (object) are required."
                })
            };
        }

        const newEvent = {
            id: uuidv4(),
            principalId: principalId,
            createdAt: new Date().toISOString(),
            body: content
        };

        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: newEvent
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({
                statusCode: 201,
                event: newEvent
            })
        };
    } catch (error) {
        console.error("Error saving to DynamoDB:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal server error.",
                error: error.message
            })
        };
    }
};