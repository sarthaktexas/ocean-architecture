var express = require('express');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var generatePassword = require('password-generator');
var bodyParser = require('body-parser');
var fetch = require('node-fetch');
var axios = require('axios');
var Discord = require('discord.js');
var webhookClient = new Discord.WebhookClient(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);
const MailgunSDK = require('mailgun-js-sdk');
const Mailgun = new MailgunSDK({
  apiKey: process.env.MAILGUN_API_KEY
});

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      mode: "subscription",
      success_url: "https://oceanaio.com/dashboard",
      cancel_url: "https://oceanaio.com/login"
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

router.post('/webhook', bodyParser.raw({
  type: 'application/json'
}), async (request, response) => {
  let event;

  try {
    event = JSON.parse(request.body);

    var tokenRequest = await axios({
      method: 'post',
      url: 'https://oceanaio.us.auth0.com/oauth/token',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        "client_id": process.env.AUTH0_CLIENT_ID,
        "client_secret": process.env.AUTH0_CLIENT_SECRET,
        "audience": "https://oceanaio.us.auth0.com/api/v2/",
        "grant_type": "client_credentials"
      }
    });
    var token = tokenRequest.data.access_token;
    var authenticationHeader = 'Bearer ' + token;

  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      /*  When payment succeeded, generate a random password
          and send an API call to Auth0 to create a user */
      const paymentIntent = event.data.object;
      const password = generatePassword(12, false);
      console.log(password);

      var body = JSON.stringify({
        "email": paymentIntent.charges.data[0].billing_details.email,
        "name": paymentIntent.charges.data[0].billing_details.name,
        "connection": "Username-Password-Authentication",
        "password": password,
        "user_id": paymentIntent.customer,
        "email_verified": true,
      });

      // Send email with password
      const domain = 'email.oceanaio.com';
      var text = 'Login Information:\nEmail: ' + paymentIntent.charges.data[0].billing_details.email + '\nPassword: ' + password;
      const message = {
        from: 'no-reply@email.oceanaio.com',
        to: paymentIntent.charges.data[0].billing_details.email,
        subject: 'Login Information for OceanAIO',
        text: text,
      };
      const result = await Mailgun.sendMessage(domain, message);

      // Create User

      var headers = {
        'Authorization': authenticationHeader,
        'Content-Type': 'application/json'
      };

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body);
        }
      }

      fetch('https://oceanaio.us.auth0.com/api/v2/users', {
        method: 'POST',
        body: body,
        headers: headers,
      })

      // Send Discord Webhook event

      const successembed = new Discord.MessageEmbed()
        .setTitle('New Payment and User')
        .setColor('#50C878')
        .setDescription(paymentIntent.charges.data[0].billing_details.name + ' (*' + paymentIntent.charges.data[0].billing_details.email + '*) has signed up and paid.');

      webhookClient.send({
        username: 'Success Bot',
        avatarURL: 'https://www.americasfinestlabels.com/includes/work/image_cache/a4cb211cac7697694b91b494f3620ca4.thumb.jpg',
        embeds: [successembed],
      });
      break;
    case 'invoice.payment_failed':
      const paymentFail = event.data.object;

      // Send Discord Webhook event

      const failembed = new Discord.MessageEmbed()
        .setTitle('Failed Payment!')
        .setColor('#DE1738')
        .setDescription(paymentFail.customer_name + ' (*' + paymentFail.customer_email + '*) has not paid for the month. Delete thier account in the Auth0 Dashboard and remove them from Discord.');

      webhookClient.send({
        username: 'Failure Bot',
        avatarURL: 'https://www.logolynx.com/images/logolynx/cc/cc69b8e3f205d98a6586a715df8f9b92.gif',
        embeds: [failembed],
      });
      break;
    case 'customer.subscription.deleted':
      const subscriptionEvent = event.data.object;
      var headers = {
        'Authorization': authenticationHeader,
        'Content-Type': 'application/json'
      };

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body);
        }
      }

      const deleteUrl = 'https://oceanaio.us.auth0.com/api/v2/users/auth0|' + subscriptionEvent.customer

      fetch(deleteUrl, {
          method: 'DELETE',
          headers: headers,
        })
        .then(stripe.customers.del(
          subscriptionEvent.customer,
          function (err, confirmation) {}
        ));

      // Send Discord Webhook event

      const cancelembed = new Discord.MessageEmbed()
        .setTitle('Cancel Subscription!')
        .setColor('#DE1738')
        .setDescription('**' + subscriptionEvent.customer + '** has cancelled thier account. Remove them on Discord.');

      webhookClient.send({
        username: 'Cancel Bot',
        avatarURL: 'https://www.logolynx.com/images/logolynx/cc/cc69b8e3f205d98a6586a715df8f9b92.gif',
        embeds: [cancelembed],
      });
      break;
    case 'invoice.paid':
      const invoicePaid = event.data.object;
      // Send Discord Webhook event

      const repayembed = new Discord.MessageEmbed()
        .setTitle('Repayment')
        .setColor('#50C878')
        .setDescription(invoicePaid.customer + ' (*' + invoicePaid.customer_email + '*) has paid for this month.');

      webhookClient.send({
        username: 'Success Bot',
        avatarURL: 'https://www.americasfinestlabels.com/includes/work/image_cache/a4cb211cac7697694b91b494f3620ca4.thumb.jpg',
        embeds: [repayembed],
      });
      break;
    default:
      return response.status(400).end();
  }

  // Return a response to acknowledge receipt of the event
  response.json({
    received: true
  });
});

module.exports = router;