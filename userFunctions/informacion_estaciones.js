'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const TABLE_STATIONS = process.env.TABLE_STATIONS;
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

app.post('/estacion', (req, res) => {
  const json = JSON.parse(JSON.stringify(req.body));

  const params = {
    Key: {
      StationID: json.StationID, 
        }, 
    TableName: TABLE_STATIONS
  };

  dynamoDB.get(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido acceder a la estación'
      })
    }else{
      res.json({
        sucess: true,
        message: 'Estación lista',
        plans: result.Item
      });
    }
  });

});

module.exports.informacion_estaciones = serverless(app);