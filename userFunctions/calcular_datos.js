'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

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

app.post('/calcular_datos', (req, res) => {
    const json = JSON.parse(JSON.stringify(req.body));
  const params = {
    TableName: TABLE_USERS,
    Key: {
        Email: json.Email
    },
  };

  dynamoDB.get(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido acceder a los planes'
      })
    }else{
      const {Items} = result;
      res.json({
        sucess: true,
        message: 'Planes listos',
        data: [
            {"tiempo" : 45},
            {"Viejes" : Object.keys(result.Item.Trips).length},
        ]
      });
    }
  });
});

module.exports.calcular_datos = serverless(app);