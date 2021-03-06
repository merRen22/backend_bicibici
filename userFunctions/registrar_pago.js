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

app.post('/registrar_pago', async (req, res, next) => {
  const json = JSON.parse(JSON.stringify(req.body));
  var startDate = new Date();
  var endDate = new Date();

  endDate.setDate(startDate.getDate() + json.Duration);

  var _date = startDate.getDate() + '/' + (startDate.getMonth() + 1) + '/' + startDate.getFullYear();
  var _dateEnd = endDate.getDate() + '/' + (endDate.getMonth() + 1) + '/' + endDate.getFullYear();

  const paramsPayment = {
    TableName: TABLE_USERS,
    Key: {
      uuidUser: json.uuidUser
    },
    UpdateExpression: 'SET #mapName.#Payment =:StringSet, #attr = :NumberValue ',
    ExpressionAttributeNames: {
      '#mapName': 'payments',
      '#Payment': _date,
      '#attr': 'activo'
    },
    ExpressionAttributeValues: {
      ':StringSet': [
        json.Duration.toString(),
        json.Amount.toString(),
        _dateEnd
      ],
      ':NumberValue': 1
    }
  };

  await dynamoDB.update(paramsPayment, function (error, result) {
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

module.exports.registrar_pago = serverless(app);