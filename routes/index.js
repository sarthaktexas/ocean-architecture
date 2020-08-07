var express = require('express');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var generatePassword = require('password-generator');
var request = require('request');
const Discord = require('discord.js');
const webhookClient = new Discord.WebhookClient(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);

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

const bodyParser = require('body-parser');
router.post('/webhook', bodyParser.raw({
  type: 'application/json'
}), (request, response) => {
  let event;

  try {
    event = JSON.parse(request.body);
    console.log(event);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      /*  When payment succeeded, generate a random password
          and send an API call to Auth0 to create a user */
      const paymentIntent = event.data.object;
      var password = generatePassword(12, false, 'temp-') // -> temp-6739029;
      // DEBUG ONLY
      console.log(password);

      var headers = {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxlcnlnSzB2d1hlUTRYMjVwbHVidCJ9.eyJpc3MiOiJodHRwczovL29jZWFuYWlvLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJ0Q2hEcHZXend3OUU3aHk1aEp1QXJFeEg2NXpSNGloWkBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9vY2VhbmFpby51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTU5NjY5ODE3MCwiZXhwIjoxNTk2Nzg0NTcwLCJhenAiOiJ0Q2hEcHZXend3OUU3aHk1aEp1QXJFeEg2NXpSNGloWiIsInNjb3BlIjoicmVhZDpjbGllbnRfZ3JhbnRzIGNyZWF0ZTpjbGllbnRfZ3JhbnRzIGRlbGV0ZTpjbGllbnRfZ3JhbnRzIHVwZGF0ZTpjbGllbnRfZ3JhbnRzIHJlYWQ6dXNlcnMgdXBkYXRlOnVzZXJzIGRlbGV0ZTp1c2VycyBjcmVhdGU6dXNlcnMgcmVhZDp1c2Vyc19hcHBfbWV0YWRhdGEgdXBkYXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBkZWxldGU6dXNlcnNfYXBwX21ldGFkYXRhIGNyZWF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgcmVhZDp1c2VyX2N1c3RvbV9ibG9ja3MgY3JlYXRlOnVzZXJfY3VzdG9tX2Jsb2NrcyBkZWxldGU6dXNlcl9jdXN0b21fYmxvY2tzIGNyZWF0ZTp1c2VyX3RpY2tldHMgcmVhZDpjbGllbnRzIHVwZGF0ZTpjbGllbnRzIGRlbGV0ZTpjbGllbnRzIGNyZWF0ZTpjbGllbnRzIHJlYWQ6Y2xpZW50X2tleXMgdXBkYXRlOmNsaWVudF9rZXlzIGRlbGV0ZTpjbGllbnRfa2V5cyBjcmVhdGU6Y2xpZW50X2tleXMgcmVhZDpjb25uZWN0aW9ucyB1cGRhdGU6Y29ubmVjdGlvbnMgZGVsZXRlOmNvbm5lY3Rpb25zIGNyZWF0ZTpjb25uZWN0aW9ucyByZWFkOnJlc291cmNlX3NlcnZlcnMgdXBkYXRlOnJlc291cmNlX3NlcnZlcnMgZGVsZXRlOnJlc291cmNlX3NlcnZlcnMgY3JlYXRlOnJlc291cmNlX3NlcnZlcnMgcmVhZDpkZXZpY2VfY3JlZGVudGlhbHMgdXBkYXRlOmRldmljZV9jcmVkZW50aWFscyBkZWxldGU6ZGV2aWNlX2NyZWRlbnRpYWxzIGNyZWF0ZTpkZXZpY2VfY3JlZGVudGlhbHMgcmVhZDpydWxlcyB1cGRhdGU6cnVsZXMgZGVsZXRlOnJ1bGVzIGNyZWF0ZTpydWxlcyByZWFkOnJ1bGVzX2NvbmZpZ3MgdXBkYXRlOnJ1bGVzX2NvbmZpZ3MgZGVsZXRlOnJ1bGVzX2NvbmZpZ3MgcmVhZDpob29rcyB1cGRhdGU6aG9va3MgZGVsZXRlOmhvb2tzIGNyZWF0ZTpob29rcyByZWFkOmFjdGlvbnMgdXBkYXRlOmFjdGlvbnMgZGVsZXRlOmFjdGlvbnMgY3JlYXRlOmFjdGlvbnMgcmVhZDplbWFpbF9wcm92aWRlciB1cGRhdGU6ZW1haWxfcHJvdmlkZXIgZGVsZXRlOmVtYWlsX3Byb3ZpZGVyIGNyZWF0ZTplbWFpbF9wcm92aWRlciBibGFja2xpc3Q6dG9rZW5zIHJlYWQ6c3RhdHMgcmVhZDp0ZW5hbnRfc2V0dGluZ3MgdXBkYXRlOnRlbmFudF9zZXR0aW5ncyByZWFkOmxvZ3MgcmVhZDpzaGllbGRzIGNyZWF0ZTpzaGllbGRzIHVwZGF0ZTpzaGllbGRzIGRlbGV0ZTpzaGllbGRzIHJlYWQ6YW5vbWFseV9ibG9ja3MgZGVsZXRlOmFub21hbHlfYmxvY2tzIHVwZGF0ZTp0cmlnZ2VycyByZWFkOnRyaWdnZXJzIHJlYWQ6Z3JhbnRzIGRlbGV0ZTpncmFudHMgcmVhZDpndWFyZGlhbl9mYWN0b3JzIHVwZGF0ZTpndWFyZGlhbl9mYWN0b3JzIHJlYWQ6Z3VhcmRpYW5fZW5yb2xsbWVudHMgZGVsZXRlOmd1YXJkaWFuX2Vucm9sbG1lbnRzIGNyZWF0ZTpndWFyZGlhbl9lbnJvbGxtZW50X3RpY2tldHMgcmVhZDp1c2VyX2lkcF90b2tlbnMgY3JlYXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgZGVsZXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgcmVhZDpjdXN0b21fZG9tYWlucyBkZWxldGU6Y3VzdG9tX2RvbWFpbnMgY3JlYXRlOmN1c3RvbV9kb21haW5zIHVwZGF0ZTpjdXN0b21fZG9tYWlucyByZWFkOmVtYWlsX3RlbXBsYXRlcyBjcmVhdGU6ZW1haWxfdGVtcGxhdGVzIHVwZGF0ZTplbWFpbF90ZW1wbGF0ZXMgcmVhZDptZmFfcG9saWNpZXMgdXBkYXRlOm1mYV9wb2xpY2llcyByZWFkOnJvbGVzIGNyZWF0ZTpyb2xlcyBkZWxldGU6cm9sZXMgdXBkYXRlOnJvbGVzIHJlYWQ6cHJvbXB0cyB1cGRhdGU6cHJvbXB0cyByZWFkOmJyYW5kaW5nIHVwZGF0ZTpicmFuZGluZyBkZWxldGU6YnJhbmRpbmcgcmVhZDpsb2dfc3RyZWFtcyBjcmVhdGU6bG9nX3N0cmVhbXMgZGVsZXRlOmxvZ19zdHJlYW1zIHVwZGF0ZTpsb2dfc3RyZWFtcyBjcmVhdGU6c2lnbmluZ19rZXlzIHJlYWQ6c2lnbmluZ19rZXlzIHVwZGF0ZTpzaWduaW5nX2tleXMgcmVhZDpsaW1pdHMgdXBkYXRlOmxpbWl0cyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.XngU-CfcoLCgp3byBkD_eYRKmQ2zyx1BEhYSo9dK2BP0_DPu7yVrnf_CwKsy_HzXNDkJXYh4cJliM6j7T_NWDSJaC76XckZNqTMUzlYEt9TOTQzTjLKUrQe86SHUaO8AYyNmLcs9fYbDZkt4wHFT2bDVC2XatpyX0FOEnd-VmnXny3uWgyXkP1I_4JtToSy4jP5BWp53C3-SoYAXkUBYT9Q-PlbXXITLWxWxwXxGnQP3CRZi1XinTO41pVGbs7egST5TS_PGBkrfWHD65IednUOvHxrpxJTlb6vg6LxLButIPqnM6O00Dh2umZhdloRWxxs2DSOHJhSXOFSqb8DwMg',
        'Content-Type': 'application/json'
      };

      var options = {
        url: 'https://oceanaio.us.auth0.com/api/v2/users',
        method: 'POST',
        headers: headers,
        body: {
          "email": paymentIntent.charges.data.email,
          "name": paymentIntent.charges.data.name,
          "connection": "Username-Password-Authentication",
          "password": password,
          "user_id": customer.id
        }
      };

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body);
        }
      }

      request(options, callback);

      // Send email to user with password.

      // Send Discord Webhook event

      const successembed = new Discord.MessageEmbed()
        .setTitle('New Payment and User')
        .setColor('#0099ff')
        .setDescription(paymentMethod.charges.data.name + '(' + paymentMethod.charges.data.email + ') has signed up and paid.');

      webhookClient.send({
        username: 'Success Bot',
        avatarURL: 'https://www.americasfinestlabels.com/includes/work/image_cache/a4cb211cac7697694b91b494f3620ca4.thumb.jpg',
        embeds: [successembed],
      });
      break;
    case 'invoice.payment_failed':
      const paymentMethod = event.data.object;
      // Send Discord Webhook event

      const failembed = new Discord.MessageEmbed()
        .setTitle('Failed Payment!')
        .setColor('#0099ff')
        .setDescription(paymentMethod.charges.data.name + '(' + paymentMethod.charges.data.email + ') has not paid for the month. Delete thier account in the Auth0 Dashboard.');

      webhookClient.send({
        username: 'Failure Bot',
        avatarURL: 'https://www.logolynx.com/images/logolynx/cc/cc69b8e3f205d98a6586a715df8f9b92.gif',
        embeds: [failembed],
      });
      break;
      // case 'invoice.payment_action_required':
      //   const paymentMethod = event.data.object;
      //   break;
      // case 'invoice.paid':
      //   const paymentMethod = event.data.object;
      //   break;
    default:
      return response.status(400).end();
  }

  // Return a response to acknowledge receipt of the event
  response.json({
    received: true
  });
});

module.exports = router;