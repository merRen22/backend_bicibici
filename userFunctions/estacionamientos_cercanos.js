'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const geolib = require('geolib');

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
  dynamoDB = new AWS.DynamoDB.DocumentClient()
}

app.use(bodyParser.json({string: false}));

app.post('/estaciones', (req, res) => {
    const json = JSON.parse(JSON.stringify(req.body));
    var Stations = [];
    
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

      //Display only stations near user position
      //url : https://www.npmjs.com/package/geolib
      //Checks whether a point is inside of a circle or not.
      //distance 5km 

      Items.forEach(function(element) {
        if(
            geolib.isPointWithinRadius(
                { latitude: json.latitude, longitude: json.longitude },
                { latitude: element.latitude, longitude: element.longitude },5000
                )
        ){
            Stations.push(element);}
        });

      res.json({
        sucess: true,
        message: 'Estaciones listas',
        Stations: Stations
        });
    }
  });  
});

module.exports.estacionamientos_cercanos = serverless(app);