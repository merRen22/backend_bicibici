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

if (IS_OFFLINE) {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

var fecha_inicio = "";
var destinationLatitude = 0.0;
var destinationLongitude = 0.0;
var values;

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
      console.log(error)
      throw error;
    }
    else {
      if(geolib.getDistance(
        {latitude: req.latitude,longitude: req.longitude},
        {latitude: data.Items[0].latitude,longitude: data.Items[0].longitude}
      )>75
      ){
        throw "Usuario no se encuentra con la bicicleta";
      }
    }
  }).promise();
}

async function getUser(req){
  const paramsgetUser = {
    Key: {
      uuidUser: req.uuidUser
    },
    TableName: TABLE_USERS
  };

  await dynamoDB.get(paramsgetUser, (error, result) => {
    if (error) {
      console.log(error)
      throw error;
    }
    else {
      fecha_inicio = Object.keys(result.Item.trips)[Object.keys(result.Item.trips).length - 1];
      values = Object.entries(result.Item.trips)[Object.keys(result.Item.trips).length - 1].toString().split(',');
      destinationLatitude = values[5];
      destinationLongitude = values[4];
    }
  }).promise();
}

async function updateBike(req){
  if(
    geolib.isPointWithinRadius(
      { latitude: destinationLatitude, longitude: destinationLongitude },
      { latitude: req.latitude, longitude: req.longitude },20
      )
  ){
    var parmsUpdateBike ={
      TableName: TABLE_BIKES,
      Key: {
        uuidBike: req.uuidBike
      },
      UpdateExpression: 'SET #attr1 =:newAvailable, #attr2 =:newIsMoving',
      ExpressionAttributeNames: {
        '#attr1': 'available',
        '#attr2': 'isMoving'
      },
      ExpressionAttributeValues: {
        ':newAvailable': 0,
        ':newIsMoving': 0
      }
    };

    await dynamoDB.update(parmsUpdateBike, function (error, result) {
      if (error) {
        console.log(error)
        throw error;
      }
    }).promise();
  }else{
    throw "Usuario no se encuentra cerca de la estación";
  }
}

async function updateUser(req){
  var today = new Date();
  var _date = today.getDate() + '/' + (today.getMonth() + 1) + '/' +today.getFullYear() + 
  "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

  const paramsPutUser = {
    TableName: TABLE_USERS,
    Key: {
      uuidUser: req.uuidUser,
    },
    UpdateExpression: 'SET #mapName.#Trip['+1+'] =:StringSet, #attr2 =:NewValue2 ',
    ExpressionAttributeNames: {
      '#mapName': 'trips',
      '#attr2': 'uuidBike',
      '#Trip': fecha_inicio
    },
    ExpressionAttributeValues: {
      ':StringSet': _date,
      ':NewValue2':'none'
    }
  };


  await dynamoDB.update(paramsPutUser, function (error, data) {
    if (error) {
      console.log(error)
      throw error;
    }
  }).promise();
  }

app.use(bodyParser.json({ string: false }));

app.post('/finalizar_viaje', async (req, res, next) => {

  const json = JSON.parse(JSON.stringify(req.body));
  
    try {
      await getBike(json);
      await getUser(json);
      await updateBike(json);
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
  }
);

module.exports.finalizar_viaje = serverless(app);