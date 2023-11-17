const AWS = require('aws-sdk');
const { sendResponse } = require('../../responses/index');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const { bookingId } = event.pathParameters;

  const bookingTable = {
    TableName: 'booking-db',
    Key: {
      id: bookingId,
    },
  };

  try {
    const bookingDetails = await db.get(bookingTable).promise();
    console.log('bookingDetails ', bookingDetails);

    if (!bookingDetails.Item) {
      return sendResponse(404, { message: 'Booking not found' });
    }

    const bookedRoomIdArray = bookingDetails.Item.bookedRoomIds || [];

    console.log(bookedRoomIdArray, 'bookedRoomIdArray');

    for (const roomId of bookedRoomIdArray) {
      if (!roomId) {
        console.error('Error: No roomId found in the booking details');
        return sendResponse(404, {
          message: 'no room-id found in booking details',
        });
      }

      const roomDetails = await db
        .get({
          TableName: 'room-db',
          Key: {
            roomId: roomId,
          },
        })
        .promise();

      const startDate = new Date(bookingDetails.Item.startDate);
      const endDate = new Date(bookingDetails.Item.endDate);
      const dateList = getDatesInRange(startDate, endDate);

      roomDetails.Item.dates = roomDetails.Item.dates.filter(
        (date) => !dateList.includes(date)
      );

      await db
        .update({
          TableName: 'room-db',
          Key: {
            roomId: roomId,
          },
          UpdateExpression: 'SET dates = :dates REMOVE booked',
          ExpressionAttributeValues: {
            ':dates': roomDetails.Item.dates,
          },
        })
        .promise();

      console.log(
        'all rooms and all bookings',
        JSON.stringify(roomDetails, null, 2)
      );
    }

    await db.delete(bookingTable).promise();

    return sendResponse(200, { message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return sendResponse(404, { message: 'Error', error: error });
  }
};

function getDatesInRange(startDate, endDate) {
  const dateArray = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dateArray.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}
