'use strict';
const cronjob = require('../src/cronJob');
const cron = cronjob.test([
  {
    Body: JSON.stringify({
      "source":{
        "bucket": "dev-ca-document",
        "key": "FILE/google-oauth2|108970746394534108508/550cb188c51f458dafe8eb53318e26a2.pdf"
      },
      "target": {
        "bucket": "dev-ca-document"
      }
    })
  }/*,
  {
    Body: JSON.stringify({
      "source": {
          "bucket": "dev-ca-document",
          "key": "FILE/google-oauth2|101778494068951192848/07637479b9874749a7e723fe949d3dad.pptx"
      },
      "target": {
          "bucket": "dev-ca-document",
          "key": "PDF/07637479b9874749a7e723fe949d3dad/07637479b9874749a7e723fe949d3dad.pdf"
      }
    })
  }*/
]).then((data)=>{
  console.log("test complete", data)
}).catch((err)=>{
  console.error(err);
});

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
    shutdown(signal, signals[signal]);
  });
});
