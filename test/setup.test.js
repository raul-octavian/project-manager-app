process.env.NODE_ENV = 'test';

const project = require('../models/project');
const user = require('../models/user');
const card = require('../models/card');
const task = require('../models/task');


// before((done) => {
//   project.deleteMany({}, function (err) { });
//   user.deleteMany({}, function (err) { });
//   card.deleteMany({}, function (err) { });
//   task.deleteMany({}, function (err) { });
//   done();
// });

// after((done) => {
//   project.deleteMany({}, function (err) { });
//   user.deleteMany({}, function (err) { });
//   card.deleteMany({}, function (err) { });
//   task.deleteMany({}, function (err) { });
//   done();
// })