'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

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

app.post('/desbloquearBicicleta', async (req, res, next) => {
  var today = new Date();
  var bikeUpdated = false;

  //UPDATE BIKE STATUS
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
    UpdateExpression: 'SET #attr1 =:newAvailable, #attr2 =:newIsMoving, #attr3 =:newStation',
    ExpressionAttributeNames: {
      '#attr1': 'available',
      '#attr2': 'isMoving',
      '#attr3': 'uuidStation'
    },
    ExpressionAttributeValues: {
      ':newAvailable': 1,
      ':newIsMoving': 1,
      ':newStation': json.uuidStation
    }
  };
  if(available)
  {
    try {
      await dynamoDB.update(parmsUpdateBike, function (error, result) {
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
  }
 // aumentar slot en el inicio
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
if(bikeUpdated)
{
  try {
    await dynamoDB.update(parmsUpdateStation, function (error, result) {
      if (error) {
        //error de aws de sync
        bikeUpdated = false;
      }
      else {
        bikeUpdated = true;
      }
    }).promise();
  } catch (error) {
    if (bikeUpdated == false) {
      console.error("error obtenido :: " + error);
      res.status(400).json({
        error: 'No se pudo crear el movimiento, intentelo de nuevo'
      });
    }
  }
}
//quitar slot en el final
  var parmsUpdateStation2 ={
  TableName: TABLE_STATIONS,
  Key: {
    uuidStation: json.uuidStation
  },
  UpdateExpression: 'SET #attr1 = #attr1 - :newvalue',
  ExpressionAttributeNames: {
    '#attr1': 'availableSlots'
  },
  ExpressionAttributeValues: {
    ':newvalue': 1
  }
};
if(bikeUpdated)
{
  try {
    await dynamoDB.update(parmsUpdateStation2, function (error, result) {
      if (error) {
        //error de aws de sync
        bikeUpdated = false;
      }
      else {
        bikeUpdated = true;
      }
    }).promise();
  } catch (error) {
    if (bikeUpdated == false) {
      console.error("error obtenido :: " + error);
      res.status(400).json({
        error: 'No se pudo crear el movimiento, intentelo de nuevo'
      });
    }
  }
}
  //USER MAP

  if (bikeUpdated == false) {
    res.status(400).json({
      error: 'Esta bicicleta no se encuentra disponible actualmente'
    });
  } else {
    //CREATE TRIP FOR USER
    //  [Date_time start,Date_time end,bike_id]
    var _date = 
    today.getDate()  + '/' + (today.getMonth() + 1) + '/' + today.getFullYear() + "|" + 
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    
    const paramsPutUser = {
      TableName: TABLE_USERS,
      Key: {
        uuidUser: json.uuidUser
      },
      UpdateExpression: 'SET #mapName.#Trip =:StringSet',
      ExpressionAttributeNames: {
        '#mapName': 'trips',
        '#Trip': _date
      },
      ExpressionAttributeValues: {
        ':StringSet': [
          json.uuidBike,
          "none",
          json.originLatitude,
          json.originLongitude,
          json.destinationLatitude,
          json.destinationLongitude,
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