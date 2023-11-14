const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

async function getBooking(bookingId) {
  try {
    const response = await db
      .get({
        TableName: 'booking-db',
        Key: { id: bookingId },
      })
      .promise();

    return response.Item;
  } catch (error) {
    console.error('Error fetching booking: ', error);
    return null;
  }
}

async function updateBooking(bookingId, message) {
  try {
    await db
      .update({
        TableName: 'booking-db',
        Key: { id: bookingId },
        UpdateExpression: 'SET #message = :newMessage',
        ExpressionAttributeValues: {
          ':newMessage': message,
        },
        ExpressionAttributeNames: {
          '#message': 'message',
        },
      })
      .promise();
  } catch (error) {
    console.error('Error updating booking:', error);
  }
}

exports.handler = async (event, context) => {
  const { id, message } = JSON.parse(event.body);

  const booking = await getBooking(id);

  if (!booking) {
    return sendResponse(404, { message: 'Booking not found' });
  }

  try {
    await updateBooking(id, message);
    return sendResponse(200, {
      success: true,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    return sendResponse(500, { message: 'Could not update' });
  }
};
