var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const TABLE_USERS = process.env.TABLE_USERS;

exports.registrar_usuario = async function(event, context, callback){
    //CRETEATE USER IN DYNAMO DB

    //Only trigger when user has confirmed his email and singup in cognito
    //CognitTrigger :: PostAuthentication
    console.log("Correo de usuario " + event.request.userAttributes.email);
    var params = {
        TableName: TABLE_USERS,
        Item: {
            'Email' : {S: event.request.userAttributes.email}
        }
    };

    /*

            'Payments':{M: [""]},
            'Trips':{M: [""]},
    
    */
    
    // Call DynamoDB to add the item to the table
    await ddb.putItem(params, function(err, data) {
        if (err) {
            console.log("Error" + err);
            //callback(null,{body: JSON.stringify({ message: "No se ha podido crear al usuario" })});
            //context.done()
        } else {
            console.log("Usuario creado con exito");
        }
    });
    
    callback(null, event);

    //END FUNCTION
    //https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html 
}