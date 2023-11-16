const AWS = require('aws-sdk');
const { sendResponse } = require('../../responses/index');
const db = new AWS.DynamoDB.DocumentClient();
const bookedRoomResponse = [];
exports.handler = async (event, context) => {
    const params = {
        TableName: 'room-db',
    };

    const params2 = {
      TableName: 'booking-db'
    }

    try {
        const rooms = await db.scan(params).promise();
        const bookings = await db.scan(params2).promise();

        bookings.Items.forEach(booking => {
          const bookedRooms = rooms.Items
            .filter(item => item.dates && item.dates.length > 0 && 
              item.booked.bookingNumber == booking.bookingNumber);
            let bookingInformation = {
              "BookingNumber": booking.bookingNumber,
              "Reservation name": booking.name,
              "CheckInDate": booking.startDate,
              "CheckOutDate": booking.endDate,
              "NumberOfGuests": booking.visitors,
              "NumberOfRooms": bookedRooms.length
            }
            bookedRoomResponse.push(bookingInformation);
        });
        // Checks if there is any booked room and then returns a response
        if (bookedRoomResponse.length > 0) {
            return sendResponse(200, { rooms: bookedRoomResponse });
        } else {
            return sendResponse(404, { message: 'Inga rum hittades.' });
        }

    } catch (error) {
        // Log the error details
        console.error('Error:', error);

        // Return a 500 response with an error message
        return sendResponse(500, { success: false, message: 'Internal Server Error' });
    }
}