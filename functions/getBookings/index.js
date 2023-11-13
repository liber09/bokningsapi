const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const { Items } = await db
    .scan({
      TableName: 'booking-db',
    })
    .promise();

  return sendResponse(200, { success: true, event: Items });
};
