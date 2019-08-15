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

exports.verificar_movimiento = async function(event, context, callback){
  const json = JSON.parse(JSON.stringify(event));
  
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
}
