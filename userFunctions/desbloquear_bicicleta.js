'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const TABLE_BIKES = process.env.TABLE_BIKES;
const TABLE_USERS = process.env.TABLE_USERS;
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

app.use(bodyParser.json({ string: false }));

app.post('/desbloquearBicicleta', async (req, res, next) => {
  var today = new Date();
  var bikeUpdated = false;

  //UPDATE BIKE STATUS
  const json = JSON.parse(JSON.stringify(req.body));

  const paramsGet = {
    TableName: TABLE_BIKES,
    Key: {
      BicycleID: json.BicycleID
    },
    UpdateExpression: 'SET #row =:StatusFuture',
    ConditionExpression: "#row = :StatusPresent and #row2 = :Intervened",
    ExpressionAttributeNames: {
      '#row': 'Available',
      '#row2': 'IsIntervened'
    },
    ExpressionAttributeValues: {
      ':StatusFuture': 0,
      ':StatusPresent': 1,
      ':Intervened': 0
    }
  };

  //GET BIKE TO CHECK AVAILABILITY

  try {
    await dynamoDB.update(paramsGet, function (error, result) {
      if (error) {
        //error de aws de sync
      }
      else {
        bikeUpdated = true;
      }
    }).promise();
  } catch (error) {
    if (bikeUpdated == false) {
      console.error("error obtenido :: " + error);
      res.status(400).json({
        error: 'No se pudo acceder a la bicicleta, intentelo de nuevo'
      });
    }
  }

  if (bikeUpdated == false) {
    res.status(400).json({
      error: 'Esta bicicleta no se encuentra disponible actualmente'
    });
  } else {
    //CREATE TRIP FOR USER
    //  [Date_time start,Date_time end,bike_id]
    var _date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

    const paramsPutUser = {
      TableName: TABLE_USERS,
      Key: {
        Email: json.Email
      },
      UpdateExpression: 'SET #mapName.#Trip =:StringSet',
      ExpressionAttributeNames: {
        '#mapName': 'Trips',
        '#Trip': _date
      },
      ExpressionAttributeValues: {
        ':StringSet': [
          json.BicycleID,
          "none",
        ],
      }
    };

    //UPDATE USER REGISTRATION
    await dynamoDB.update(paramsPutUser, function (error, data) {
      if (error) {
        console.log("No se ha podido crear el nuevo viaje " + error);
        res.status(400).json({
          error: 'No se pudo crear el nuevo viaje'
        });
      } else {
        console.log("Se actualizo el registro del usuario ");
        res.status(200).json({
          message: 'Se registro con exito el nuevo viaje'
        });
      }
    }).promise();

  }
});

module.exports.desbloquear_bicicleta = serverless(app);