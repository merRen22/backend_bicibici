const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var AWS = require('aws-sdk');
let dynamoDB;

const TABLE_BIKES = process.env.TABLE_BIKES;
const IS_OFFLINE = process.env.IS_OFFLINE;


if (IS_OFFLINE) {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

module.exports.verificar_movimiento = serverless(app);


app.use(bodyParser.json({ string: false }));

app.post('/verificar_movimiento', async (req, res) => {
  const json = JSON.parse(JSON.stringify(req.body));

    console.log(json.uuidBike)

    const params = {
      Key: {
        uuidBike: json.uuidBike
      },
      TableName: TABLE_BIKES
    };

    var bike;

    await dynamoDB.get(params, (error, result) => {
      if (error) {
        console.log(error);
        res.status(400).json({
          error: 'No se ha podido acceder a la bicicleta'
        })
      } else {
        console.log("data de resultado :: " + result.Item)
        bike = result.Item;
      }
    }).promise();

    
  if(parseFloat(json.latitude.toString()) != 0.0 && parseFloat(json.latitude.toString()) != 0.0){      
    const paramsUpdate = {
      TableName: TABLE_BIKES,
      Key: {
        uuidBike: json.uuidBike
      },
      UpdateExpression: 'SET #attr1 = :NewValue1 , #attr2 = :NewValue2, #attr3 = :NewValue3',
      ExpressionAttributeNames: {
        '#attr1': 'latitude',
        '#attr2': 'longitude',
        '#attr3': 'isMoving',
      },
      ExpressionAttributeValues: {
        ':NewValue1': json.latitude,
        ':NewValue2': json.longitude,
        ':NewValue3': json.isMoving
      }
    };
   
    await dynamoDB.update(paramsUpdate, function (error, result) {
      if (error) {
        console.log("No se pudo actualzar el estado de la bicicleta " + json.uuidBike);
      }
    }).promise();
  }else{
    console.log("ubicacion falladas")
  }

  if(bike.available == 0 && json.isMoving == 1){
    res.json({
      status: 'success',
      breaksStatus: 1
    });
  }else{
    res.json({
      status: 'success',
      breaksStatus: 0
    });
  }
    
});