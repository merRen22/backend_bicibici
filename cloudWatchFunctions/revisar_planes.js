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

function dateDiffInDays(a, b) {
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

exports.verificar_movimiento = async function (event, context, callback) {
  const json = JSON.parse(JSON.stringify(event));
  var today = new Date();
  var _date = today.getFullYear() + '-' + (today.getMonth()) + '-' + today.getDate();  

  var users;

  const params = {
    TableName: TABLE_USERS
  };

  const paramsRevision = {};

  dynamoDB.scan((params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido acceder a los planes'
      })
    } else {
      users = result.Items;
    }
  }));

  if (users.length > 0) {

    //Verficar diferencia de fechas menor q numero de dias
    users.forEach(element => {
      if(users.Activo == 1 &&
        dateDiffInDays(new Date(Object.entries(element.Trips)[Object.keys(element.Trips).length - 1][2]),new Date(_date))==0
        ){

        const paramsUpdate = {
          TableName: TABLE_USERS,
          Key: {
            Email: element.Email
          },
          UpdateExpression: 'SET #attr =:NewValue',
          ExpressionAttributeNames: {
            '#attr': 'Activo'
          },
          ExpressionAttributeValues: {
            ':NewValue': 0,
          }
        };
  
        dynamoDB.update(paramsUpdate, function (error, result) {
          if (error) {
            console.log("No se pudo actualzar el estado del usuario " + element.Email);
          }
        });
      }
    });
  }
}