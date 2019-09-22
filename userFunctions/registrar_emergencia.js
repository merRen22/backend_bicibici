'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const TABLE_USERS = process.env.TABLE_USERS;
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

app.post('/registrar_emergencia', async (req, res, next) => {
  const json = JSON.parse(JSON.stringify(req.body));

  const paramsUpdate = {
    TableName: TABLE_USERS,
    Key: {
      uuidUser: json.uuidUser
    },
    UpdateExpression: 'SET #attr1 =:value',
    ExpressionAttributeNames: {
      '#attr1': 'emergencyContact'
    },
    ExpressionAttributeValues: {
      ':value': json.emergencyContact
    }
  };

  await dynamoDB.update(paramsUpdate, function (error, result) {
      if (error) {
        console.log(error);
        res.status(400).json({
          error: 'No se pudo registrar el pago intentelo de nuevo'
        })
      }
      else {
        res.status(200).json({
          message: 'Se registro el pago'
        });
      }
    }).promise();

  }
);

module.exports.registrar_emergencia = serverless(app);