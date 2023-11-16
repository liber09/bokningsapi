const { sendResponse } = require('../../responses/index.js');
const nanoid = require('nanoid');
const uuid = require('uuid');
const moment = require('moment');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

exports.handler = async (event, context) => {
  const newBooking = JSON.parse(event.body);

  newBooking.id = uuid.v4();
  newBooking.bookingNumber = generateBookingNumber();
  const { id, firstName, eMail, startDate, endDate, visitors, bookingNumber } =
    newBooking;
  try {
    // Validera inmatningsparametrar
    const error = validateParameters(firstName, eMail, startDate, endDate, visitors);
    if(error.length > 0){
      return sendResponse(400, { success: false, error});
    }

    //hämta tillgängliga rum i room-db
    const availableRooms = await getAvailableRooms(startDate, endDate);

    //hämta hur många rum vi ska boka
    const roomTypesToBook = getRoomTypes(visitors);

    //Boka rummen
    const bookedRooms = await bookRooms(roomTypesToBook, availableRooms);

    // Beräkna totalbeloppet baserat på rumstyper och nätter
    const totalAmount = calculateTotalAmount(roomType, startDate, endDate);

    // Generera ett bokningsnummer (implementera din egen logik)
    //const bookingNumber = generateBookingNumber();

    // Skicka bekräftelsemail
    /*
    const confirmationEmail = generateConfirmationEmail({
      bookingNumber,
      numberOfGuests: visitors.length,
      roomTypes,
      totalAmount,
      checkInDate: startDate,
      checkOutDate: endDate,
      guestName: firstname,
    });
    */

    // Spara bokningsdetaljer i DynamoDB

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
        },
      })
      .promise();

    // Skicka bekräftelsemail
    /*
    await sendEmail(email, 'Bokningsbekräftelse', confirmationEmail);

    return sendResponse(200, { success: true, bookingNumber, totalAmount });
  } catch (error) {
    console.error('Fel:', error);
    return sendResponse(500, { success: false });
  }
  */
    return sendResponse(200, { success: true, newBooking});
  } catch (error) {
    return sendResponse(500, { error: error });
  }

  function calculateTotalAmount(roomType, startDate, endDate) {
    if(roomType === 'suit'){
      const price = 1500;  
    }else if (roomType === 'double'){
      const price = 1000;
    }else if (roomType === 'single'){
      const price = 500;
    }
    const lengthOfStay = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalCost = price*lengthOfStay
    return totalCost;
  }

  function generateBookingNumber() {
    return Math.random()
      .toString(36)
      .substring(2, 6 + 2);
  }

  function generateConfirmationEmail({
    bookingNumber,
    numberOfGuests,
    roomTypes,
    totalAmount,
    checkInDate,
    checkOutDate,
    guestName,
  }) {
    // Implementera logik för att generera innehållet i ett bekräftelsemail

    // Exempel på innehåll i bekräftelsemailet (anpassa efter behov)
    const emailContent = `
        Thank you, ${guestName}, for your booking!

        Bokningsnummer: ${bookingNumber}
        Antal gäster: ${numberOfGuests}
        Rumstyper: ${roomTypes.join(', ')}
        Totalbelopp: ${totalAmount} SEK
        Incheckningsdatum: ${checkInDate}
        Utcheckningsdatum: ${checkOutDate}

        We are looking forward to your visit!
    `;

    return emailContent;
  }

  async function sendEmail(toEmail, subject, body) {
    const params = {
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Body: {
          Text: {
            Data: body,
          },
        },
        Subject: {
          Data: subject,
        },
      },
      Source: 'din-email@example.com', // Uppdatera med din verifierade e-postadress i SES
    };

    try {
      await ses.sendEmail(params).promise();
    } catch (error) {
      console.error('Fel vid sändning av e-post:', error);
      throw error;
    }
  }
};

async function bookRooms(roomTypesToBook, availableRooms) {
  const roomsToBook = [];

  for (let type of roomTypesToBook) {
    const roomIndex = availableRooms.findIndex((room) => room.type === type);

    if (roomIndex !== -1) {
      roomsToBook.push(availableRooms[roomIndex]);
      availableRooms.splice(roomIndex, 1);
    }
  }

  //room-databasen uppdateras med bokningen men själva rummen måste också läggas in på bokning-db

  try {
    await db
      .update({
        TableName: 'room-db',
        Key: { id: room.id },
        UpdateExpression:
          'SET #booked = list_append(if_not_exists(#booked, :empty_list), :newBooking)',
        ExpressionAttributeNames: { '#booked': 'booked' },
        ExpressionAttributeValues: {
          ':newBooking': [newBooking],
          ':empty_list': [],
        },
      })
      .promise();
  } catch (error) {
    return sendResponse(400, { error: error });
  }

  return roomsToBook;
}

function validateParameters(firstName, eMail, startDate, endDate, visitors) {
  let validationError = false;
  let errorMessage = '';
  var validEmailRegex = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm;
  // const today = moment(new Date()).format('YYYY-MM-DD');
  const today = moment(new Date(),'YYYY-MM-DD').unix();
  if (firstName.trim() === ''){
    validationError = true;
    errorMessage += ' Firstname is missing, ';
    //  error: errorMessage,
    //  message: 'firstname is missing',
    //});
  }
  
  if (!eMail.match(validEmailRegex)) {
    validationError = true;
    errorMessage += ' eMail is not valid, ';
    //return sendResponse(400, {
    //  error: errorMessage,
    //  message: 'eMail is not valid.',
    //});
  }
  
  
  if (moment(new Date(),'YYYY-MM-DD').unix() >= moment(startDate, 'YYYY-MM-DD').unix()) {
    validationError = true;
    errorMessage += ' Start date needs to be today or later, ';
    //return sendResponse(400, {
    //  error: errorMessage,
    //  message: 'Start date needs to be today or later.',
    //});
  }
  
  if (
    moment(endDate, 'YYYY-MM-DD').unix() <
    moment(startDate, 'YYYY-MM-DD').add(1, 'days').unix()
  ) {
    validationError = true;
    errorMessage += ' End date needs to be at least one day after start date, ';
    //return sendResponse(400, {
    //  error: errorMessage,
    //  message: 'End date needs to be at least one day after start date',
    //});
  }
  
  if (visitors <= 0) {
    validationError = true;
    errorMessage += ' There needs to be at least one visitor, ';
    //return sendResponse(400, {
    //  error: errorMessage,
    //  message: 'There needs to be at least one visitor',
    //});
  }
  
  return errorMessage;
}

function getRoomTypes(visitors) {
  rooms = [];
  let tempVisitors = visitors;
  while (tempVisitors > 2) {
    rooms.push('suit');
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
    return sendResponse(400, { error: error });
  }
}

function hasBookingInDateRange(dates, startDate, endDate) {
  const range = getDatesInRange(startDate, endDate);
  return dates.some((date) => range.includes(date));
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
