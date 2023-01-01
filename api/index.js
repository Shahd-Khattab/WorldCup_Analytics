const Db = process.env.ATLAS_URI;
const express = require("express");
const app = express();
const cors = require("cors");
var bodyParser = require('body-parser')
const axios = require('axios');
require("dotenv").config({ path: "../config.env" }); 
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
const {mongoClient} = require("../conn");

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
// This will help us connect to the database
// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/api/add',async function (req, response) {
  let db_connect = await mongoClient();
  if (!db_connect) res.status(500).send('Systems Unavailable');
  let myquery = {matchNumber: Number(req.body.matchNumber) };
  let myobj = {
    matchNumber: req.body.matchNumber,
    ticketType: req.body.ticketType,
    count: 1
  };
  let newvalues = {
      "$inc" : { 
          "count" : 1,
      }
  };
  db_connect.collection("analytics").findOne( myquery, function(error, result) {
      if (!error) {
        if (result) {
          db_connect
          .collection("analytics")
          .updateOne(myquery, newvalues, function (err, res) {
              console.log("Quantity updated");
              response.json(res);
              
          });
          console.log("Item exists");
        } else {
          db_connect.collection("analytics").insertOne(myobj, function (err, res) {
              if (err) throw err;
              response.json(res);
            });
          console.log("Item not exists");
        }
      } else {
        console.log("MongoDB error");
      }
    });   
});
app.get('/api/get',async function (req, res) {
  let db_connect = await mongoClient();
  if (!db_connect) res.status(500).send('Systems Unavailable');
  db_connect.collection("analytics").find({}).sort({"count":-1}).limit(5).toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});
app.post('/api/add/stats',async function (req, response) {
  let db_connect = await mongoClient();
  if (!db_connect) res.status(500).send('Systems Unavailable');
  let myquery = {Number: Number(req.body.Number) };
  let newvalues;
  let myobj;
  let PendingPercentage;
  let ReservedPercentage;
  let CancelledPercentage;
  const cursor = db_connect.collection("statistics").find({});
  const allValues = await cursor.toArray();

  if(req.body.ticketType==='TICKET_PENDING'){
     myobj = {
      Number: req.body.Number,
      Pending:1,
      Reserved:0,
      Cancelled:0,
      PendingPercentage: (1/1)*100,
      ReservedPercentage: (0/1)*100,
      CancelledPercentage: (0/1)*100,
      count: 1
  };
  allValues.map(function(element){
    PendingPercentage=((element.Pending+1)/ (element.count+1))*100,
    ReservedPercentage=((element.Reserved)/(element.count+1))*100,
    CancelledPercentage=((element.Cancelled)/(element.count+1))*100

});
 
     newvalues = {
              "$inc" : { 
                  "Pending" : 1,
                  "count" :1,

              },
              "$set" : { 
                "PendingPercentage":PendingPercentage,
                "ReservedPercentage":ReservedPercentage,
                "CancelledPercentage":CancelledPercentage

            }
          };
  
  }
  if(req.body.ticketType==='TICKET_RESERVED'){
     myobj = {
      Number: req.body.Number,
      Pending:0,
      Reserved:1,
      Cancelled:0,
      count: 1,
      PendingPercentage: (0/1)*100,
      ReservedPercentage: (1/1)*100,
      CancelledPercentage: (0/1)*100,
  };
  allValues.map(function(element){
    PendingPercentage=((element.Pending)/ (element.count+1))*100,
    ReservedPercentage=((element.Reserved+1)/(element.count+1))*100,
    CancelledPercentage=((element.Cancelled)/(element.count+1))*100

});
     newvalues = {
            "$inc" : { 
                "Reserved" : 1,
                "count" :1
            },
            "$set" : { 
              "PendingPercentage":PendingPercentage,
              "ReservedPercentage":ReservedPercentage,
              "CancelledPercentage":CancelledPercentage

          }
        };
  }
  if(req.body.ticketType==='TICKET_CANCELLED'){
       myobj = {
        Number: req.body.Number,
        Pending:0,
        Reserved:0,
        Cancelled:1,
        count: 1,
        PendingPercentage: (0/1)*100,
        ReservedPercentage: (0/1)*100,
        CancelledPercentage: (1/1)*100,
  };
  allValues.map(function(element){
    PendingPercentage=((element.Pending)/ (element.count+1))*100,
    ReservedPercentage=((element.Reserved)/(element.count+1))*100,
    CancelledPercentage=((element.Cancelled+1)/(element.count+1))*100

});
       newvalues = {
          "$inc" : { 
              "Cancelled" : 1,
              "count" :1
          },
          "$set" : { 
            "PendingPercentage":PendingPercentage,
            "ReservedPercentage":ReservedPercentage,
            "CancelledPercentage":CancelledPercentage
        }
      };
  }
 
 
  db_connect.collection("statistics").findOne( myquery, function(error, result) {
      if (!error) {
        if (result) {
          db_connect
          .collection("statistics")
          .updateOne(myquery, newvalues, function (err, res) {
              response.json(res);
              
          });
        } else {
          db_connect.collection("statistics").insertOne(myobj, function (err, res) {
              if (err) throw err;
              response.json(res);
            });
        }
      }
    });   
});
app.get('/api/get/stats', async function (req, res) {
  let db_connect = await mongoClient();
  if (!db_connect) res.status(500).send('Systems Unavailable');
  db_connect
  .collection("statistics")
  .find({})
  .toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
      console.log(result);
  });
  
});

app.listen(3000);