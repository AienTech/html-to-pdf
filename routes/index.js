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

router.post('/convert', function (req, res, next) {
  var options = {
    format: "A4",
    "header": {
      "height": "35mm",
      "contents": '<div style="text-align: center;border-bottom: 1px solid #eee;">' + req.body.title + '</div>'
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
  var filename = new Date() + '.html';

  Twig.renderFile(__dirname + '/../views/print.html.twig', { content: html }, (err, result) => {
    fs.writeFileSync(filename, result, function (err) {
      if (err) return console.log(err);
    })
  
    var file = fs.readFileSync('./' + filename, 'utf8');
  
    pdf.create(file, options).toFile('./' + filename + '.pdf', function (err, res) {
      if (err) return console.log(err);
  
      console.log(res);
  
      fs.unlink(filename, function (err) {
        if (err) return console.log(err);
  
        console.log(filename + " removed")
      })
    })
  });
});

module.exports = router;
