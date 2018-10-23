var createError  = require("http-errors");
var express      = require("express");
var path         = require("path");
var cookieParser = require("cookie-parser");
var logger       = require("morgan");
var minifyHTML   = require("express-minify-html");
var fs = require("fs");

var indexRouter = require("./routes/index");

var app = express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

app.use(logger("dev", {  stream: accessLogStream }));
app.use(
	minifyHTML({
		override     : true,
		exception_url: false,
		htmlMinifier : {
			removeComments           : true,
			collapseWhitespace       : true,
			collapseBooleanAttributes: true,
			removeAttributeQuotes    : true,
			removeEmptyAttributes    : true,
			minifyJS                 : true,
		},
	}),
);
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: false, limit: "50mb"}));
app.use(cookieParser());
app.use(express.static("public"));

app.use(function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "https://www.saidi27.com");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error   = req.app.get("env") === "development" ? err : {};
	
	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
