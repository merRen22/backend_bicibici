
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({ endpoint: 'azkptoochbd3i-ats.iot.us-east-1.amazonaws.com:8883' });


let dynamoDB;


const IS_OFFLINE = process.env.IS_OFFLINE;


if (IS_OFFLINE) {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

function Bike(IsIntervened, BicycleID, Longuitude, Available, IsMoving, Latitude) {
  this.IsIntervened = IsIntervened;
  this.BicycleID = BicycleID;
  this.Longuitude = Longuitude;
  this.Available = Available;
  this.IsMoving = IsMoving;
  this.Latitude = Latitude;
}


module.exports.verificar_movimiento = serverless(app);


app.use(bodyParser.json({string: false}));

app.post('/verificar_movimiento', (req, res) => {
  
    const json = JSON.parse(JSON.stringify(req.body));
    console.log(json)
    
      res.json({
        status: 'success',
        breaksStatus: json.uuidBike== '086654f0-cba4-11e9-b0ff-43245eef2175'?1:0
      });
  
});