var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var Twig = require('twig'),
  twig = Twig.twig;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'پرینتر' });
});

router.post('/convert', function (req, response, next) {
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
        default: '<span style="color: #444; font-size: 9px;">صفحه‌ی {{page}} از {{pages}}</span>'
      }
    },
  };

  var html = req.body.html;
  var filename = req.body.title;
  var detail = null;

  Twig.renderFile(__dirname + '/../views/print.html.twig', { content: html, title: filename, author: req.body.author, detail: detail }, (err, result) => {
    fs.writeFileSync(filename + '.html', result, function (err) {
      if (err) return console.log(err);
    })
  
    var file = fs.readFileSync('./' + filename + '.html', 'utf8');
  
    pdf.create(file, options).toFile('./' + filename + '.pdf', function (err, res) {
      if (err) return console.log(err);
  
      fs.unlink(filename + '.html', function (err) {
        if (err) return console.log(err);
  
        console.log(filename + " removed")

        response.status(200).json({status: 'ok', filename: res.filename})
      })
    })
  });
});

module.exports = router;
