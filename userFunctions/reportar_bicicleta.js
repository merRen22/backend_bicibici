'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const TABLE_REPORT = process.env.TABLE_REPORT;
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

app.post('/reportar_bicicleta', (req, res) => {
    var today = new Date();
    const json = JSON.parse(JSON.stringify(req.body));
    var _date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    
    const params = {
        TableName: TABLE_REPORT,
        Item: {
            uuidReport : uuidv1(),
            Date:  _date,
            Description: json.Description,
            Latitude: json.Latitude,
            Longitude: json.Longitude,
            uuidBicycle: json.uuidBicycle
        },
    };

  dynamoDB.put(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido crear el reporte de incidencia'
      })
    }else{
      const {Items} = result;
      res.json({
        sucess: true,
        message: 'El reporte se registro con exito'
      });
    }
  });
});

module.exports.reportar_bicicleta = serverless(app);