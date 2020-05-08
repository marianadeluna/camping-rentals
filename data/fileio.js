/**
  File I/O for saving and retrieving tasks
*/

const fs = require('fs');

const files_location = "files";

module.exports.loadRental = (userId) => {
  /*  return [
      { id:1, dueDate:"7/4/2019", title:"Purchase sparklers",
        description:"Get sparklers for July 4 party", completed:false },
      { id:2, dueDate:"12/13/2018", title:"Study",
        description:"Study for final exams", completed:false }
      ]; */

  var rental;

  try {
    var theData = fs.readFileSync(`${files_location}/${userId}.json`);
    rental = JSON.parse(theData);
  }
  catch (error) {
    // Expected that the file will not exist for users without any rentals
    rental = [];
  }

  return rental;
};

module.exports.saveRental = (userId, rental) => {
  assureFilesDir();
  console.log(`Save equipment for ${userId}`, rental);
  fs.writeFileSync(`${files_location}/${userId}.json`, JSON.stringify(rental));
};

var assureFilesDir = () => {
  if (!fs.existsSync(files_location)) {
    fs.mkdirSync(files_location);
  }
}
