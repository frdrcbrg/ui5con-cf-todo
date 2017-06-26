// Set up basic services
var express = require( 'express');

// Create express app to serve application
var app = express();
app.use( express.static( __dirname + '/webapp'));
app.listen( process.env.PORT || 4000);
