var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

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

function Bike(IsIntervened,BicycleID,Longuitude,Available,IsMoving,Latitude){  
  this.IsIntervened = IsIntervened;
  this.BicycleID = BicycleID;
  this.Longuitude = Longuitude;
  this.Available = Available;
  this.IsMoving = IsMoving;
  this.Latitude = Latitude;
}

exports.mensaje_emergencia = async function(event, context, callback){
  const json = JSON.parse(JSON.stringify(event));
  console.log(json)
  callback(null,{body: JSON.stringify({ message: "user notified" })});
  
}
