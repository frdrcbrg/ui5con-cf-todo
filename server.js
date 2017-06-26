// Set up basic services like express
var express = require( 'express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var assert = require('assert');
var objectId = require('mongodb').ObjectID;

// // Get environmental credentials
var vcap_services = process.env.VCAP_SERVICES;
var mongodb_service = JSON.parse(vcap_services).mongodb[0];
var url = mongodb_service.credentials.uri;

// Create express app to serve application
var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use( express.static( __dirname + '/webapp'));
app.listen( process.env.PORT || 4000);

// Get mongodb client
var MongoClient = mongodb.MongoClient;
