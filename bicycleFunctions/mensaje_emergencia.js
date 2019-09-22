'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const TABLE_BIKES = process.env.TABLE_BIKES;
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

app.use(bodyParser.json({ string: false }));


app.post('/verificar_movimiento', async (req, res, next) =>  {
  var today = new Date();
  var bikeUpdated = false;

  //get BIKE STATUS
  const json = JSON.parse(JSON.stringify(req.body));
  var parms ={
    TableName: TABLE_BIKES,
    KeyConditionExpression : "#uu = :uuidBike",
    ExpressionAttributeNames: {
      '#uu': 'uuidBike'
    },
    ExpressionAttributeValues: {
      ':uuidBike': json.uuidBike
    }
  };

  var latitude = 1
  var longitude  = 2
  var uuidUser = "asdasdas"
  var email = "asdsa"

  await dynamoDB.query(parms, function (error, data) {
    if (error) {
      console.log("error"+ error)
    }
    else {
      latitude = data.Items[0].latitude
      longitude = data.Items[0].longitude
      uuidUser = data.Items[0].uuidUser
    }
  }).promise();

  const params = {
    Key: {
      uuidUser: uuidUser, 
        }, 
    TableName: TABLE_USERS
  };

  await dynamoDB.get(params,(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).json({
        sucess: false,
        message: 'No se pudo obtener data del usuario',
      })
    }else{
        email = result.Item.emergencyContact
    }
  }).promise();

  //Enviar correo
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Bici Bici Team 👻" <>', // sender address
        to: email, // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
    }).promise();

    console.log('Message sent: %s', info.messageId);
    // Message sent: <>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

});