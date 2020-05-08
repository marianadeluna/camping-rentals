// Get the app server port from the environment (assuming heroku) or default to 8000 for local testing
const port = process.env.PORT || 8000;

const app = require('./controller').app;

app.listen(port, () => {
  console.log(`HTTP server up on port ${port}`);
});
