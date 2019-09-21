'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const TABLE_REPORT = process.env.TABLE_REPORT;
const TABLE_USERS = process.env.TABLE_USERS;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;

if(IS_OFFLINE){
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
}else{
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.json({string: false}));

app.post('/reportar_bicicleta', async (req, res) => {
  
  var today = new Date();
  const json = JSON.parse(JSON.stringify(req.body));
  var _date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear()  + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  
  //CREATE BIKE REPORT
  const params = {
    TableName: TABLE_REPORT,
    Item: {
      uuidReport : uuidv1(),
      date: _date,
      description: json.description,
      latitude: json.latitude,
      state : 1,
      longitude: json.longitude,
      uuidBike: json.uuidBike
    },
  };

  await dynamoDB.put(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido crear el reporte de incidencia'
      })
    }else{
      const {Items} = result;
    }
  }).promise();

  //UPDATE USER PUNTUATION
  const paramsPutUser = {
    TableName: TABLE_USERS,
    Key: {
      uuidUser: json.uuidUser,
    },
    UpdateExpression: 'SET #attr =:points',
    ExpressionAttributeNames: {
      '#attr': 'experience'
    },
    ExpressionAttributeValues: {
      ':points': 5,
    }
  };

  //UPDATE USER POINTS
  await dynamoDB.update(paramsPutUser, function (error, data) {
    if (error) {
      console.log(error);
      res.json({
        sucess: false,
        message: 'Error',
        data: 'No se pudo actualizar los puntos del usuario'
      });
    } else {
      res.status(200).json({
        sucess: true,
        message: 'puntuaje actualizado',
        data: 'Se creo el reporte exitosamente'
      })
    }
  }).promise();
});

module.exports.reportar_bicicleta = serverless(app);  