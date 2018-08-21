var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var Twig = require('twig');
var path = require('path');
var AWS = require('aws-sdk');

router.get('/', function (req, res, next) {
  res.render('index', { title: 'پرینتر' });
});

router.get('/how-make-a-css-print-ready-stylesheet', function (req, res, next) {
  res.render('how-to-print-css', { title: "چطور css رو برای پرینت آماده کنیم" })
});

router.post('/convert', async function (req, response, next) {
  try {
    var html = req.body.html;
    var author = req.body.author;
    var filename = req.body.title;
    var detail = req.body.detail || null;
    var theme = req.body.theme || "default";

    var options = {
      format: "A4",
      "header": {
        "height": "35mm",
        "contents": '<table class="header-table" style="text-align:center;"><tr><td>' + author + '</td><td style="font-weight: bold;">' + filename + '</td></tr></table>'
      },
      "footer": {
        "height": "28mm",
        "contents": {
          first: 'صفحه‌ی اول',
          2: 'صفحه‌ی دوم',
          default: '<div style="color: #333; font-size: 9px;border-top:1px solid #eee;">صفحه‌ی {{page}} از {{pages}}</div>'
        }
      },
    };

    var htmlFilename = path.join(__dirname, '../public/downloads/' + filename + '.html');
    var pdfFilename = path.join(__dirname, '../public/downloads/' + filename + '.pdf');
    var themeFilename = path.join(__dirname, '../public/stylesheets/prints/theme-' + theme + '.css');

    var themeCss = fs.readFileSync(themeFilename, 'utf8');
  
    await Twig.renderFile(__dirname + '/../views/print.html.twig', { content: html, title: filename, author: author, detail: detail, theme: themeCss }, (err, result) => {
      if (err) return response.status(500).json({status: 'error', error: err.message});

      fs.writeFileSync(htmlFilename, result, function (err) {
        if (err) return console.log(err);
      });
    
      var tempHtmlFile = fs.readFileSync(htmlFilename, 'utf8');
    
      pdf.create(tempHtmlFile, options).toFile(pdfFilename, function (err, res) {
        if (err) return response.status(500).json({status: 'error', error: err.message});
  
        fs.unlink(htmlFilename, function (err) {
          if (err) return response.status(500).json({status: 'error', error: err.message});

          AWS.config.update({ accessKeyId: process.env.AWS_AKID, secretAccessKey: process.env.AWS_SAK });
          var s3 = new AWS.S3();

          var pdfFile = fs.readFileSync(pdfFilename);
          var base64data = new Buffer(pdfFile, 'binary');

          params = {
            Bucket: "s27.html-to-pdf", 
            Key: filename + ".pdf", 
            Body: base64data, 
            ACL: 'public-read'
          };

          s3.putObject(params, function (err) {
            if (err) {
              response.status(500).send(err);
            } else {
              fs.unlink(pdfFilename, function(err) {
                console.log(err);
              });
              response.status(200).json({status: "ok", data: "https://s3.eu-central-1.amazonaws.com/" + params.Bucket + "/" + params.Key});
            }
          });
        });
      })
    });
  } catch(e) {
    next(e);
  }
});

module.exports = router;
