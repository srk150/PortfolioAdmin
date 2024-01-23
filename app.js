const express   = require("express");
const session   = require("express-session");
const dbConn    = require("./config/db");
const mysql     = require("mysql");

const cookieParser = require("cookie-parser");
const bodyParser   = require("body-parser");
const moment       = require("moment");

const app  = express();
const port = process.env.PORT || 3000;

const userMiddleware = require('./middleware/session_value');
// Use cookie-parser middleware
app.use(cookieParser());

// Use express-session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  })
);

app.set("view engine", "ejs");
app.use(express.static("public"));
// Set the base URL variable
app.locals.baseUrl = "http://localhost:3000/";
// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use your custom middleware to fetch user info
app.use(userMiddleware);
// Set up routes for controller
const indexRoute          = require("./routes/index");
const loginRoute          = require("./routes/login");
const adminController     = require("./controllers/adminController");
const blogController      = require("./controllers/blogController");
const portfolioController = require("./controllers/portfolioController");

app.use("/", indexRoute);
app.use("/dashboard", indexRoute);
app.use("/login", loginRoute);

// admin controller routes
app.get("/forgot", adminController.forgotpass);
app.get("/change", adminController.changepass);
app.post("/admin/forgotPassword", adminController.forgotPassword);
app.post("/admin/updPassword", adminController.updPassword);
app.get("/contact", adminController.contact);
app.post("/contact_user", adminController.contact_user);
app.get("/settings", adminController.AdminSettings);


//blog controller routes
app.get("/addBlog", blogController.addBlog);
app.delete("/delBlog/:id", blogController.delBlog);
app.post("/insertBlog", blogController.createBlog);
app.get("/editblog/:id", blogController.editblog);
app.post("/updateBlog", blogController.updateBlog);
app.post("/upload-image", blogController.uploadImage);

//portfolioController routes
app.get("/portfolio", portfolioController.portfolio);
app.get("/addPortfolio", portfolioController.addPortfolio);
app.post("/insertPortfolio", portfolioController.insertPortfolio);
app.delete("/delportfolio/:id", portfolioController.delportfolio);
app.get("/editPortfolio/:id", portfolioController.editPortfolio);
app.post("/updatePortfolio", portfolioController.updatePortfolio);


// Use the route for /webcommon/api
//http://localhost:3000/webcommon/api/portfolioList for portfolio api
//http://localhost:3000/webcommon/api/contactApiForAmin for Contact api

const webApiRoutes = require("./routes/webApi");
app.use("/webcommon/api", webApiRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${app.locals.baseUrl}`);
});