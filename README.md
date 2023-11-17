/get
- hämta alla bokningar
- (GET)
- GET - https://b1ztk6c127.execute-api.eu-north-1.amazonaws.com/get

/delete/{bookingId}
- ta bort bokning
- (DELETE)
- DELETE - https://b1ztk6c127.execute-api.eu-north-1.amazonaws.com/delete

/change/{bookingId}
- ändra bokning
- (PATCH)
- PATCH - https://b1ztk6c127.execute-api.eu-north-1.amazonaws.com/change/{bookingId}

/add
- lägg till bokning
- (POST)
- POST - https://b1ztk6c127.execute-api.eu-north-1.amazonaws.com/add

- Exempeldata
  {
    "firstName": "Kajsa",
    "eMail": "Kajsa@kajsa.se",
    "startDate": "2023-12-20",
    "endDate": "2023-12-23",
    "visitors": "1"
}


/addRooms
- lägg till rummen nedan i body en (1!) gång i Insomnia
- (POST)
- POST - https://b1ztk6c127.execute-api.eu-north-1.amazonaws.com/addRooms

{
  "roomData": [
    {
      "roomId": "1",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "2",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "3",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "4",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "5",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "6",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "7",
      "type": "single",
      "capacity": 1,
      "rate": 500
    },
    {
      "roomId": "8",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "9",
      "type": "suite",
      "capacity": 3,
      "rate": 1500
    },
    {
      "roomId": "10",
      "type": "suite",
      "capacity": 3,
      "rate": 1500
    },
    {
      "roomId": "11",
      "type": "suite",
      "capacity": 3,
      "rate": 1500
    },
    {
      "roomId": "12",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "13",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "14",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "15",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "16",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "17",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "18",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "19",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    },
    {
      "roomId": "20",
      "type": "double",
      "capacity": 2,
      "rate": 1000
    }
  ]
}
