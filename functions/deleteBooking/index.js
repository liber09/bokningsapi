const AWS = require('aws-sdk');
const { sendResponse } = require('../../responses/index');
const db = new AWS.DynamoDB.DocumentClient();

exports.deleteBooking = async (bookingNumber) => {
  const params = {
    TableName: 'booking-db',
    Key: {
      bookingNumber: bookingNumber,
    },
  };

  try {
    await db.delete(params).promise();
    return true; // Return true if the booking is successfully deleted
  } catch (error) {
    console.error('Error:', error);
    return false; // Return false if there is an error deleting the booking
  }
};