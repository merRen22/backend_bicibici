var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

function Bike(IsIntervened,BicycleID,Longuitude,Available,IsMoving,Latitude){  
  this.IsIntervened = IsIntervened;
  this.BicycleID = BicycleID;
  this.Longuitude = Longuitude;
  this.Available = Available;
  this.IsMoving = IsMoving;
  this.Latitude = Latitude;
}

exports.verificar_movimiento = async function(event, context, callback){
  const json = JSON.parse(JSON.stringify(event));
  
  var params = {
    Key: {
      "BicycleID": {
        N: json.BicycleID.toString()
    }, 
  }, 
  TableName: "Bicycle"
 };
 
  
 const scan = await ddb.getItem(params).promise();

 if(scan ==  null){
     console.log("fue nulo");
 }

 var bike = new Bike(
          scan.Item.IsIntervened.N,
          scan.Item.BicycleID.N,
          scan.Item.Longuitude.N,
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
      Item: {
        'IsIntervened' : {N: bike.IsIntervened},
        'BicycleID' : {N: json.BicycleID.toString()},
        'Longuitude' : {N: json.Longuitude.toString()},
        'Available' : {N: bike.Available},
        'IsMoving' : {N: bike.IsMoving},
        'Latitude' : {N: json.Latitude.toString()}    
      }
    };
    
    await ddb.putItem(paramsUpdate, function(err, data) {
      if (err) {
        callback(null,{body: JSON.stringify({ message: "Error al realizar el update 😢 " })});
      } else {
        callback(null,{body: JSON.stringify({ message: "Se actualizo con exito el registro crack 😄 " })});
      }
}).promise();
  }
}
