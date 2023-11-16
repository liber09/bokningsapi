const { sendResponse } = require('../../responses/index.js');
const uuid = require('uuid');
const moment = require('moment');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const newBooking = JSON.parse(event.body);

  newBooking.id = uuid.v4();
  newBooking.bookingNumber = generateBookingNumber();
  const { id, firstName, eMail, startDate, endDate, visitors, bookingNumber } =
    newBooking;

  try {
    // Validera inmatningsparametrar
    const error = validateParameters(
      firstName,
      eMail,
      startDate,
      endDate,
      visitors
    );
    if (error.length > 0) {
      return sendResponse(400, { success: false, error });
    }

    //hämta tillgängliga rum i room-db
    const availableRooms = await getAvailableRooms(startDate, endDate);

    //hämta hur många rum vi ska boka
    const roomTypesToBook = getRoomTypes(visitors);
    console.log('roomstypestobook:', roomTypesToBook);

    //Boka rummen
    const bookedRooms = await bookRooms(
      roomTypesToBook,
      availableRooms,
      newBooking
    );

    if (bookedRooms.length === 0) {
      return sendResponse(400, { success: false, error: 'No available rooms' });
    }

    const bookedRoomIds = bookedRooms.map((room) => room.roomId);

    if (bookedRooms.length === 0) {
        return sendResponse(400, { success: false, error: 'No available rooms' });
      }

    // Beräkna totalbeloppet baserat på rumstyper och nätter
    const totalAmount = calculateTotalAmount(
      roomTypesToBook,
      startDate,
      endDate
    );


    await db
      .put({
        TableName: 'booking-db',
        Item: {
          id: id,
          name: firstName,
          email: eMail,
          startDate: startDate,
          endDate: endDate,
          visitors: visitors,
          bookingNumber: bookingNumber,
          bookedRoomIds: bookedRoomIds,
        },
      })
      .promise();

    return sendResponse(200, { success: true, newBooking });
  } catch (error) {
    console.log('error from exports.handler', error);
    return sendResponse(500, { error: error });
  }

  function generateBookingNumber() {
    return Math.random()
      .toString(36)
      .substring(2, 6 + 2);
  }

  function calculateTotalAmount(roomTypes, startDate, endDate) {
    let totalCost = 0;

    roomTypes.forEach((roomType) => {
      let price;
      if (roomType === 'suite') {
        price = 1500;
      } else if (roomType === 'double') {
        price = 1000;
      } else if (roomType === 'single') {
        price = 500;
      }

      const lengthOfStay = Math.floor(
        (endDate - startDate) / (1000 * 60 * 60 * 24)
      );
      totalCost += price * lengthOfStay;
    });

    return totalCost;
  }

};


async function bookRooms(roomTypesToBook, availableRooms, newBooking) {
  const roomsToBook = [];

  for (let type of roomTypesToBook) {
    const roomIndex = availableRooms.findIndex((room) => room.type === type);

    if (roomIndex !== -1) {
      const bookedRoom = availableRooms[roomIndex];
      roomsToBook.push(bookedRoom);
      availableRooms.splice(roomIndex, 1);

      //room-databasen uppdateras med bokningen men själva rummen måste också läggas in på bokning-db

      try {
        const dates = getDatesInRange(newBooking.startDate, newBooking.endDate);

        await db
          .update({
            TableName: 'room-db',
            Key: { roomId: bookedRoom.roomId },
            UpdateExpression:
              'SET #booked = list_append(if_not_exists(#booked, :empty_list), :newBooking), #dates = list_append(if_not_exists(#dates, :empty_dates), :dates)',
            ExpressionAttributeNames: {
              '#booked': 'booked',
              '#dates': 'dates',
            },
            ExpressionAttributeValues: {
              ':newBooking': [newBooking],
              ':dates': dates,
              ':empty_list': [],
              ':empty_dates': [],
            },
          })
          .promise();
      } catch (error) {
        console.error('Error updating room-db:', error);
        return sendResponse(400, { error: error });
      }
    }
  }
  console.log('rooms to book', roomsToBook);
  return roomsToBook;
}

function validateParameters(firstName, eMail, startDate, endDate, visitors) {
  let validationError = false;
  let errorMessage = '';
  var validEmailRegex = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm;


  const today = moment(new Date(), 'YYYY-MM-DD').unix();
  if (firstName && firstName.trim() === '') {
    validationError = true;
    errorMessage += ' Firstname is missing, ';
  }

  if (eMail && !eMail.match(validEmailRegex)) {
    validationError = true;
    errorMessage += ' eMail is not valid, ';
  }

  if (
    startDate &&
    moment(new Date(), 'YYYY-MM-DD').unix() >=
      moment(startDate, 'YYYY-MM-DD').unix()
  ) {
    validationError = true;
    errorMessage += ' Start date needs to be today or later, ';
  }

  if (
    startDate &&
    endDate &&
    moment(endDate, 'YYYY-MM-DD').unix() <
      moment(startDate, 'YYYY-MM-DD').add(1, 'days').unix()
  ) {
    validationError = true;
    errorMessage += ' End date needs to be at least one day after start date, ';
  }

  if (visitors === undefined || visitors <= 0) {
    validationError = true;
    errorMessage += ' There needs to be at least one visitor, ';
  }
  console.log('validate parameters:', errorMessage);
  return sendResponse(400, { error: errorMessage });
}

function getRoomTypes(visitors) {
  rooms = [];
  let tempVisitors = visitors;
  while (tempVisitors > 2) {
    rooms.push('suite');
    tempVisitors -= 3;
  }
  while (tempVisitors > 1) {
    rooms.push('double');
    tempVisitors -= 2;
  }
  if (tempVisitors == 1) {
    rooms.push('single');
  }
  return rooms;
}

async function getAvailableRooms(startDate, endDate) {
  try {
    const response = await db
      .scan({
        TableName: 'room-db',
      })
      .promise();

    const allRooms = response.Items || [];

    // Filter out rooms with bookings for the specified date range
    const availableRooms = allRooms.filter(
      (room) => !hasBookingInDateRange(room.dates, startDate, endDate)
    );

    return availableRooms;
  } catch (error) {
    console.error('Error in getAvailableRooms:', error);
    return sendResponse(400, { error: error });
  }
}

function hasBookingInDateRange(dates, startDate, endDate) {
  if (dates && dates.length > 0) {
    const range = getDatesInRange(startDate, endDate);
    return dates.some((date) => range.includes(date));
  }
  return false;
}

function getDatesInRange(startDate, endDate) {
  const start = moment(startDate);
  const end = moment(endDate);
  const dates = [];

  while (start.isBefore(end) || start.isSame(end)) {
    dates.push(start.format('YYYY-MM-DD'));
    start.add(1, 'days');
  }

  return dates;
}
};


