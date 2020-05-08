/**
  Manage the set of provier search operations

*/
const nodemailer = require('nodemailer');
const validator = require('validator');
const express = require('express');
const session = require('express-session')
const bodyParser = require('body-parser');
const hbs = require('hbs');
const logger = require('../utils/logging.js').logger;
const web_logging_setup = require('./web_logging').setupWebLog;
const fileIO = require('../data/fileio.js');
const crypto = require('crypto');

const app = express();

web_logging_setup(app);

hbs.registerPartials(__dirname + "/../views/partials");


// Use the session middleware - set session lifetime to 10 minutes
app.use(session({
  secret: 'a secret cookie signing value',
  cookie: {
    maxAge: 600000
  },
  resave: false,
  saveUninitialized: false
}));

// Set express configuration for using hbs
// The set function adds key-value pairs to the express configuration
app.set('view engine', 'hbs');

// Support serving static webpages located in a directory of the project named "public"
app.use(express.static("public"));

// Support URL-encoded bodies (e.g. POST payloads from web forms)
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', (req, res) => {
  var csrfToken = csrfTokenGenerator(31);
  req.session.csrfToken = csrfToken;
  if (req.session.email != null) {
    logger.info(`homepage view for ${req.session.email}`);
    res.render('homepage', {
      rental: req.session.rental,
      csrfToken: req.session.csrfToken
    });

  } else {
    logger.info('User has not entered their information');
    res.render('details');
  }
});

app.post('/details', (req, res) => {
  var email = req.body.email.toString().trim();
  var firstName = req.body.fname.toString().trim();
  var lastName = req.body.lname.toString().trim();
  var errorMessage = [];

  if (!firstName || firstName.length == 0 || !validator.isAlpha(validator.blacklist(firstName, ' '))) {
    errorMessage.push("First name is required");
    logger.error("Attempt to rent without a first name");
  }

  if (!lastName || lastName.length == 0 || !validator.isAlpha(validator.blacklist(lastName, ' '))) {
    errorMessage.push("Last name is required");
    logger.error("Attempt to rent without a last name");
  }

  if (!email || email.length == 0 || !validator.isEmail(email)) {
    errorMessage.push("Email is required");
    logger.error("Attempt to rent without an email or invalid email format");
  }

  if (errorMessage.length > 0) {
    logger.error("Errors with user information in:", errorMessage);
    res.render('details', {
      errorMessage
    });
  } else {
    rental = fileIO.loadRental(email);
    req.session.rental = rental;
    req.session.email = email;
    res.redirect("/");
  }
}); // end /details



app.post('/confirmation', (req, res) => {
  if (!req.session.email) {
    res.redirect('/');
    return;
  }

  var errorMessage = [];
  var rental = req.session.rental;
  var equipment = req.body.equipment;

  if (!equipment) {
    errorMessage.push("Choose a piece of equipment to rent");
    logger.error("Request to confirm rental with no selected equipment - user " + req.session.email);
    res.render('homepage', {
      errorMessage,
      rental: req.session.rental
    });
  } else {
    var maxId;
    if (rental.length) {
      maxId = rental[0].id;
      for (index in rental) {
        if (rental[index].id > maxId) {
          maxId = rental[index].id;
        }
      }
    } else {
      maxId = 0;
    }
    var id = maxId + 1;

    rental.push({
      id,
      equipment
    });

    fileIO.saveRental(req.session.email, rental);
    req.session.rental = rental;

    console.log(`Confirmation view (from homepage) for ${req.session.email}`);
    res.render('confirmation', {
      errorMessage,
      rental
    });
  } // end if

}); // end /confirmation


app.post('/deletedrental', (req, res) => {
  if (!req.session.email) {
    res.redirect('/');
    return;
  }

  var rentals = req.body.rental_id;
  var errorMessage = [];

  if (!rentals) {
    errorMessage.push('There was no equipment identified to be deleted');
  } else {
    rental = req.session.rental;
    var positionToRemove = -1;
    for (index in rental) {
      if (rental[index].id == rentals) {
        positionToRemove = index;
      }
    }
    if (positionToRemove > -1) {
      errorMessage.push(`Deleted rentals: ${rental[positionToRemove].equipment}`);
      rental.splice(positionToRemove, 1);
      fileIO.saveRental(req.session.email, rental);
      req.session.rental = rental;
    } else {
      errorMessage.push(`No equipment with id ${rentals} found. No rental removed.`);
    }
  }

  console.log(`confirmation view (from delete) for ${req.session.email}`);
  res.render('confirmation', {
    errorMessage,
    rental
  });
});

