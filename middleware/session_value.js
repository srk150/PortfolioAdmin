var dbConn = require("../config/db");
const mysql = require('mysql');

module.exports = (req, res, next) => {
  const userId = req.session.userId; 
  if (userId) {
    dbConn.query('SELECT * FROM auth WHERE id = ?', [userId], (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.locals.userInfo = results[0]; 
      }
      next();
    });
  } else {
    next();
  }
};
