var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.registrar_usuario = async function(event, context, callback){
    String email = event.request.userAttributes.email;
    //CRETEATE USER IN DYNAMO DB
    //END FUNCTION
    //https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html 
}