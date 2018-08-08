var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var Twig = require('twig');
var path = require('path');
var AWS = require('aws-sdk');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'پرینتر' });
});

router.post('/convert', async function (req, response, next) {
  try {
    var options = {
      format: "A4",
      "header": {
        "height": "35mm",
        "contents": '<table class="header-table" style="text-align:center;"><tr><td>' + req.body.author + '</td><td style="font-weight: bold;">' + req.body.title + '</td></tr></table>'
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
  
    var html = req.body.html;
    var filename = req.body.title;
    var detail = null;

    var htmlFilename = path.join(__dirname, '../public/downloads/' + filename + '.html');
    var pdfFilename = path.join(__dirname, '../public/downloads/' + filename + '.pdf');
  
    await Twig.renderFile(__dirname + '/../views/print.html.twig', { content: html, title: filename, author: req.body.author, detail: detail }, (err, result) => {
      fs.writeFileSync(htmlFilename, result, function (err) {
        if (err) return console.log(err);
      });
    
      var file = fs.readFileSync(htmlFilename, 'utf8');
    
      pdf.create(file, options).toFile(pdfFilename, function (err, res) {
        if (err) return console.log(err);
  
        fs.unlink(htmlFilename, function (err) {
          if (err) return response.status(500).json({status: 'error', error: err.message});

          AWS.config.update({ accessKeyId: process.env.AWS_AKID, secretAccessKey: process.env.AWS_SAK });
          var s3 = new AWS.S3();

          var pdfFile = fs.readFileSync(pdfFilename);
          var base64data = new Buffer(pdfFile, 'binary');

          params = {Bucket: "s27.html-to-pdf", Key: filename + ".pdf", Body: base64data, ACL: 'public-read'};

          s3.putObject(params, function (err) {
            if (err) {
              console.log(err)
              response.status(500).send(err);
            } else {
              response.status(200).json({status: "ok", data: "https://s3.eu-central-1.amazonaws.com/s27.html-to-pdf/" + params.Key});
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
