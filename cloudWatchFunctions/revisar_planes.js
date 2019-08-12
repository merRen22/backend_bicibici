var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const bodyParser = require('body-parser');

const TABLE_USERS = process.env.TABLE_USERS;
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

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

function dateDiffInDays(a, b) {
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

exports.revisar_planes = async function (event, context, callback) {
  var today = new Date();
  var _date = today.getFullYear() + '-' + (today.getMonth() + 1 ) + '-' + (today.getDate()-1);  

  var users;

  const params = {
    TableName: TABLE_USERS
  };

  await dynamoDB.scan(params, function (error, result){
    if (error) {
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido acceder a los planes'
      })
    } else {
      const {Items} = result;
      users = Items;
    }
  }).promise();


  if (users.length > 0) {

    //Verficar diferencia de fechas menor q numero de dias
    for(let i = 0; i < users.length; i++){
      var values = Object.entries(users[i].Payments)[0].toString().split(',');
      var days = dateDiffInDays(new Date(values[3]),new Date(_date));

      console.log(new Date(values[3]));
      console.log(new Date(_date));

      if(users[i].Activo == 1 && days == 0){
        console.log("Paso la validacion");

        const paramsUpdate = {
          TableName: TABLE_USERS,
          Key: {
            Email: users[i].Email
          },
          UpdateExpression: 'SET #attr = :NewValue',
          ExpressionAttributeNames: {
            '#attr': 'Activo'
          },
          ExpressionAttributeValues: {
            ':NewValue': 0
          }
        };

        await dynamoDB.update(paramsUpdate, function (error, result) {
          if (error) {
            console.log("No se pudo actualzar el estado del usuario " + users[i].Email);
          }else{
            console.log("Cumlpiop con el cambio");
          }
        }).promise();
      }else{
        console.log("No Paso la validacion");
      }
    }
  }
}