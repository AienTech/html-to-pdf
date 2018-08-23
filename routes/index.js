var express = require("express");
var router  = express.Router();
var pdf     = require("html-pdf");
var fs      = require("fs");
var Twig    = require("twig");
var path    = require("path");
var AWS     = require("aws-sdk");
var cors    = require("cors");

const {check, validationResult} = require("express-validator/check");

var corsOptions = {
	origin              : "https://www.saidi27.com",
	optionsSuccessStatus: 200,
	preflightContinue   : true,
};

// Defalt index page
router.get("/", function (req, res, next) {
	res.render("index", {title: "پرینتر"});
});

// A page to teach css printing
router.get("/how-make-a-css-print-ready-stylesheet", function (req, res, next) {
	res.render("how-to-print-css", {title: "چطور css رو برای پرینت آماده کنیم"});
});

// The convert api
router.post("/convert",
	function (req, res, next) {
		res.setHeader("Access-Control-Allow-Origin", "https://www.saidi27.com");
		res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	}),
	[
		check("html")
			.not()
			.isEmpty()
			.isString(),
		check("author")
			.not()
			.isEmpty()
			.isString(),
		check("title")
			.not()
			.isEmpty()
			.isString(),
	], async function (req, res, next) {
	
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({status: "error", errors: errors.array()});
	}
	
	// Request variables
	var html     = req.body.html;
	var author   = req.body.author;
	var filename = req.body.title;
	var detail   = req.body.detail || null;
	var theme    = req.body.theme || "default";
	
	// Default printing options
	var options = {
		format  : "A4",
		"header": {
			"height"  : "35mm",
			"contents": "<table class=\"header-table\" style=\"text-align:center;\"><tr><td style=\"font-weight: bold;text-align:right;\">" + filename + "</td><td style='text-align: left'>" + author + "</td></tr></table>",
		},
		"footer": {
			"height"  : "28mm",
			"contents": {
				first  : "صفحه‌ی اول",
				2      : "صفحه‌ی دوم",
				default: "<div style=\"color: #333; font-size: 9px;border-top:1px solid #eee;\">صفحه‌ی {{page}} از {{pages}}</div>",
			},
		},
	};
	
	// Path to save a temporary rendered file
	var htmlFilename = path.join(__dirname, "../public/downloads/" + filename + ".html");
	
	// Path to save the pdf document from generated html file
	var pdfFilename = path.join(__dirname, "../public/downloads/" + filename + ".pdf");
	
	// Path to the theme stylesheet
	var themeFilename = path.join(__dirname, "../public/stylesheets/prints/theme-" + theme + ".css");
	
	// Theme content
	var themeCss = fs.readFileSync(themeFilename, "utf8");
	
	// Render function
	await Twig.renderFile(__dirname + "/../views/print.html.twig", {content: html, title: filename, author: author, detail: detail, theme: themeCss}, (err, twigResult) => {
		if (err) return res.status(500).json({status: "error", error: err.message});
		
		/**
		 * First, we'll create an HTML file from the rendered twig template.
		 */
		fs.writeFileSync(htmlFilename, twigResult, function (err) {
			if (err) return console.log(err);
		});
		
		/**
		 * Read the content of the rendered file.
		 * This file has all of the styles and variables.
		 */
		var tempHtmlFile = fs.readFileSync(htmlFilename, "utf8");
		
		// Create a PDF from the HTML
		pdf.create(tempHtmlFile, options).toFile(pdfFilename, function (err, renderedPdf) {
			if (err) return res.status(500).json({status: "error", error: err.message});
			
			// Remove the HTML file
			fs.unlink(htmlFilename, function (err) {
				if (err) return res.status(500).json({status: "error", error: err.message});
				
				// AWS Default settings
				AWS.config.update({accessKeyId: process.env.AWS_AKID, secretAccessKey: process.env.AWS_SAK});
				var s3 = new AWS.S3();
				
				/**
				 * We'll get the PDF document and its base64 encoded content.
				 * We are not going to stream this file to the S3 storage.
				 */
				var pdfFile    = fs.readFileSync(pdfFilename);
				var base64data = new Buffer(pdfFile, "binary");
				
				/**
				 * default parameter of AWS Bucket.
				 *
				 * Bucket: the bucket name to save the files
				 * Key: Filename to save
				 * Body: File contents (Base64)
				 * ACL: File permission (public-read)
				 *
				 * @type {{Bucket: string, Key: string, Body, ACL: string}}
				 */
				params = {
					Bucket: "s27.html-to-pdf",
					Key   : filename + ".pdf",
					Body  : base64data,
					ACL   : "public-read",
				};
				
				// Upload function
				s3.putObject(params, function (err) {
					if (err) {
						res.status(500).send(err);
					}
					else {
						
						// Remove the PDF file
						fs.unlink(pdfFilename, function (err) {
							console.log(err);
						});
						
						// Return the result
						res.status(200).json({status: "ok", data: "https://s3.eu-central-1.amazonaws.com/" + params.Bucket + "/" + params.Key});
					}
				});
			});
		});
	});
};
)
;

module.exports = router;
