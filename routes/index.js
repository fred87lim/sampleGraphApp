var express = require('express');
var router = express.Router();

// router.get('/fullGraph', function(req, res){
// 	return res.render('/fullGraph');
// });

router.get('/inspectGraph', function(req, res) {
	console.log("In '/inspectGraph'");
  return res.render('inspectGraph');
});

router.get('/findConn', function(req, res){
  return res.render('findConn');
});

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log("In '/'");
  return res.render('index', { title: 'Express' });
});

module.exports = router;
