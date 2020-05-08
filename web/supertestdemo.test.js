/*
  Demonstrate some supertest functions

  https://www.npmjs.com/package/supertest

  HTTP assertions made easy via superagent.

  To make the express web app testable you must export the app (express instance)
  variable: e.g. module.exports.app = app;

  supertest provides the request function which needs the app, then you chain
  the set of tests using functions like expect() and then end the chain of tests
  with a call to end() accessing the done parameter (e.g. these are async tests)

  Note: To configure npm to run the tests, add a script to package.json
  for "test" and (optionally) "test-watch"
*/

//  ...
//  "scripts": {
//    ...
//    "test": "mocha \"./{,!(node_modules)/**/}*.test.js\"",
//    "test-watch": "nodemon --exec \"npm test\""
//    ...
//  }
//  ...

//  Once configured, in terminal run command: npm test or npm run test-watch

// Load the supertest library - common name for variable is "request"
const request = require("supertest");

// Load the expect library - common name for variable is "expect"
const expect = require('expect');

// Get the app instance (e.g. the express instance exported by the web app module)
var app = require('./controller.js').app;

describe("Web Application Tests", () => {
  // Verify the HTTP GET request to the server root
  // Expect (with Mocha) is the test framework using supertest to handle
  // the HTTP interactions


  it('should return 500 for improper login details', (done) => {
        request(app)
        .post('/details')
        .type('form')
        .send({fname:"24242",lname:"De Luna",email:"mdeluna@skidmore.edu"})
        .expect(500)
        .end(done);
     });

     it('should return 404 with error message', (done) => {
       request(app)
       .get('/nosuchpage')
       .expect(404)
       .end(done);
     });

     it('should return 200 for logging in a user', (done) => {
           request(app)
           .post('/details')
           .type('form')
           .send({fname:"Mariana",lname:"De Luna",email:"mdeluna@skidmore.edu"})
           .expect(302)
           .end(done);
        });

      it('should return 302 for form in confirmation', (done) => {
          request(app)
            .post('/confirmation')
            .type('form')
            .send({rentstart:"2018-12-20",rentend:"2018-12-23", pickupdate:"2018-12-19",pickuptime:"04:00 AM"})
            .expect(302)
            .end(done);
     });


});
