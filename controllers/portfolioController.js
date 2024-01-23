var dbConn   = require("../config/db");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");
let dotenv       = require("dotenv").config();

//file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/portfolio");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Create the multer instance and specify the storage
const upload = multer({ storage }).single("pimg");

const portfolio = (req, res) => {
  if (req.session.loggedin === true) {
    dbConn.query(
      "SELECT portfolio.*, category.cat AS cat_name FROM portfolio JOIN category on portfolio.category = category.id  ORDER BY portfolio.id DESC",
      function (err, rows) {
        if (err) {
          console.log(err);
        } else {
          const adminAccess = req.session.userId;
            res.render("portfolio", {
              portfolioDatas: rows,
              activePage: "portfolio",
            });
        }
      }
    );
  } else {
    res.redirect("/");
  }
};

const addPortfolio = (req, res) => {
  if (req.session.loggedin === true) {
    dbConn.query(
      "SELECT * FROM category ORDER BY id DESC",
      function (err, rows) {
        if (err) {
          console.log(err);
        } else {
          const adminAccess = req.session.userId;
            res.render("addPortfolio", {
              category: rows,
              activePage: "addPortfolio",
            });
        }
      }
    );
  } else {
    res.redirect("/");
  }
};

const editPortfolio = (req, res) => {
  const PortfolioId = req.params.id;

  if (req.session.loggedin === true) {
    const query1 = "SELECT * FROM portfolio WHERE id = " + PortfolioId;
    dbConn.query(query1, (err, results1) => {
      if (err) {
        console.error("Error executing query 1: ", err);
        res.status(500).send("Error fetching data from Portfolio");
        return;
      }

      // Perform the second query
      const query2 = "SELECT * FROM category ORDER BY id DESC";
      dbConn.query(query2, (err, results2) => {
        if (err) {
          console.error("Error executing query 2: ", err);
          res.status(500).send("Error fetching data from category");
          return;
        }

        const adminAccess = req.session.userId;
          // console.log(results1.category);
          res.render("editPortfolio", {
            category: results2,
            Portfoliodata: results1,
            activePage: "editPortfolio",
          });
      });
    });
  } else {
    res.redirect("/");
  }
};

//Delete a service
const delportfolio = (req, res) => {
  const portfolioId = req.params.id;

  let errors = false;

  if (portfolioId == "") {
    errors = true;
    res.status(401).json({ message: "Portfolio Id is empty!" });
  }

  // Get the image filename from the database
  dbConn.query(
    "SELECT pimg FROM portfolio WHERE id = ?",
    [portfolioId],
    (error, results) => {
      if (error) throw error;

      if (results.length > 0) {
        const dbimgname = results[0].pimg;

        //delete category
        dbConn.query(
          "DELETE FROM portfolio WHERE id = " + portfolioId,
          function (err, result) {
            //if(err) throw err
            if (err) {
              res.status(401).json({ message: err });
            } else {
              const imagePath = `./public/portfolio/${dbimgname}`;
              if (dbimgname != "noImg.png") {
                deleteImageFile(imagePath);
              }

              res.json({ message: true });
            }
          }
        );
      } else {
        res.status(404).send("Entry not found");
      }
    }
  );
};

// Create a new service

const insertPortfolio = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error(err);
      res.status(500).json({ error: "An error occurred during file upload." });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error(err);
      res
        .status(500)
        .json({ error: "An unknown error occurred during file upload." });
    } else {
      const { title, descp, category } = req.body;
      let errors = false;

      if (title == "") {
        errors = true;
        res.status(401).json({ message: "Title is empty!" });
      } else if (descp == "") {
        errors = true;
        res.status(401).json({ message: "description is empty!" });
      } else if (category == "") {
        errors = true;
        res.status(401).json({ message: "Please select category!" });
      }

      if (!errors) {
        // check if category are already
        dbConn.query(
          "SELECT * FROM portfolio WHERE title =" + "'" + title + "'",
          function (err, rows, fields) {
            if (err) throw err;

            // if user not found
            if (rows.length <= 0) {
              if (req.file) {
                const imageName = req.file.filename;

                var form_data = {
                  title: title,
                  descp: descp,
                  category: category,
                  pimg: imageName,
                };
              } else {
                var form_data = {
                  title: title,
                  descp: descp,
                  category: category,
                  pimg: "noImg.png",
                };
              }

              dbConn.query(
                "INSERT INTO portfolio SET ?",
                form_data,
                function (err, result) {
                  //if(err) throw err
                  if (err) {
                    res
                      .status(401)
                      .json({ message: "Error inserting Service!" });
                  } else {
                    res.json({ message: true });
                  }
                }
              );
            }
            // if user found
            else {
              res
                .status(401)
                .json({ message: "portfolio name is already exists!" });
            }
          }
        );
      }
    }
  });
};

// update service

const updatePortfolio = function (req, res) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error(err);
      res.status(500).json({ error: "An error occurred during file upload." });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error(err);
      res
        .status(500)
        .json({ error: "An unknown error occurred during file upload." });
    } else {
      const { title, descp, category, pid } = req.body;
      let errors = false;

      if (title == "") {
        errors = true;
        res.status(401).json({ message: "Title is empty!" });
      } else if (descp == "") {
        errors = true;
        res.status(401).json({ message: "description is empty!" });
      } else if (category == "") {
        errors = true;
        res.status(401).json({ message: "Please select category!" });
      }

      if (!errors) {
        // check if category are already
        dbConn.query(
          "SELECT * FROM portfolio WHERE title =" + "'" + title + "'",
          function (err, rows, fields) {
            if (err) throw err;

            // if user not found
            if (rows.length <= 1) {
              if (req.file) {
                const imageName = req.file.filename;

                var form_data = {
                  title: title,
                  descp: descp,
                  category: category,
                  pimg: imageName,
                };

                // Get the image filename from the database
                dbConn.query(
                  "SELECT pimg FROM portfolio WHERE id = ?",
                  [pid],
                  (error, results) => {
                    if (error) throw error;

                    if (results.length > 0) {
                      const dbimgname = results[0].pimg;

                      // console.log(dbimgname);

                      const imagePath = `./public/portfolio/${dbimgname}`;
                      if (dbimgname != "noImg.png") {
                        deleteImageFile(imagePath);
                      }
                    }
                  }
                );
              } else {
                var form_data = {
                  title: title,
                  descp: descp,
                  category: category,
                };
              }

              dbConn.query(
                "UPDATE portfolio SET ? WHERE id =" + pid,
                form_data,
                function (err, result) {
                  //if(err) throw err
                  if (err) {
                    res
                      .status(401)
                      .json({ message: "Error updating portfolio!" });
                  } else {
                    res.json({ message: true });
                  }
                }
              );
            }
            // if user found
            else {
              res
                .status(401)
                .json({ message: "portfolio title is already exists!" });
            }
          }
        );
      }
    }
  });
};

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

module.exports = {
  portfolio,
  delportfolio,
  addPortfolio,
  insertPortfolio,
  editPortfolio,
  updatePortfolio,
};
