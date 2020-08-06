var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      mode: "subscription",
      success_url: "https://oceanaio.com/dashboard",
      cancel_url: "https://oceanaio.com/"
    });
    res.render('index', {
      title: "OceanAIO.com | Best group for methods",
      sessionID: session.id
    });
  } catch (error) {
    console.log(error);
    res.render("index", {
      title: "OceanAIO.com | Best group for methods"
    });
  }
});

module.exports = router;