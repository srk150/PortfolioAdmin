const express = require("express");
const router  = express.Router();
const dbConn  = require("../config/db");
const bcrypt  = require("bcrypt");

// Import required modules
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

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


//for path files using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });

//contact mail for admin
router.post("/contactApiForAmin", function (req, res) {

const { name, email, subject, msg } = req.body;

  let errors = false;

  if (name == "") {
    errors = true;
    res.status(401).json({ message: "Name is empty!" });
  } else if (email == "") {
    errors = true;
    res.status(401).json({ message: "Email is empty!" });
  } else if (subject  == "") {
    errors = true;
    res.status(401).json({ message: "Subject is empty!" });
  } else if (msg == "") {
    errors = true;
    res.status(401).json({ message: "Message is empty!" });
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
      "template/contactus",
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

              res.json({ message:"Successfully sent the enquiry" , status:"true" });
            }
          );
        }
      }
    );
  }

});

//portfolio List
router.get("/portfolioList", function (req, res) {

    const query = 'SELECT * FROM portfolio ORDER BY id ASC';

    dbConn.query(query, (err, results) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });

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