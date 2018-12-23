var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var minifyHTML = require("express-minify-html");
var timeout = require("connect-timeout");
var fs = require("fs");

var indexRouter = require("./routes/index");

var app = express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
	flags: "a",
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

app.use(logger("dev", { stream: accessLogStream }));
app.use(
	minifyHTML({
		override: true,
		exception_url: false,
		htmlMinifier: {
			removeComments: true,
			collapseWhitespace: true,
			collapseBooleanAttributes: true,
			removeAttributeQuotes: true,
			removeEmptyAttributes: true,
			minifyJS: true,
		},
	}),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.use(timeout("10s"));
app.use("/", indexRouter);
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next) {
	if (!req.timedout) next();
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
