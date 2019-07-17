'use strict';
const dynamodb = require('./dynamodb');

module.exports.verificar_movimiento = async (event, context, callback) => {

    var params = {
        Key: {
            "bicycleID": {
                N: json.bicycleID.toString()
            },
        },
        TableName: "Bicycle"
    };

    const scan = await ddb.getItem(params).promise()

    var bike = new Bike(
        scan.Item.bicycleID.N,
        scan.Item.IsIntervened.N,
        scan.Item.Longuitude.N,
        scan.Item.Available.N,
        scan.Item.IsMoving.N,
        scan.Item.Latitude.N);

    if (bike.Available == 0 && json.ismoving == 1) {
        console.log("The bycicle with ID " + bike.bicycleID.toString() + " has been stolen :'v");
        callback(null, { body: JSON.stringify({ message: "Call to Police 🚨 🚨 🚨" }) });
    } else {

        var paramsUpdate = {
            TableName: "Bike",
            Item: {
                'IsIntervened': { N: bike.IsIntervened },
                'Id': { N: json.id.toString() },
                'Longuitude': { N: json.longuitude.toString() },
                'Available': { N: bike.Available },
                'IsMoving': { N: bike.IsMoving },
                'Latitude': { N: json.latitude.toString() }
            }
        };

        await ddb.putItem(paramsUpdate, function (err, data) {
            if (err) {
                callback(null, { body: JSON.stringify({ message: "Error al realizar el update 😢 " }) });
            } else {
                callback(null, { body: JSON.stringify({ message: "Se actualizo con exito el registro crack 😄 " }) });
            }
        }).promise();
    }
};
