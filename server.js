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

// Handler for /todos GET
app.get("/todos", function(req, res){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    // Get the collection
    var col = db.collection('todos');
    col.find({}).toArray(function(err, docs) {
        res.send(docs);
        db.close();
      });
  });
});

// Handler for POST /todo
app.post("/todo", function(req, res){
  MongoClient.connect(url, function(err, db) {
    var col = db.collection('todos');
    col.insertOne(req.body.todo, function(err, r) {
      assert.equal(null, err);
      // Return full set of documents (for simplicity reasons)
      col.find().toArray(function(err, docs) {
          res.send(docs);
          db.close();
      });
    });
  });
});

// Handler for PUT /todo
app.put("/todo", function(req, res){
  MongoClient.connect(url, function(err, db) {
    var col = db.collection('todos');
    console.log(req.body.todo);
    var id = objectId(req.body.todo._id);
    var oTodo = {
      title:req.body.todo.title,
      completed:req.body.todo.completed
    };
    console.log("ID: " + id + ", oTodo: " + oTodo);
      col.updateOne({'_id':id}, {$set:oTodo}, function(err, result) {
      assert.equal(null, err);
      // Return full set of documents (for simplicity reasons)
      col.find().toArray(function(err, docs) {
          res.send(JSON.stringify(docs));
          db.close();
      });
    });
  });
});

// Setup handler for /todos DELETE
app.delete("/todos", function(req, res){
  var todosDelete = [];

  req.body.todos.forEach(function(todo){
      todosDelete.push(objectId(todo._id));
  });

  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    // Get the collection
    var col = db.collection('todos');
    col.deleteMany({'_id':{'$in': todosDelete}},function(err, result) {
      assert.equal(null, err);
      res.send(result);
      db.close();
    });
  });
});
