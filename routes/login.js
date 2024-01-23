const express = require("express");
const router  = express.Router();
var dbConn    = require("../config/db");
const bcrypt  = require("bcrypt");
var session   = require("express-session");
const cookieParser = require("cookie-parser");

//logout
router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

//login using routes for ajax function
router.post("/", (req, res) => {
  const { email, password, remember_me } = req.body;

  let errors = false;

  if (email == "") {
    errors = true;
    res.status(401).json({ message: "Email is empty!" });
  } else if (password == "") {
    errors = true;
    res.status(401).json({ message: "Password is empty!" });
  }
  //  else if (remember_me != "1") {
  //   errors = true;
  //   res.status(401).json({ message: "Please select remember me!" });
  // }

  if (!errors) {
    dbConn.query(
      "SELECT * FROM auth WHERE email =" + "'" + email + "'",
      function (err, rows, fields) {
        if (err) throw err;

        // if user not found
        if (rows.length <= 0) {
          res.status(401).json({ message: "Invalid Email!" });
        }
        // if user found
        else {
          let udata  = rows[0];
          let roweId   = udata.id;
          let rowemail = udata.email;
          let rowname  = udata.name;
          let rowpass  = udata.password;
          let rowprofile = udata.profile;
          let rowRole    = udata.role;

            bcrypt.compare(password, rowpass).then((isMatch) => {
              if (isMatch === false) {
                res.status(401).json({ message: "Incorrect Password!" });
              } else {
                if (remember_me) {
                  req.session.adminRole = rowRole;
                  req.session.userId    = roweId;
                  req.session.email     = rowemail;
                  req.session.name      = rowname;
                  req.session.profile   = rowprofile;
                  req.session.loggedin  = true;
                } else {
                  req.session.adminRole = rowRole;
                  req.session.userId    = roweId;
                  req.session.email     = rowemail;
                  req.session.name      = rowname;
                  req.session.profile   = rowprofile;
                  req.session.loggedin  = true;
                }

                  // req.session.userId = "";
                  // req.session.adminRole = "";
                  // req.session.email = "";
                  // req.session.name = "";
                  // req.session.profile = "";
                  // req.session.loggedin = "";

                res.json({ message: true });
              }
            });
        }
      }
    );
  }
});

module.exports = router;
