const express = require("express");
const mongoose = require("mongoose");
const userRoute = require('./routes/user');
const projectRoute = require('./routes/project');
const cardRoute = require('./routes/card');
const taskRoute = require('./routes/task');
const swaggerUI = require('swagger-ui-express');
const yaml = require('yamljs');
// const stageRoute = require('./routes/stage')

const { verifyToken } = require('./validate')


require('dotenv-flow').config();
let cors = require('cors')



const app = express();
app.use(cors())
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Private-Network", "true")
  res.header("Access-Control-Allow-Headers", "auth-token, Origin, X-Requested-With, Content-Type, Accept")
  next();
});

app.use(express.json());
const swaggerDefinition = yaml.load('./swagger.yaml');
app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerDefinition));

//variables

const PORT = process.env.PORT || 4000;
const HOST = process.env.DBHOST;

//connect to DB

mongoose.connect(HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(error => console.log(`could ot connect to database ${error}`));


// test
app.get('/api/user', (req, res) => {
  res.status(200).send({ message: "you are in user route, use '/api/user/register' to register or 'api/user/login' to login " })
})

//use routes

app.use('/api/user', userRoute)
app.use('/api/projects', verifyToken, projectRoute)
app.use('/api/projects', verifyToken, cardRoute)
app.use('/api/projects', verifyToken, taskRoute)
// app.use('/api/projects/', verifyToken, stageRoute)


// start server

app.listen(PORT, function () {
  console.log(`server is running on port ${PORT}`);
})

module.exports = app;