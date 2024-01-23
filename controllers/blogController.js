var dbConn    = require("../config/db");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const bcrypt  = require("bcrypt");

const nodemailer = require("nodemailer");
let dotenv       = require("dotenv").config();
const moment     = require("moment");

//file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/blog");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Create the multer instance and specify the storage
const upload = multer({ storage }).single("bimg");
//edittor image upload
const editorUpload = multer({ storage }).single("files");

const addBlog = (req, res) => {
  // console.log("ok");
  if (req.session.loggedin === true) {
    dbConn.query(
      "SELECT * FROM category ORDER BY id DESC",
      function (err, rows) {
        if (err) {
          console.log(err);
        } else {
          res.render("addBlog", {
            category: rows,
            activePage: "blogAdd",
          });
        }
      }
    );
  } else {
    res.redirect("/");
  }
};

const delBlog = (req, res) => {
  const blogId = req.params.id;

  let errors = false;

  if (blogId == "") {
    errors = true;
    res.status(401).json({ message: "Blog id is empty!" });
  }

  // Get the image filename from the database
  dbConn.query(
    "SELECT bimg FROM blog WHERE id = ?",
    [blogId],
    (error, results) => {
      if (error) throw error;

      if (results.length > 0) {
        const dbimgname = results[0].bimg;

        //delete category
        dbConn.query(
          "DELETE FROM blog WHERE id = " + blogId,
          function (err, result) {
            //if(err) throw err
            if (err) {
              res.status(401).json({ message: err });
            } else {
              const imagePath = `./public/blog/${dbimgname}`;
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

const createBlog = (req, res) => {
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
      const { blogTitle, blogCategory, blogDescp } = req.body;

      const author = req.session.name;
      const createdAt = moment().format("D MMM YYYY, hh:mm A");

      let errors = false;

      if (blogTitle == "") {
        errors = true;
        res.status(401).json({ message: "Blog title is empty!" });
      } else if (blogCategory == "") {
        errors = true;
        res.status(401).json({ message: "Please select blog category!" });
      } else if (blogDescp == "") {
        errors = true;
        res.status(401).json({ message: "Blog description is empty!" });
      }

      if (!errors) {
        // check if category are already
        dbConn.query(
          "SELECT * FROM blog WHERE title =" + "'" + blogTitle + "'",
          function (err, rows, fields) {
            if (err) throw err;

            // if user not found
            if (rows.length <= 0) {
              if (req.file) {
                const imageName = req.file.filename;

                var form_data = {
                  title: blogTitle,
                  category: blogCategory,
                  descp: blogDescp,
                  author: author,
                  created_at: createdAt,
                  bimg: imageName,
                };
              } else {
                var form_data = {
                  title: blogTitle,
                  category: blogCategory,
                  descp: blogDescp,
                  author: author,
                  created_at: createdAt,
                  bimg: "noImg.png",
                };
              }

              dbConn.query(
                "INSERT INTO blog SET ?",
                form_data,
                function (err, result) {
                  //if(err) throw err
                  if (err) {
                    res.status(401).json({ message: "Error inserting blog!" });
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
                .json({ message: "Blog title is already exists!" });
            }
          }
        );
      }
    }
  });
};

const editblog = (req, res) => {
  const blogId = req.params.id;

  if (req.session.loggedin === true) {
    const query1 = "SELECT * FROM blog WHERE id = " + blogId;
    dbConn.query(query1, (err, results1) => {
      if (err) {
        console.error("Error executing query 1: ", err);
        res.status(500).send("Error fetching data from blog");
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
        // console.log(results1.category);

        const adminAccess = req.session.userId;
          res.render("editBlog", {
            category: results2,
            blogdata: results1,
            activePage: "editblog",
          });
      });
    });
  } else {
    res.redirect("/");
  }
};

const updateBlog = function (req, res) {
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
      const { blogTitle, blogCategory, blogDescp, blogId } = req.body;

      const author = req.session.name;
      const updated_at = moment().format("D MMM YYYY, hh:mm A");

      let errors = false;

      if (blogTitle == "") {
        errors = true;
        res.status(401).json({ message: "Blog title is empty!" });
      } else if (blogCategory == "") {
        errors = true;
        res.status(401).json({ message: "Please select blog category!" });
      } else if (blogDescp == "") {
        errors = true;
        res.status(401).json({ message: "Blog description is empty!" });
      }

      if (!errors) {
        // check if category are already
        dbConn.query(
          "SELECT * FROM blog WHERE title =" + "'" + blogTitle + "'",
          function (err, rows, fields) {
            if (err) throw err;

            // if user not found
            if (rows.length <= 1) {
              if (req.file) {
                const imageName = req.file.filename;

                var form_data = {
                  title: blogTitle,
                  category: blogCategory,
                  descp: blogDescp,
                  author: author,
                  updated_at: updated_at,
                  bimg: imageName,
                };

                // Get the image filename from the database
                dbConn.query(
                  "SELECT bimg FROM blog WHERE id = ?",
                  [blogId],
                  (error, results) => {
                    if (error) throw error;

                    if (results.length > 0) {
                      const dbimgname = results[0].bimg;

                      // console.log(dbimgname);

                      const imagePath = `./public/blog/${dbimgname}`;
                      if (dbimgname != "noImg.png") {
                        deleteImageFile(imagePath);
                      }
                    }
                  }
                );
              } else {
                var form_data = {
                  title: blogTitle,
                  category: blogCategory,
                  descp: blogDescp,
                  author: author,
                  updated_at: updated_at,
                };
              }

              dbConn.query(
                "UPDATE blog SET ? WHERE id =" + blogId,
                form_data,
                function (err, result) {
                  //if(err) throw err
                  if (err) {
                    res.status(401).json({ message: "Error updating blog!" });
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
                .json({ message: "Blog title is already exists!" });
            }
          }
        );
      }
    }
  });
};

//summernote edittor IMAGES UPLOADING
const uploadImage = (req, res) => {
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
      const imagePath = "./public/blog/" + req.file.filename; // Set the path where the uploaded image is saved
      res.json({ imagePath: imagePath });
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
  addBlog,
  delBlog,
  createBlog,
  editblog,
  updateBlog,
  uploadImage,
};
