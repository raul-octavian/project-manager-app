const router = require('express').Router();
const { resetWatchers } = require('nodemon/lib/monitor/watch');
const card = require('../models/card');
const project = require("../models/project")
const user = require('../models/user');
const { route } = require('./user');
const { verifyToken } = require('../validate');


router.post('/:user/:project/:stage/create-card', async (req, res) => {
  
  data = req.body;

  card.insertMany(data)
    .then(data => {
      if (data) {
        res.status(200).send(data)
      } else {
        res.status(500).send({message: "card could not be created"})
      }
    }).catch(err => {
      res.status(500).send({ message: `there was an error adding user ${err.message}` })
})
})

module.exports = router;