const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

exports.handler = async (event, context) => {
  const newBooking = JSON.parse(event.body);
  const { id, firstname, email, startDate, endDate, visitors, roomTypes } = newBooking;

  try {
    // Validera inmatningsparametrar (lägg till valideringslogik här)

    // Beräkna totalbeloppet baserat på rumstyper och nätter
    const totalAmount = calculateTotalAmount(roomTypes, startDate, endDate);

    // Generera ett bokningsnummer (implementera din egen logik)
    const bookingNumber = generateBookingNumber();

    // Skicka bekräftelsemail
    const confirmationEmail = generateConfirmationEmail({
        bookingNumber,
        numberOfGuests: visitors.length,
        roomTypes,
        totalAmount,
        checkInDate: startDate,
        checkOutDate: endDate,
        guestName: firstname,
    });

    // Spara bokningsdetaljer i DynamoDB
    await db
      .put({
        TableName: 'booking-db',
        Item: {
          id,
          firstname,
          email,
          startDate,
          endDate,
          visitors,
          roomTypes,
          bookingNumber,
          totalAmount,
        },
      })
      .promise();

    // Skicka bekräftelsemail
    await sendEmail(email, 'Bokningsbekräftelse', confirmationEmail);

    return sendResponse(200, { success: true, bookingNumber, totalAmount });
  } catch (error) {
    console.error('Fel:', error);
    return sendResponse(500, { success: false });
  }
};

function calculateTotalAmount(roomTypes, startDate, endDate) {
    // Implementera logik för att beräkna totalbeloppet baserat på rumstyper och nätter
}

function generateBookingNumber() {
    // Implementera logik för att generera ett bokningsnummer

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

