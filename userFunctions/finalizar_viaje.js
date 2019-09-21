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

app.use(bodyParser.json({ string: false }));

app.post('/finalizar_viaje', async (req, res, next) => {
  var today = new Date();
  var bikeUpdate = false;

  //TOMO EL uuid de la estacion final
  const json = JSON.parse(JSON.stringify(req.body));
  var parms ={
    TableName: TABLE_BIKES,
    KeyConditionExpression : "#uu = :uuidBike",
    ExpressionAttributeNames: {
      '#uu': 'uuidBike'
    },
    ExpressionAttributeValues: {
      ':uuidBike': json.uuidBike
    }
  };

  var available = false
  var uuidStation
  await dynamoDB.query(parms, function (error, data) {
    if (error) {
      console.log(error)
      //error de aws de sync
    }
    else {
      available = true;
      uuidStation = data.Items[0].uuidStation
    }
  }).promise();

  // bici en movimiento
  var parmsUpdateBike ={
    TableName: TABLE_BIKES,
    Key: {
      uuidBike: json.uuidBike
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
  if(available)
  {
 

    var _date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

    const paramsgetUser = {
      Key: {
        uuidUser: json.uuidUser
      },
      TableName: TABLE_USERS
    };

    var fecha_inicio = "";
    var originLatitude = 0.0;
    var originLongitude = 0.0;
    var destinationLatitude = 0.0;
    var destinationLongitude = 0.0;
    var values;
    await dynamoDB.get(paramsgetUser, (error, result) => {
      if (error) {
        console.log(error);
        res.status(400).json({
          error: 'No se ha podido acceder a los datos del usuario'
        })
      }
      else {
        fecha_inicio = Object.keys(result.Item.trips)[Object.keys(result.Item.trips).length - 1];
        values = Object.entries(result.Item.trips)[Object.keys(result.Item.trips).length - 1].toString().split(',');
        originLatitude = values[2];
        originLongitude = values[3];
        destinationLatitude = values[4];
        destinationLongitude = values[5];
      }
    }).promise();

    //revisar se enucntra cerca d ela posicion de destino
    if(
      geolib.isPointWithinRadius(
          { latitude: destinationLatitude, longitude: destinationLongitude },
          { latitude: json.latitude, longitude: json.longitude },5
          )
    ){


      try {
        await dynamoDB.update(parmsUpdateBike, function (error, result) {
          if (error) {
            console.log(error)
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

 // aumentar slot
 var parmsUpdateStation ={
  TableName: TABLE_STATIONS,
  Key: {
    uuidStation: uuidStation
  },
  UpdateExpression: 'SET #attr1 = #attr1 + :newvalue',
  ExpressionAttributeNames: {
    '#attr1': 'availableSlots'
  },
  ExpressionAttributeValues: {
    ':newvalue': 1
  }
};


  await dynamoDB.update(parmsUpdateStation, function (error, result) {
    if (error) {
      //error de aws de sync
      console.log(error)
      bikeUpdated = false;
    }
    else {
      bikeUpdated = true;
    }
  }).promise();

      
    if (fecha_inicio != "") {
      const paramsPutUser = {
        TableName: TABLE_USERS,
        Key: {
          uuidUser: json.uuidUser,
        },
        UpdateExpression: 'SET #mapName.#Trip =:StringSet',
        ExpressionAttributeNames: {
          '#mapName': 'trips',
          '#Trip': fecha_inicio
        },
        ExpressionAttributeValues: {
          ':StringSet': [
            json.uuidBike,
            _date,
            originLatitude,
            originLongitude,
            destinationLatitude,
            destinationLongitude
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


    }else{
      res.status(200).json({
        message: 'No se encuentra en el estacionamiento'
      })
    }
      
    }
  }
);

module.exports.finalizar_viaje = serverless(app);