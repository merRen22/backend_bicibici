var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const TABLE_USERS = process.env.TABLE_USERS;
const IS_OFFLINE = process.env.IS_OFFLINE;

let dynamoDB;

if(IS_OFFLINE){
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
}else{
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}


exports.registrar_usuario = async function(event, context, callback){
    //Only trigger when user has confirmed his email and singup in cognito
    //CognitTrigger :: PostAuthentication
    console.log("evento " + event)
    console.log("evento request " + event.request)
    console.log("evento request type " + event.request.eventType)
    console.log("evento request type " + event.request.triggerSource)
    console.log("Correo de usuario " + event.request.userAttributes.email);
    var params = {
        TableName: TABLE_USERS,
        Item: {
            uuidUser : event.request.userAttributes.email,
            trips : {},
            payments: {},
            activo: 0,
            experience: 0,
            emergencyContact: "none"
        }
    };

    //only for uncofirmed accounts
    if(event.request.userAttributes.email_verified != "true"){
      // Call DynamoDB to add the item to the table
      await dynamoDB.put(params, function(err, data) {
        if (err) {
            console.log("Error" + err);
        } else {
            console.log("Usuario creado con exito");
        }
    });

    }
    
    
    callback(null, event);

    //END FUNCTION
    //https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html 
}