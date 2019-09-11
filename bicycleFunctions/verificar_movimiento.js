var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({ endpoint: 'azkptoochbd3i-ats.iot.us-east-1.amazonaws.com:8883' });


let dynamoDB;


const IS_OFFLINE = process.env.IS_OFFLINE;


if (IS_OFFLINE) {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

function Bike(IsIntervened, BicycleID, Longuitude, Available, IsMoving, Latitude) {
  this.IsIntervened = IsIntervened;
  this.BicycleID = BicycleID;
  this.Longuitude = Longuitude;
  this.Available = Available;
  this.IsMoving = IsMoving;
  this.Latitude = Latitude;
}

exports.verificar_movimiento = async function (event, context, callback) {
    const json = JSON.parse(JSON.stringify(event));
  console.log(json)
/*
  var params = {
    topic: 'aws_bici-Policy',
    payload: JSON.stringify({ gaa: "gaaa" }),
    qos: 0
  };

  console.log("metio parametros")
  await iotdata.publish(params, function (err, data) {
    console.log("termino de correr");
    if (err) { console.log("gaaaa" + err, err.stack); }
    else {
      console.log(data);
    }
  }).promise();
  */

    callback(null,{body: JSON.stringify(
      { 
        status: 'success',
        breaksStatus: json.uuidBike == '086654f0-cba4-11e9-b0ff-43245eef2175'?1:0
      })
      
    });

  /*
  var params = {
    Key: {
      BicycleID: json.BicycleID
  }, 
  TableName: "Bicycle"
 };
 
  
 const scan = await dynamoDB.get(params).promise();

 if(scan ==  null){
     console.log("fue nulo");
 }

 var bike = new Bike(
          scan.Item.IsIntervened.N,
          scan.Item.BicycleID.N,
          scan.Item.Longitude.N,
          scan.Item.Available.N,
          scan.Item.IsMoving.N,
          scan.Item.Latitude.N
          )
      
  if(bike.Available == 0 && json.Ismoving == 1){
    callback(null,{body: JSON.stringify({ message: "Call to Police 🚨 🚨 🚨" })});
  }else{
    
    //bike.ismoving = 1;
    
    var paramsUpdate = {
      TableName: "Bicycle",
      Key: {
        BicycleID: json.BicycleID
      },
      UpdateExpression: 'SET #attr1 =:newLongitude , #attr2 =:newIsMoving ,  #attr3 =:newLatitude',
      ExpressionAttributeNames: {
        '#attr1': 'Longitude',
        '#attr2': 'IsMoving',
        '#attr3': 'Latitude'
      },
      ExpressionAttributeValues: {
        ':newLongitude': json.Longitude,
        ':newLatitude': json.Latitude,
        ':newIsMoving': 1
      }
    };
    
    await dynamoDB.update(paramsUpdate, function(err, data) {
      if (err) {
        callback(null,{body: JSON.stringify({ message: "Error al realizar el update 😢 " })});
      } else {
        callback(null,{body: JSON.stringify({ message: "Se actualizo con exito el registro crack 😄 " })});
      }
}).promise();
  }
  */
}
