const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const rooms = [];
  const { Items } = await db
    .scan({
      TableName: 'booking-db',
    })
    .promise();

    if(Items.Items && Items.length > 0) {
      Items.Items.array.forEach(activeBooking => {
        let booking = {
          id: activeBooking.id,
          bookingNumber: activeBooking.bookingNumber,
          startDate: activeBooking.startDate,
          endDate: activeBooking.endDate,
          visitors: activeBooking.visitors,
          //roomCount: activeBooking.roomCount
          name: activeBooking.firstName
        }
        rooms.put(booking);
      });    
    }else{
      return sendResponse(204, { message: 'Inga rum hittades.' });
    }
    if (rooms.length > 0){
      return sendResponse(200, { success: true, event: rooms });
    }else{
      return sendResponse(204, { message: 'Inga rum hittades.' });
    }
};
