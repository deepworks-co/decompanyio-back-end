'use strict';

const express = require('express');
const cronjob = require('./src/cronJob');
const PORT = process.env.port || 8080;
const app = express();


app.get('/', function (req, res) {
 res.send('Hello world\n');
});

app.get('/wait', function (req, res) {
 const timeout = 5;
 console.log(`received request, waiting ${timeout} seconds`);
 const delayedResponse = () => {
 res.send('Hello belated world\n');
 };
 setTimeout(delayedResponse, timeout * 1000);
});

app.get('/status', function (req, res) {
  const status = cronjob.status();
  //console.log(JSON.stringify(status));
  res.send(JSON.stringify(status));
});

app.get('/stop', function (req, res) {
  cronjob.stop();
  shutdown("SIGINT", signals["SIGINT"]);
  const status = cronjob.status();
  console.log("stop the server", JSON.stringify(status));
  res.send(JSON.stringify(status));
});

const cron = cronjob.init();
const server = app.listen(PORT);
console.log("Listen...", PORT);
// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};
// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  console.log("shutdown!");

  if(cronjob.status().isStopped()) {
    server.close(() => {
      console.log(`server stopped by ${signal} with value ${value}`);
      process.exit(128 + value);
    });

    
  } else {
    
    setTimeout(shutdown, 1000);
  }
  
};
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    cronjob.stop();
    shutdown(signal, signals[signal]);
  });
});
