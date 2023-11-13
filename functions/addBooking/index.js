const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const newBooking = JSON.parse(event.body);

  try {
    await db
      .put({
        TableName: 'booking-db',
        Item: newBooking,
      })
      .promise();

    return sendResponse(200, { success: true });
  } catch (error) {
    return sendResponse(500, { success: false });
  }
};
