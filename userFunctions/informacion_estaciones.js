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

app.get('/', (req, res) => {
  const params = {
    TableName: TABLE_STATIONS
  };

  dynamoDB.scan(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido acceder a las estaciones'
      })
    }else{
      const {Items} = result;
      res.json({
        sucess: true,
        message: 'Estaciones listas',
        plans: Items
      });
    }
  });
});

module.exports.informacion_estaciones = serverless(app);