app.post('/confirmed', (req, res) => {
      if (!req.session.email) {
        res.redirect('/');
        return;
      }
      var errorMessage = [];
      var csrfToken = req.body.csrfToken;
      var equipment = req.body.equipment;
      var rental = req.session.rental;
      var rentstart = req.body.rentstart;
      var rentend = req.body.rentend;
      var pickupdate = req.body.rentpickup;
      var pickuptime = req.body.usr_time;
      var conEmail = req.body.email;

      if (!rentstart || rentstart.length == 0 || !validator.isNumeric(validator.blacklist(rentstart, ['-/']))) {
        errorMessage.push("Rent Start Date is invalid");
        logger.error("Attempt to enter invalid start date");
        errorMessage.push('Please complete all parts of the form');
        logger.error("Incomplete form, cannot confirm " + req.session.email);
        res.render('confirmation', {
          errorMessage,
          rental: req.session.rental,
          csrfToken: req.session.csrfToken

        });
      } else if (!rentend || rentend.length == 0 || !validator.isNumeric(validator.blacklist(rentend, ['-/']))) {
        errorMessage.push("Rent End Date is invalid");
        logger.error("Attempt to enter invalid end date");
        errorMessage.push('Please complete all parts of the form');
        logger.error("Incomplete form, cannot confirm " + req.session.email);
        res.render('confirmation', {
          errorMessage,
          rental: req.session.rental,
          csrfToken: req.session.csrfToken

        });
      } else if (!pickupdate || pickupdate.length == 0 || !validator.isNumeric(validator.blacklist(pickupdate, ['-/']))) {
        errorMessage.push("Pick up Date is invalid");
        logger.error("Attempt to enter invalid pick up date");
        errorMessage.push('Please complete all parts of the form');
        logger.error("Incomplete form, cannot confirm " + req.session.email);
        res.render('confirmation', {
          errorMessage,
          rental: req.session.rental,
          csrfToken: req.session.csrfToken

        });
      } else if (!conEmail || conEmail.length == 0 || !validator.isEmail(conEmail)) {
        errorMessage.push("Email is invalid");
        logger.error("Attempt to enter invalid email");
        errorMessage.push('Please complete all parts of the form');
        logger.error("Incomplete form, cannot confirm " + req.session.email);
        res.render('confirmation', {
          errorMessage,
          rental: req.session.rental,
          csrfToken: req.session.csrfToken

        });

      } else {
        console.log(`Confirmed view (from confirmation) for ${req.session.email}`);
        res.render('confirmed', {
            errorMessage,
            rental
          });
      }
      //send email
      var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
          user: 'fvalumniassociation@gmail.com',
          pass: 'umlqwnogpcyakvsb'
        }
      });

      var mailOptions = {
        from: 'fvalumniassociation@gmail.com',
        to: conEmail,
        subject: 'Confirmation Email from Camping Rentals',
        text: 'Your order was confirmed. We expect to see you during your pick up date and time: ' + pickupdate + ' ' + pickuptime +
        ' Here are your order details: ' +
        ' Rent Start: ' + rentstart +
        ' Rent End: ' + rentend +
        ' Thank you for choosing Camping Equipment Rentals!'
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

  });

    app.post('/deletesession', (req, res) => {
      if (!req.session.email) {
        res.redirect('/');
        return;
      }

      var rentals = req.body.rental_id;
      var errorMessage = [];

      if (!rentals) {
        req.session.destroy();
        res.redirect('/');
      } else {
        rental = req.session.rental;
        var positionToRemove = -1;
        for (index in rental) {
          if (rental[index].id == rentals) {
            positionToRemove = index;
          }
        }
        if (positionToRemove > -1) {
          errorMessage.push(`Deleted rentals: ${rental[positionToRemove].equipment}`);
          rental.splice(positionToRemove, 1);
          fileIO.saveRental(req.session.email, rental);
          req.session.rental = rental;
        } else {
          errorMessage.push(`No equipment with id ${rentals} found. No rental removed.`);
        }
      }

      req.session.destroy();
      res.redirect('/');
    })

    // Default missing route handler - we will cover custom middleware later in the semester
    app.use(function(req, res, next) {
      handleError(404, "No route defined at the requested URL", res)
    });

    // Default error handler - we will cover custom middleware later in the semester
    app.use(function(err, req, res, next) {
      logger.error("Express error encountered: " + err.stack)
      handleError(500, err, res);
    });

    var handleError = (code, err, res) => {
      res.status(code);
      if (!err) {
        err = "No specific error message reported, check the logs";
      }
      logger.error(`Display error page: code:${code} message:${err}`);
      res.render('bad_request', {
        err
      });
    };

      arr = new Uint8Array(31);
      crypto.randomFillSync(arr);


      function csrfTokenGenerator(bytes) {
        randArray = new Buffer.alloc(bytes);
        crypto.randomFillSync(randArray);
        return randArray.toString("base64");
      }

    module.exports.app = app;
