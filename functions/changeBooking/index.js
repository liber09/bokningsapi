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

    console.log('booking-db from getBooking', response);
    return response.Item;
  } catch (error) {
    console.error('Error fetching booking: ', error);
    return null;
  }
}

async function getRooms() {
  try {
    const response = await db
      .scan({
        TableName: 'room-db',
      })
      .promise();

    return response.Items || [];
  } catch (error) {
    console.error('Error fetching booking: ', error);
    return [];
  }
}

function getDatesInRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];
  let currentDate = start;

  while (currentDate <= end) {
    dateArray.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

async function changeDate(bookingId, startDate, endDate, roomIdKey) {
  try {
    const booking = await getBooking(bookingId);

    if (!booking) {
      return sendResponse(404, { message: 'Booking not found' });
    }

    const rooms = await getRooms();

    const isAvailable = areRoomsAvailable(
      rooms,
      startDate,
      endDate,
      booking.visitors,
      bookingId
    );

    if (!isAvailable) {
      return sendResponse(400, { message: 'Dates are not available' });
    }

    const newDates = getDatesInRange(startDate, endDate);

    if (roomIdKey) {
      const room = rooms.find((room) => room.roomId === roomIdKey);

      if (room && room.dates) {
        room.dates = room.dates.filter(
          (dateObj) =>
            Array.isArray(booking.dates) && !booking.dates.includes(dateObj)
        );

        room.dates = room.dates.concat(newDates);
      }

      await updateItem('room-db', { roomId: roomIdKey }, { dates: room.dates });
    }

    return true;
  } catch (error) {
    console.error(
      `Could not update date for booking ${bookingId} to start on ${startDate} and end on ${endDate} in room ${roomIdKey}`,
      error
    );
    return false;
  }
}

function areRoomsAvailable(rooms, startDate, endDate, visitors, bookingId) {
  for (const room of rooms) {
    if (room.dates && room.dates.length > 0) {
      const overlappingBooking = room.dates.find((booking) => {
        const bookingStartDate = new Date(booking.startDate);
        const bookingEndDate = new Date(booking.endDate);

        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);

        return (
          (newStartDate >= bookingStartDate &&
            newStartDate <= bookingEndDate) ||
          (newEndDate >= bookingStartDate && newEndDate <= bookingEndDate)
        );
      });

      if (!overlappingBooking && room.capacity >= parseInt(visitors)) {
        return true;
      }
    }
  }

  return false;
}

async function changeVisitorAmount(bookingId, visitors) {
  try {
    const booking = await getBooking(bookingId);

    if (!booking) {
      return sendResponse(404, { message: 'Booking not found' });
    }

    const rooms = await getRooms();

    const isAvailable = areRoomsAvailable(
      rooms,
      booking.startDate,
      booking.endDate,
      visitors,
      bookingId
    );

    if (!isAvailable) {
      return sendResponse(400, {
        message: 'No available rooms for the new number of visitors and dates',
      });
    }

    booking.visitors = visitors;

    await updateItem('booking-db', { id: bookingId }, { visitors: visitors });

    return true;
  } catch (error) {
    console.error(`Could not update visitors for booking ${bookingId}`, error);
    return false;
  }
}

async function changeRoomType(bookingId, roomTypes) {
  //om gästen vill ändra från ex två suites med tre personer i varje till 6 st singelrum
  // isf ta bort datumen från de gamla rummen
  return sendResponse(200, {
    success: true,
    message: 'Booking room types updated successfully',
    updatedBooking: result.Attributes,
  });
}

exports.handler = async (event, context) => {
  const { bookingId } = event.pathParameters;
  const updateAttributes = JSON.parse(event.body);
  const roomIdKey = updateAttributes.roomId;
  if (updateAttributes.hasOwnProperty('roomId')) {
    delete updateAttributes['roomId'];
  }

  if ('startDate' in updateAttributes && 'endDate' in updateAttributes) {
    const changeDateResult = await changeDate(
      bookingId,
      updateAttributes.startDate,
      updateAttributes.endDate,
      roomIdKey
    );

    if (!changeDateResult) {
      return sendResponse(400, {
        success: false,
        message:
          'Could not change the dates, please make a new reservation instead.',
      });
    }
  }

  if ('visitors' in updateAttributes) {
    const changeVisitorsResult = await changeVisitorAmount(
      bookingId,
      updateAttributes.visitors
    );

    if (!changeVisitorsResult) {
      return sendResponse(400, {
        success: false,
        message:
          'Could not change visitors, please make a new reservation instead',
      });
    }
  }

  await updateItem('booking-db', { id: bookingId }, updateAttributes);

  return sendResponse(200, {
    success: true,
    message: 'Booking or room updated successfully',
  });
};

async function updateItem(tableName, key, updateAttributes) {
  const {
    updateExpression,
    expressionAttributeValues,
    expressionAttributeNames,
  } = generateUpdateParams(updateAttributes);

  try {
    const result = await db
      .update({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
      })
      .promise();

    return result;
  } catch (error) {
    console.error('Could not update item:', error);
    throw error;
  }
}

function generateUpdateParams(updateAttributes) {
  const updateExpression =
    'set ' +
    Object.keys(updateAttributes)
      .map((attributeName) => `#${attributeName} = :${attributeName}`)
      .join(', ');

  const expressionAttributeValues = Object.keys(updateAttributes).reduce(
    (values, attributeName) => {
      values[`:${attributeName}`] = updateAttributes[attributeName];
      return values;
    },
    {}
  );

  const expressionAttributeNames = Object.keys(updateAttributes).reduce(
    (values, attributeName) => {
      values[`#${attributeName}`] = `${attributeName}`;
      return values;
    },
    {}
  );

  return {
    updateExpression,
    expressionAttributeValues,
    expressionAttributeNames,
  };
}
