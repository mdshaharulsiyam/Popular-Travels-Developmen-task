const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000
const cors = require('cors')
require('dotenv').config()
// middleware
app.use(express.json())
app.use(cors({
  origin: ['https://popular-travels-developmen-taskt.vercel.app', 'http://localhost:5173'],
  credentials: true,
  optionSuccessStatus: 200
}));
app.use(cookieParser())
// database cunnection 
const client = new MongoClient(`${process.env.DB_URI}`, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// cullections 

const Ticket = client.db("Travel").collection("Ticket")
// verify jwt 

async function run() {
  try {
    app.get('/ticket', async (req, res) => {
      const { departure, arrival, Pasenger, date } = req.query;
      let filter = {};
      if (departure !== 'undefined') filter['itineraries.segments.departure.iataCode'] = departure;
      if (arrival !== 'undefined') filter['itineraries.segments.arrival.iataCode'] = arrival;
      if (date !== 'undefined') filter['itineraries.segments.departure.at'] = { $regex: `${date}`, $options: 'i' };
      let filterOptions = {}
      if (Object.keys(filter).length !== 0) {
        filterOptions = { $and: [] };
        Object.keys(filter).forEach((key) => {
          const obj = {};
          obj[key] = filter[key];
          filterOptions.$and.push(obj);
        });
      }

      const tickets = await Ticket.find(filterOptions).toArray();
      if (Pasenger !== 'undefined') {
        const newTicket = tickets.filter(item => item.seat[0].includes(Pasenger))
        res.send(newTicket)
      } else {

        res.send(tickets);
      }
    })
    app.get('/departure', async (req, res) => {
      const tickets = await Ticket.find({}, 'itineraries.segments.departure.iataCode').toArray();
      const departureIataCodes = tickets.reduce((acc, ticket) => {
        ticket.itineraries.forEach(itinerary => {
          itinerary.segments.forEach(segment => {
            acc.push(segment.departure.iataCode);
          });
        });
        return acc;
      }, []);
      res.send([departureIataCodes]);
    });
    app.get('/arrival', async (req, res) => {
      const tickets = await Ticket.find({}, 'itineraries.segments.arrival.iataCode').toArray();
      const arrivalIataCodes = tickets.reduce((acc, ticket) => {
        ticket.itineraries.forEach(itinerary => {
          itinerary.segments.forEach(segment => {
            acc.push(segment.arrival.iataCode);
          });
        });
        return acc;
      }, []);
      res.send([arrivalIataCodes]);
    });
    app.get('/seat', async (req, res) => {
      const tickets = await Ticket.find({}, 'seat').toArray();
      const seats = tickets.reduce((acc, ticket) => {
        acc.push(...ticket.seat.flat());
        return acc;
      }, []);
      const uniqueSeats = [...new Set(seats)];
      res.send(uniqueSeats);
    });
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);
app.get('/', async (req, res) => {
  res.send(' Server is running')
})
app.listen(port, () => {
  console.log(`server is runing on port ${port}`)
})