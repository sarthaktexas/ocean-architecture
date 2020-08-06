var express = require('express');
var secured = require('../lib/middleware/secured');
var router = express.Router();

/* GET dashboard. */
router.get('/dashboard', secured(), function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;
  res.render('dashboard', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'OceanAIO.com | Best group for methods'
  });
});

module.exports = router;
