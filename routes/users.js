var express = require('express');
var secured = require('../lib/middleware/secured');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/* GET dashboard. */
router.get('/dashboard', secured(), function (req, res, next) {
  const {
    _raw,
    _json,
    ...userProfile
  } = req.user;
  const id = req.user.id.substring(6);
  console.log(id);
  res.render('dashboard', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'OceanAIO.com | Best group for methods'
  });
});

router.post('/portal', secured(), async function (req, res, next) {
  try {
    const {
      _raw,
      _json,
      ...userProfile
    } = req.user;
    const profile = JSON.stringify(userProfile, null, 2);
    const id = req.user.id.substring(6);
    console.log(id);
    if (process.env.NODE_ENV === 'production') {
      var session = await stripe.billingPortal.sessions.create({
        customer: id,
        return_url: 'https://oceanaio.com/dashboard',
      });
    } else {
      var session = await stripe.billingPortal.sessions.create({
        customer: id,
        return_url: 'http://localhost:3000/dashboard',
      });
    }
    console.log(session.url);
    res.redirect(session.url);
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;