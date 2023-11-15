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
  const { id, firstname, email, startDate, endDate, visitors, bookingNumber } = newBooking;
  try {
    // Validera inmatningsparametrar (lägg till valideringslogik här)
    //validateParameters(newBooking.firstname, newBooking.email, newBooking.startDate, newBooking.endDate, newBooking.visitors)

    // Beräkna totalbeloppet baserat på rumstyper och nätter
    //const totalAmount = calculateTotalAmount(roomTypes, startDate, endDate);

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
          "id": id,
          "name": firstname,
          "email": email,
          "startDate": startDate,
          "endDate": endDate,
          "visitors": visitors,
          "bookingNumber": bookingNumber
        }
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
  return sendResponse(200, { success: true});
} catch (error){
  return sendResponse(500, {error: error});
};

function validateParameters(firstname, email, startDate, endDate, visitors){
  var validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const today = moment(new Date()).format("YYYY-MM-DD");
  let errorMessage = "";
  if (!firstname){
    errorMessage += " Firstname is missing. ";
  }
  if (!email.match(validEmailRegex)){
    errorMessage += " eMail is not valid. ";
  }
  if (!startDate >= today){
    errorMessage += " Start date needs to be today or later. ";
  }
  if (!endDate >= moment(startDate).add(1, 'days')){
    errorMessage += " End date needs to be at least one day after start date ";
  }
  if(!visitors > 0){
    errorMessage += " There needs to be at least one visitor ";
  }
}
function getRoomTypes(visitors){
  rooms = [];
  let tempVisitors = visitors
  while(tempVisitors > 2){
    rooms.put("suit");
    tempVisitors - 3;
  }
  while(tempVisitors > 1){
    rooms.put("double");
    tempVisitors - 2;
  }
  if(tempVisitors == 1){
    rooms.put("single");
  }
  return rooms;

}

function calculateTotalAmount(roomTypes, startDate, endDate) {
  // Implementera logik för att beräkna totalbeloppet baserat på rumstyper och nätter
}

function generateBookingNumber() {
    return Math.random().toString(36).substring(2, 6+2);
  };

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
}}
