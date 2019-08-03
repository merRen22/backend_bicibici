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

app.post('/finalizar_viaje',async (req, res,next) => {
    var today = new Date();
    var bikeUpdate = false;

    //UPDATE BIKE STATUS
    const json = JSON.parse(JSON.stringify(req.body));
    
    const paramsPutBike = {
        Item: {
          BicycleID: {"N": json.BicycleID.toString()},
          Available: {"N": "1"}
          }, 
          TableName: TABLE_BIKES
          };

    await ddb.putItem(paramsPutBike,function(error,data){
      if(error){
        console.log(error);
        res.status(400).json({
        error: 'No se ha podido actualizar el estado de la bicicelta intentelo nuevamente'
        })
        }
        else{
            bikeUpdate = true;
      }}).promise();
      
      if(bikeUpdate){
      var _date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + "|" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

      
      const paramsgetUser = {
        Key: {
            Email: json.Email
          }, 
          TableName: TABLE_USERS
          };

    
          /*
    var jsonUser = await dynamoDB.get(paramsgetUser);
    console.log(jsonUser);
    */

   console.log("Email :: " + json.Email);
      const paramsPutUser = {
        TableName: TABLE_USERS,
        Key: {
          Email: {"S": json.Email} ,
        },
        UpdateExpression: 'SET Trips.#Trips =:StringSet',
        ExpressionAttributeNames: {
            "#Trips":{
                "S":"2019-8-1|1:20:49"
            }
        },
        ExpressionAttributeValues: {
        ':StringSet': {"SS":[
          json.BicycleID,
          "2019-8-1|1:20:49",
          ]},
    }
    };
    

      //UPDATE USER TRIPS
      await dynamoDB.update(paramsPutUser, function(error,data) {
        if (error) {
          console.log(error);
          res.status(400).json({
          error: 'No se ha podido cerrar el viaje siga intentando por favor'
        })
      } else {
        res.status(200).json({
        message: 'Se dio por finalizado el viaje exitosamente'
      })
      }
      }).promise();
    }
});

module.exports.finalizar_viaje = serverless(app);