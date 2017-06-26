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
