const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const requestBody = JSON.parse(event.body);
  const roomData = requestBody.roomData;

  try {
    const putPromises = roomData.map(async (room) => {
      const params = {
        TableName: 'room-db',
        Item: room,
      };

      await db.put(params).promise();
    });

    await Promise.all(putPromises);

    return sendResponse(200, {
      success: true,
      message: 'Rooms added successfully',
    });
  } catch (error) {
    console.error('Error adding rooms:', error);
    return sendResponse(500, { message: 'Could not add rooms' });
  }
};

const roomData = [
  {
    id: '1',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '2',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '3',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '4',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '5',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '6',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '7',
    type: 'single',
    capacity: 1,
    rate: 500,
  },
  {
    id: '8',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '9',
    type: 'suite',
    capacity: 3,
    rate: 1500,
  },
  {
    id: '10',
    type: 'suite',
    capacity: 3,
    rate: 1500,
  },
  {
    id: '11',
    type: 'suite',
    capacity: 3,
    rate: 1500,
  },
  {
    id: '12',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '13',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '14',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '15',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '16',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '17',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '18',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '19',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
  {
    id: '20',
    type: 'double',
    capacity: 2,
    rate: 1000,
  },
];
