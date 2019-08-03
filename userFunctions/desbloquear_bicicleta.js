'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const TABLE_BIKES = process.env.TABLE_BIKES;
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

app.post('/desbloquearBicicleta',async (req, res,next) => {
    var available;
    var isIntervened;
    var today = new Date();

    //UPDATE BIKE STATUS
    const json = JSON.parse(JSON.stringify(req.body));
    
    const paramsGet = {
      Key: {
        BicycleID: json.BicycleID
        }, 
        TableName: TABLE_BIKES
        };

    //GET BIKE TO CHECK AVAILABILITY
    await dynamoDB.get(paramsGet,(error,result)=>{
      if(error){
        console.log(error);
        res.status(400).json({
        error: 'No se ha podido acceder a la estación'
        })
        }
        else{
          available = result.Item.Available;
          isIntervened = result.Item.IsIntervened;
      }}).promise();

    if(available == 0 || isIntervened != 0){
      res.status(400).json({
        error: 'Esta bicicleta no se encuentra disponible actualmente'
        })
    }else{
      //CREATE TRIP FOR USER
      //  [Date_time start,Date_time end,bike_id]
      var _date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

      const paramsPutUser = {
        TableName: TABLE_USERS,
        Item: {
          Email: {"S": json.Email} ,
          Trips: {"M": 
          {
            [_date] :{
          "L":[
            {"N": json.BicycleID },
            {"S": "none"},
          ]
          }
        }
      }
      }
    };

      //UPDATE USER REGISTRATION
      await ddb.putItem(paramsPutUser, function(error,data) {
        if (error) {
          console.log(error);
          res.status(400).json({
          error: 'No se ha podido crear el usuario'
        })
      } else {
        res.status(200).json({
        message: 'Se registro con exito el nuevo viaje'
      })
      }
      }).promise();
    }
});

module.exports.desbloquear_bicicleta = serverless(app);