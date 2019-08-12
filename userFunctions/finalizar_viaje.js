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

app.post('/finalizar_viaje', async (req, res, next) => {
  var today = new Date();
  var bikeUpdate = false;

  //UPDATE BIKE STATUS
  const json = JSON.parse(JSON.stringify(req.body));

  const paramsPutBike = {
    TableName: TABLE_BIKES,
    Key: {
      BicycleID: json.BicycleID
      },
    UpdateExpression: 'SET #row =:Status ',
    ExpressionAttributeNames: {
      '#row': 'Available',
    },
    ExpressionAttributeValues: {
      ':Status': 1,
    }
  };

  await dynamoDB.update(paramsPutBike, function (error, data) {
    if (error) {
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido actualizar el estado de la bicicelta intentelo nuevamente'
      })
    }
    else {
      bikeUpdate = true;
    }
  }).promise();

  if (bikeUpdate) {
    var _date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

    const paramsgetUser = {
      Key: {
        Email: json.Email
      },
      TableName: TABLE_USERS
    };

    var fecha_inicio = "";
    var ubicacionInicio = "";
    var values;
    await dynamoDB.get(paramsgetUser, (error, result) => {
      if (error) {
        console.log(error);
        res.status(400).json({
          error: 'No se ha podido acceder a los datos del usuario'
        })
      }
      else {
        fecha_inicio = Object.keys(result.Item.Trips)[Object.keys(result.Item.Trips).length - 1];
        values = Object.entries(result.Item.Trips)[Object.keys(result.Item.Trips).length - 1].toString().split(',');
        ubicacionInicio = values[3];
      }
    }).promise();

    if (fecha_inicio != "") {

      const paramsPutUser = {
        TableName: TABLE_USERS,
        Key: {
          Email: json.Email,
        },
        UpdateExpression: 'SET #mapName.#Trip =:StringSet',
        ExpressionAttributeNames: {
          '#mapName': 'Trips',
          '#Trip': fecha_inicio
        },
        ExpressionAttributeValues: {
          ':StringSet': [
            json.BicycleID,
            _date,
            parseInt(ubicacionInicio,10),
            json.Ubicacion
          ],
        }
      };

      //UPDATE USER TRIPS
      await dynamoDB.update(paramsPutUser, function (error, data) {
        if (error) {
          console.log(error);
          res.status(400).json({
            error: 'No se ha podido cerrar el viaje siga intentando por favor'
          })
        } else {
          res.status(200).json({
            message: 'Se dio por finalizado el viaje exitosamente'
          })
        }
      }).promise();
    }

  }
});

module.exports.finalizar_viaje = serverless(app);