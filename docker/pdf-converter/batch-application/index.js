'use strict';
const cron = require('node-cron');
const express = require('express');
const pdfconverter = require('./src/pdf-converter-wrapper');
const Status = require('./src/status');
const PORT = process.env.port || 8080;
const app = express();
const status = new Status();

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
  console.log(JSON.stringify(status));
  res.send(JSON.stringify(status));
});

app.get('/stop', function (req, res) {
  status.stop();
  res.send(JSON.stringify(status));
});

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
  server.close(() => {
    task.stop()
    console.log(`server stopped by ${signal} with value ${value}`);
    process.exit(128 + value);
  });
};
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});

async function cronJob() {
  console.log(status);
  if(status.isStop() === true && status.jobCount() === 0) {
    console.log("stopping pdf converter");
    shutdown()
  } else if(status.jobCount() < 1 && status.isStop() === false){
    console.log('running for pdf converter every 500ms');
    const jobId = `job_${Date.now()}`;
    //get queue
    /*
    * this get queue
    */
    // large file
    const event = {t: Date.now(), jobId: jobId, payload: [
      "machinelearning_guide.pptx",
      `machinelearning_guide.${Date.now()}.pdf`,
      "1280", "1280",
    ]}
    /*
    //smail file
    const event = {t:Date.now(), jobId: jobId, payload: [
      "rsa.ppt",
      `rsa.${Date.now()}.pdf`,
      "1280", "1280",
    ]}
    */

    const r = pdfconverter(event, (data)=>{
      const {success, payload, result, jobId} = data;
      console.log("complete for pdf converter ", data);

      status.removeJob(jobId);
    });

    status.addJob(jobId);
    console.log("current processing queue", JSON.stringify(status));
  }
}

const task = cron.schedule('*/10 * * * * *', cronJob);