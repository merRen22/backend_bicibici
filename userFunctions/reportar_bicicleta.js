'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

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
    var _date = today.getFullYear() + '-' + (today.getMonth()) + '-' + today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    
    const params = {
        TableName: TABLE_REPORT,
        Item: {
            ReportDate: json.Email + " - " + _date,
            Description: json.Description,
            Latitude: json.Latitude,
            Longitude: json.Longitude,
            BicycleID: json.BicycleID
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