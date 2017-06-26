## Getting started

* Install node.js (get it from [nodejs.org](http://nodejs.org/)).
  * If working behind a proxy, you need to configure it properly (HTTP_PROXY / HTTPS_PROXY / NO_PROXY environment variables)

* Clone the repository and navigate into it
```
cd ui5con-cf-todo
```

* Install all dependencies and start the server
```sh
npm install
node server.js
```
This will make your application available at http://localhost:4000

## Setting up your SAP Cloud Platform access

* Go to the following step-by-step guide and complete the setup

https://www.sap.com/developer/tutorials/hcp-cf-getting-started.html


* Connect to cloud foundry via the command line
```
cf api https://api.cf.eu10.hana.ondemand.com
```

## Prepare your application for deployment to cloud foundry

* Add file: .cfignore
```
node_modules
```

* Add file: manifest.yml
```
---
applications:
- name: ui5con-cf-todo
  memory: 100M
  instances: 1
  random-route: true
  buildpack: nodejs_buildpack
  command: node server.js
```

* Push your application to cloud foundry
```
cf push
```

Copy the resulting URL and open it in your browser (something like ui5con-cf-todo-<somestring>.cfapps.eu10.hana.ondemand.com). The application should load in your browser.

## Add service subscription to your deployed application

* Navigate to your application and subscribe to the mongodb backing service

https://account.hanatrial.ondemand.com

Find your application in your org and space, go to the navigation option for "Service Bindings"

Click on the button "Bind Service" and select "Service from the catalog". Next.

Select "MongoDB". Next. "Create new instance", instance name "mongo". Next and finish.

You have now successfully added a backing service to your cf application.

## Setup mongodb and connect to server

* package.json: Add the following dependencies
``` json
"dependencies":{
  "express":"*",
  "body-parser":"*",
  "mongodb": "*",
  "assert":"*"
}
```

* server.js: Add basic connection logic

``` javascript
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
```

## Insert new todos into database and read existing

* server.js: add the following handler code

``` javascript
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
```

* App.controller.js: update the following code blocks

``` javascript
addTodo: function() {
  var oModel = this.getView().getModel();
  var aTodos = oModel.getObject('/todos');
  var newTodo = {
    title: oModel.getProperty('/newTodo'),
    completed: false
  };
  aTodos.push(newTodo);
  // Update backend data
  var that = this;
  jQuery.ajax({
              method : "POST",
              url : "/todo/",
              data: {todo:newTodo}
  }).done(function(msg){
    var aTodos = JSON.parse(msg);
    aTodos = that.convertCompleted(aTodos);
    oModel.setProperty("/todos", aTodos);
  });

  oModel.setProperty('/newTodo', '');
},
```

* App.controller.js: Update also the following blocks

``` javascript
onInit: function(){
  var that = this;
  $.ajax({
    url: "/todos"
  })
  .done(function( aTodos ) {
    // Need to convert the type of "completed" back to boolean
    aTodos = that.convertCompleted(aTodos);
    that.getOwnerComponent().getModel().setProperty("/todos", aTodos);
  });
},

convertCompleted: function(aTodos){
  aTodos = aTodos.map(function(todo){
    var oTodo = todo;
    oTodo.completed = JSON.parse(todo.completed);
    return oTodo;
  });
  return aTodos;
}
```

## Add change handler for todos

* server.js: add following handlers

``` javascript
// Handler for PUT /todo
app.put("/todo", function(req, res){
  MongoClient.connect(url, function(err, db) {
    var col = db.collection('todos');
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
          res.send(docs);
          db.close();
      });
    });
  });
});
```

* App.controller.js: Update

``` javascript
toggleCompleted: function(oEvt) {
  var iCount = this.getView().getModel().getProperty('/completedCount');
  var iModification = oEvt.getParameters().selected ? 1 : -1;
  this._updateCompletedCount(iCount + iModification);
  var oTodo = oEvt.getParameter("listItem").getBindingContext().getProperty();
  jQuery.ajax({
              method : "PUT",
              url : "/todo/",
              data: {todo:oTodo}
  })
},

handleChange: function(oEvt) {
  var oTodo = oEvt.oSource.getBindingContext().getProperty();
  jQuery.ajax({
              method : "PUT",
              url : "/todo/",
              data: {todo:oTodo}
  })
},
```

## Add delete handler for todos

* server.js

``` javascript
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
```

* App.controller.js

``` javascript
clearCompleted: function(oEvt) {
  var aTodos = this.getView().getModel().getObject('/todos');
  var aTodosForDeletion = [];
  var i = aTodos.length;
  while (i--) {
    var oTodo = aTodos[i];
    if (oTodo.completed) {
      aTodosForDeletion.push(oTodo);
      aTodos.splice(i, 1)
    }
  }
  // Persist deletion via REST service
  jQuery.ajax({
              method : "DELETE",
              url : "/todos/",
              data: {todos:aTodosForDeletion}
  });
  this._updateCompletedCount(0);
},
```
