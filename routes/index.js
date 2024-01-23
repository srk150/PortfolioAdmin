const express = require("express");
const router  = express.Router();
var dbConn    = require("../config/db");
const bcrypt  = require("bcrypt");

// Import required modules
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

//login page
router.get("/", (req, res) => {
  res.render("login");
});

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

// Create the multer instance and specify the storage
const upload = multer({ storage: storage });


//dashobard page
router.get("/dashboard", (req, res) => {
  if (req.session.loggedin === true) {
    const portfolioQuery = "SELECT COUNT(*) AS portfolioCount FROM portfolio";
    
    const blogQuery = "SELECT COUNT(*) AS blogCount FROM blog";
 
    // Execute the queries to fetch the counts
      
        dbConn.query(blogQuery, (err, blogResult) => {
          if (err) {
            console.error("Error fetching blog count:", err);
            return;
          }
          const blogCount = blogResult[0].blogCount;

          dbConn.query(portfolioQuery, (err, portfolioResult) => {
            if (err) {
              console.error("Error fetching portfolio count :", err);
              return;
            }
          const portfolioCount = portfolioResult[0].portfolioCount;

            //create menu settins for admin access
            const adminAccess = req.session.userId;
            const adminRole = req.session.adminRole;
              // Render the EJS template and pass the counts as variables
              res.render("dashboard", {
                portfolioCount,
                blogCount,
                adminRole,
                activePage: "dashboard",
              });
          });
        });
      
   
  } else {
    res.redirect("/");
  }
});

