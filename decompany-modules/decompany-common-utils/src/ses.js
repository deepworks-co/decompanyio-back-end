const AWS = require("aws-sdk");

/**
 * @param  {} region
 * @param  {} target_email
 * @param  {} source_email
 * @param  {} title
 * @param  {} bodyHtml
 */
exports.sendMail = (region, target_email, source_email, title, html) => {
  const ses = new AWS.SES({region: region, apiVersion: '2010-12-01'})    
  const params = {
    Destination: { /* required */
      ToAddresses: [
        target_email
      ]
    },
    Message: { /* required */
      Body: { /* required */
        Html: {
          Charset: "UTF-8",
          Data: html
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: title
        }
      },
    Source: source_email
  };
  console.log(params);
  return ses.sendEmail(params).promise();
 }