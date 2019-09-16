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

app.post('/usuario', (req, res) => {
  const json = JSON.parse(JSON.stringify(req.body));

  const params = {
    Key: {
      uuidUser: json.uuidUser, 
        }, 
    TableName: TABLE_USERS
  };

  dynamoDB.get(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        sucess: false,
        message: 'No se pudo obtener data del usuario',
      })
    }else{
      res.json({
        sucess: true,
        message: 'Usuario listo',
        user: result.Item
      });
    }
  });

});

module.exports.obtener_usuario = serverless(app);