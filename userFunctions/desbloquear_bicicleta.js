'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const geolib = require('geolib');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const TABLE_BIKES = process.env.TABLE_BIKES;
const TABLE_USERS = process.env.TABLE_USERS;
const TABLE_STATIONS = process.env.TABLE_STATIONS;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;

var bikeAvailable = false
var bikeUpdated = false
var uuidStation = ""

if (IS_OFFLINE) {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.json({ string: false }));

//Get bike status
async function getBike(req){
  var parms ={
    TableName: TABLE_BIKES,
    KeyConditionExpression : "#uu = :uuidBike",
    ExpressionAttributeNames: {
      '#uu': 'uuidBike'
    },
    ExpressionAttributeValues: {
      ':uuidBike': req.uuidBike
    }
  };

  await dynamoDB.query(parms, function (error, data) {
    if (error) {
      throw error;
    }
    else {
      bikeAvailable = true;
      uuidStation = data.Items[0].uuidStation
      
      //distancia de usuario a bicicleta menor a 75 metros
      if(geolib.getDistance(
        {latitude: req.originLatitude,longitude: req.originLongitude},
        {latitude: req.destinationLatitude,longitude: req.destinationLongitude}
      )>25
      ){
        throw "La bicicleta solicitada se encuentra demasiado lejos";
      }
    }
  }).promise();

}

//Update bike status
//update station
//update user
//update avaible
//update isMoving
async function updateBike(req){
  var parmsUpdateBike ={
    TableName: TABLE_BIKES,
    Key: {
      uuidBike: req.uuidBike
    },
    UpdateExpression: 'SET #attr1 =:newAvailable, #attr2 =:newIsMoving, #attr3 =:newStation, #attr4 =:newUser',
    ExpressionAttributeNames: {
      '#attr1': 'available',
      '#attr2': 'isMoving',
      '#attr3': 'uuidStation',
      '#attr4': 'uuidUser'
    },
    ExpressionAttributeValues: {
      ':newAvailable': 1,
      ':newIsMoving': 1,
      ':newStation': req.uuidStation,
      ':newUser': req.uuidUser,
    }
  };

  await dynamoDB.update(parmsUpdateBike, function (error, result) {
    if (error) {
      //error de aws de sync
    }
    else {
      bikeUpdated = true;
    }
  }).promise()
}

//Update user
  //Incluir el viaje del usuario
  //Incluir puntuacion del usuario
  //Incluir bicicleta en uso del usuario
async function updateUser(req){    
  var today = new Date();
  let _date = today.getDate()  + '/' + (today.getMonth() + 1) + '/' + today.getFullYear() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let exp = geolib.getDistance(
    {latitude: req.originLatitude,longitude: req.originLongitude},
    {latitude: req.destinationLatitude,longitude: req.destinationLongitude})/10000;
    
  const paramsPutUser = {
    TableName: TABLE_USERS,
    Key: {
      uuidUser: req.uuidUser
    },
    UpdateExpression: 'SET #mapName.#Trip =:StringSet ,#attr2 =:NewValue2, #attr3 = #attr3 + :addXp  ',
    ExpressionAttributeNames: {
      '#mapName': 'trips',
      '#Trip': _date,
      '#attr2': 'uuidBike',
      '#attr3': 'experience',
    },
    ExpressionAttributeValues: {
      ':StringSet': [
        req.uuidBike,
        "none",
        req.originLatitude,
        req.originLongitude,
        req.destinationLatitude,
        req.destinationLongitude,
      ],
      ':addXp':exp,
      ':NewValue2':req.uuidBike
    }
  };

  //UPDATE USER REGISTRATION
  await dynamoDB.update(paramsPutUser, function (error, data) {
    if (error) {throw error;}
  }).promise()
}

//change slots in initial station, end station
async function changeStationsSlots(req)  {

  var paramsInitialStation ={
    TableName: TABLE_STATIONS,
    Key: {
      uuidStation: req.uuidStation
    },
    UpdateExpression: 'SET #attr1 = #attr1 + :newvalue',
    ExpressionAttributeNames: {
      '#attr1': 'availableSlots'
    },
    ExpressionAttributeValues: {
      ':newvalue': 1
    }
  };
  
  await dynamoDB.update(paramsInitialStation, function (error, result) {
    if (error) {
      throw error}
  }).promise();

  var parmsFinalStation ={
    TableName: TABLE_STATIONS,
    Key: {
      uuidStation: uuidStation
    },
    UpdateExpression: 'SET #attr1 = #attr1 - :newvalue',
    ExpressionAttributeNames: {
      '#attr1': 'availableSlots'
    },
    ExpressionAttributeValues: {
      ':newvalue': 1
    }
  };
  
  await dynamoDB.update(parmsFinalStation, function (error, result) {
    if (error) {
      throw error}
  }).promise();
}

app.post('/desbloquearBicicleta', async (req, res, next) => {
  const json = JSON.parse(JSON.stringify(req.body));

  try {
    await getBike(json);
    await updateBike(json);
    await changeStationsSlots(json);
    await updateUser(json);

      res.status(200).json({
        message: 'Se registro con exito el nuevo viaje'
      });
    
  } catch (error) {
      console.error("error obtenido :: " + error);
      res.status(200).json({
        message: 'No se pudo acceder a la bicicleta, intentelo de nuevo'
      });
  }
});

module.exports.desbloquear_bicicleta = serverless(app);


