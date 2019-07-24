'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const TABLE_BIKES = process.env.TABLE_BIKES;
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

app.post('/desbloquearBicicleta', (req, res) => {
    const json = JSON.parse(JSON.stringify(req.body));

    //AUN FALTA
    //UPDATE BIKE STATUS

    //PUT UPDATE

    //CREATE TRIP FOR USER

    //PUT CREATE
});

module.exports.desbloquear_bicicleta = serverless(app);