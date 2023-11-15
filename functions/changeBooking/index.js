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

exports.handler = async (event, context) => {
  const updateAttributes = JSON.parse(event.body);
  const bookingId = updateAttributes.id;

  const updateExpression =
    'SET ' +
    Object.keys(updateAttributes).map(
      (attributeName) => `#${attributeName} = :${attributeName}`
    );

  const expressionAttributeValues = Object.keys(updateAttributes).reduce(
    (values, attributeName) => {
      values[`:${attributeName}`] = updateAttributes[attributeName];
      return values;
    },
    {}
  );

  const booking = await getBooking(bookingId);

  if (!booking) {
    return sendResponse(404, { message: 'Booking not found' });
  }

  try {
    const result = await db
      .update({
        TableName: 'booking-db',
        Key: { id: bookingId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: 'id = :bookingId',
        ExpressionAttributeNames: expressionAttributeValues,
      })
      .promise();
    // await updateBooking(bookingId, message);
    return sendResponse(200, {
      success: true,
      message: 'Booking updated successfully',
      updatedBooking: result.Attributes,
    });
  } catch (error) {
    return sendResponse(500, { message: 'Could not update' });
  }
};

/*
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
*/
