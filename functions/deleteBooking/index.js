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

const bookings = [
  { id: 1, name: 'Booking 1' },
  { id: 2, name: 'Booking 2' },

exports.handler = async (event, context) => {
  // Check if the request is for deleting a booking
  if (event.httpMethod === 'DELETE') {
    // Extract the booking ID from the path parameters
    const bookingId = event.pathParameters.id;

    // Use the DynamoDB delete method to remove the booking
    try {
      await db
        .delete({
          TableName: 'booking-db',
          Key: {
            bookingId: bookingId,
          },
        })
        .promise();

      return sendResponse(200, { success: true, message: `Booking ${bookingId} deleted successfully` });
    } catch (error) {
      console.error('Error deleting booking:', error);
      return sendResponse(500, { success: false, error: 'Internal Server Error' });
    }
  }

  // If the request is not a DELETE request, perform a scan to retrieve all bookings
  try {
    const { Items } = await db
      .scan({
        TableName: 'booking-db',
      })
      .promise();

    return sendResponse(200, { success: true, bookings: Items });
  } catch (error) {
    console.error('Error scanning bookings:', error);
    return sendResponse(500, { success: false, error: 'Internal Server Error' });
  }
}


]
