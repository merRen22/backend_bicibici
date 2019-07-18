'use strict';
const serverless = require('serverless-http');
const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();

const bikes_table = process.env.TABLE_BIKES;
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

app.use(bodyParser.json());

app.get = ('/', async (req, res) => {

    console.log(req.toString());

    const {
        BicycleID,
        Longuitude,
        Latitude,
        IsMoving
    } = req.body;

    var params = {
        Key: {
            "BicycleID": { N: bicycleID },
        },
        TableName: bikes_table
    };

    const scan = await dynamoDB.getItem(params).promise()

    var bike = new Bike(
        scan.Item.bicycleID.N,
        scan.Item.IsIntervened.N,
        scan.Item.Longuitude.N,
        scan.Item.Available.N,
        scan.Item.IsMoving.N,
        scan.Item.Latitude.N);

    if (bike.Available == 0 && IsMoving == 1) {
        console.log("The bycicle with ID " + bike.bicycleID.toString() + " has been stolen :'v");
        return res.status(400).json({
            error: "Call to Police 🚨 🚨 🚨"
        });
    } else {
        var paramsUpdate = {
            TableName: "Bike",
            Item: {
                'IsIntervened': { N: bike.IsIntervened },
                'BicycleID': { N: BicycleID.toString() },
                'Longuitude': { N: Longuitude.toString() },
                'Available': { N: bike.Available },
                'IsMoving': { N: bike.IsMoving },
                'Latitude': { N: Latitude.toString() }
            }
        };

        await dynamoDB.putItem(paramsUpdate, function (err, data) {
            if (err) {
                return res.status(400).json({
                    error: "Error al realizar el update 😢 "
                });
            } else {
                res.json({
                    sucess: true,
                    message: "Se actualizo con exito el registro crack 😄 "
                });
            }
        }).promise();
    }
});

module.exports.verificar_movimiento = serverless(app);