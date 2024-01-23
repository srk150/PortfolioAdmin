const express = require("express");
const router  = express.Router();
var dbConn    = require("./../config/db");
const moment  = require("moment");

const nodemailer = require("nodemailer");
let dotenv       = require("dotenv").config();

// email transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.Smtp_email,
    pass: process.env.Smtp_passwrod,
  },
});


//sened inquiry
router.post("/sendinquiry", (req, res) => {
  const { name, email, subject, msg } = req.body;

  let errors = false;

  if (name == "") {
    errors = true;
    res.status(401).json({ message: "Name is empty!" });
  } else if (email == "") {
    errors = true;
    res.status(401).json({ message: "Email is empty!" });
  } else if (subject == "") {
    errors = true;
    res.status(401).json({ message: "Subject is empty!" });
  } else if (msg == "") {
    errors = true;
    res.status(401).json({ message: "Comment is empty!" });
  }

  if (!errors) {
    //console.log(process.env.Smtp_email + "ok!");

    var templateData = {
      to_email: email,
      name: name,
      subject: subject,
      messages: msg,
    };

    // Render the email template using EJS
    req.app.render(
      "web/template/contactus",
      templateData,
      (error, renderedTemplate) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .send("An error occurred while rendering the email template.");
        } else {
          // Send the email using Nodemailer
          sendEmail(
            transporter,
            email,
            subject,
            renderedTemplate,
            (sendError, info) => {
              if (sendError) {
                console.error(sendError);
                return res
                  .status(500)
                  .send("An error occurred while sending the email.");
              }

              res.json({ message: true });
            }
          );
        }
      }
    );
  }
});

//email function send
function sendEmail(transporter, form_data, subject, html, callback) {
  const from_email = process.env.Smtp_email;
  transporter.sendMail(
    {
      from: from_email,
      to: form_data,
      subject,
      html,
    },
    (error, info) => {
      callback(error, info);
    }
  );
}

module.exports = router;