//blog list page
router.get("/blog", (req, res) => {
  if (req.session.loggedin === true) {
    dbConn.query(
      "SELECT blog.*, category.cat AS cat_name FROM blog JOIN category on blog.category = category.id  ORDER BY blog.id DESC",
      function (err, rows) {
        if (err) {
          console.log(err);
        } else {
          //create menu settins for admin access
          const adminAccess = req.session.userId;
            res.render("blog", {
              blogdata: rows,
              activePage: "blog",
            });
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

//blog add page
router.get("/addBlog", (req, res) => {
  if (req.session.loggedin === true) {
    dbConn.query(
      "SELECT * FROM category ORDER BY id DESC",
      function (err, rows) {
        if (err) {
          console.log(err);
        } else {
          const adminAccess = req.session.userId;
            res.render("addBlog", {
              category: rows,
              activePage: "addBlog",
            });
          
        }
      }
    );
  } else {
    res.redirect("/");
  }
});



//profile page
router.get("/profile", (req, res) => {

  if (req.session.loggedin === true) {
    //for get settings data
    const userId = req.session.userId;

    dbConn.query(
      "SELECT * FROM settings WHERE adminId =" + userId,
      function (error, setdata) {
        //for get profile data

        dbConn.query(
          "SELECT * FROM auth WHERE id =" + userId,
          function (err, rows) {
            if (err) {
              req.flash("error", err);
              res.redirect("/");
            } else {

              const adminAccess = req.session.userId;
              
                  res.render("profile", {
                    id: rows[0].id,
                    name: rows[0].name,
                    username: rows[0].username,
                    email: rows[0].email,
                    profile: rows[0].profile,
                    mobile: rows[0].mobile,
                    occupation: rows[0].occupation,
                    cname: setdata[0].cname, // here from setting data
                    cemail: setdata[0].cemail,
                    cwebsite: setdata[0].cwebsite,
                    cmobile: setdata[0].cmobile,
                    country: setdata[0].country,
                    state: setdata[0].state,
                    city: setdata[0].city,
                    cabout: setdata[0].cabout,
                    caddress: setdata[0].caddress,
                    clogo: setdata[0].clogo,
                    activePage: "profile",
                  });
                
            }
          }
        );
      }
    );
  } else {
    res.redirect("/");
  }
});

//update profile
router.post(
  "/index/updateProfile",
  upload.single("profilepic"),
  function (req, res) {
    const userId = req.session.userId;

    const { fullname, username, email, mobile, occupation } = req.body;

    let errors = false;

    if (fullname == "") {
      errors = true;
      res.status(401).json({ message: "Fullname is empty!" });
    } else if (username == "") {
      errors = true;
      res.status(401).json({ message: "Username is empty!" });
    } else if (email == "") {
      errors = true;
      res.status(401).json({ message: "Email is empty!" });
    } else if (mobile == "") {
      errors = true;
      res.status(401).json({ message: "Mobile is empty!" });
    } else if (occupation == "") {
      errors = true;
      res.status(401).json({ message: "Occupation is empty!" });
    }

    if (!errors) {
      if (req.file) {
        const imageName = req.file.filename;

        var form_data = {
          name: fullname,
          email: email,
          username: username,
          mobile: mobile,
          occupation: occupation,
          profile: imageName,
        };

        // Get the image filename from the database
        dbConn.query(
          "SELECT profile FROM auth WHERE id = ?",
          [userId],
          (error, results) => {
            if (error) throw error;

            if (results.length > 0) {
              const dbimgname = results[0].profile;
              // console.log(dbimgname);
              const imagePath = `./public/uploads/${dbimgname}`;
              if (dbimgname != "avtar.png") {
                deleteImageFile(imagePath);
              }
            }
          }
        );
      } else {
        var form_data = {
          name: fullname,
          email: email,
          username: username,
          mobile: mobile,
          occupation: occupation,
        };
      }

      dbConn.query(
        "UPDATE auth SET ? WHERE id =" + userId,
        form_data,
        function (err, result) {
          //if(err) throw err
          if (err) {
            // set flash message
            res.status(401).json({ message: "Something wen to wrong!" });
          } else {
            res.json({ message: true });
          }
        } //
      );
    }
  }
);

//update Password
router.post("/index/changepassword", function (req, res) {
  const userId = req.session.userId;

  const { password, cpassword } = req.body;

  let errors = false;

  if (password == "") {
    errors = true;
    res.status(401).json({ message: "Password is empty!" });
  } else if (cpassword == "") {
    errors = true;
    res.status(401).json({ message: "Confirm password is empty!" });
  } else if (password != cpassword) {
    errors = true;
    res
      .status(401)
      .json({ message: "Password and confirm password is not match!" });
  }

  if (!errors) {
    var form_data = {
      password: password,
    };

    bcrypt
      .hash(password, 8)
      .then((hash) => {
        //set the password to hash value
        form_data.password = hash;
      })
      .then(() => {
        dbConn.query(
          "UPDATE auth SET ? WHERE id =" + userId,
          form_data,
          function (err, result) {
            //if(err) throw err
            if (err) {
              // set flash message
              res.status(401).json({ message: "Something wen to wrong!" });
            } else {
              res.json({ message: true });
            }
          } //
        );
      });
  }
});

//update settings
router.post(
  "/index/updateSettings",
  upload.single("clogo"),
  function (req, res) {
    const userId = req.session.userId;

    const {
      cname,
      cemail,
      cwebsite,
      cmobile,
      country,
      state,
      city,
      cabout,
      caddress,
    } = req.body;

    let errors = false;

    if (cname == "") {
      errors = true;
      res.status(401).json({ message: "Company name is empty!" });
    } else if (cwebsite == "") {
      errors = true;
      res.status(401).json({ message: "Company website is empty!" });
    } else if (cmobile == "") {
      errors = true;
      res.status(401).json({ message: "Company mobile is empty!" });
    } else if (cemail == "") {
      errors = true;
      res.status(401).json({ message: "Company email is empty!" });
    } else if (country == "") {
      errors = true;
      res.status(401).json({ message: "Please select Country!" });
    } else if (state == "") {
      errors = true;
      res.status(401).json({ message: "Please select State!" });
    } else if (city == "") {
      errors = true;
      res.status(401).json({ message: "Please select City!" });
    } else if (cabout == "") {
      errors = true;
      res.status(401).json({ message: "Company about is empty!" });
    } else if (caddress == "") {
      errors = true;
      res.status(401).json({ message: "Company address is empty!" });
    }

    if (!errors) {
      if (req.file) {
        const imageName = req.file.filename;

        var form_data = {
          cname: cname,
          cwebsite: cwebsite,
          cmobile: cmobile,
          cemail: cemail,
          country: country,
          state: state,
          city: city,
          cabout: cabout,
          caddress: caddress,
          clogo: imageName,
        };

        // Get the image filename from the database
        dbConn.query(
          "SELECT clogo FROM settings WHERE adminId = ?",
          [userId],
          (error, results) => {
            if (error) throw error;

            if (results.length > 0) {
              const dbimgname = results[0].clogo;

              const imagePath = `./public/uploads/${dbimgname}`;

              if (dbimgname != "avtar.png") {
                deleteImageFile(imagePath);
              }

              
            }
          }
        );
      } else {
        var form_data = {
          cname: cname,
          cwebsite: cwebsite,
          cmobile: cmobile,
          cemail: cemail,
          country: country,
          state: state,
          city: city,
          cabout: cabout,
          caddress: caddress,
        };
      }

      dbConn.query(
        "UPDATE settings SET ? WHERE adminId =" + userId,
        form_data,
        function (err, result) {
          //if(err) throw err
          if (err) {
            // set flash message
            res.status(401).json({ message: "Something wen to wrong!" });
          } else {
            res.json({ message: true });
          }
        } //
      );
    }
  }
);

// create a function for remove files from the registry
function deleteImageFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting image file: ${err}`);
    } else {
      console.log(`Deleted image file: ${filePath}`);
    }
  });
}

module.exports = router;
