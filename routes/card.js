const router = require('express').Router();
const { resetWatchers } = require('nodemon/lib/monitor/watch');
const project = require("../models/project");
const card = require("../models/card");
const user = require('../models/user');
const { route } = require('./user');
const { verifyToken } = require('../validate');


//create card

router.post('/:user/:project/:stage/create-card', async (req, res) => {
  card.insertMany(req.body)
    .then(
      data => {
        if (data) {
          const id = data[0].toObject()._id
          project.updateOne({ _id: req.params.project }, { $push: { cards: `${id}` } }, { new: true })
            .then(project => {
              console.log(project)
              if (project) {
                res.status(200).send(data)
              } else {
                res.status(400).send({message: "there was an error retrieving project information or creating the card" })
              }
            })
        }
    }).catch(err => {
      res.status(500).send({ message: `there was an error creating card ${err.message}` })
})
})



//get one card

router.get('/:project/:card', (req, res) => {
  project.findOne({ "cards.$.id" : req.params.card })
    .then(data => {
      console.log(data)
      if (data) {
        console.log(data)
        res.status(200).send(data)
      } else {
        res.status(200).send({message: "search found no results"})
      }
    }).catch(err => {
    res.status(500).send({message : "there was an error" + err.message})
  })
})

//update

// router.put('/:project/:card/update', (req, res) => {
//   project.findOneAndUpdate({ "cards.$.id": req.params.card }, req.body)
//     .then(data => {
//       if (data) {
//         res.status(201).send(data)
//       } else {
//         res.status(200).send({ message: "search found no results" })
//       }
//     }).catch(err => {
//       res.status(500).send({ message: "there was an error" + err.message })
//     })
// })


// router.put('/:project/:card/update', (req, res) => {
//  project.findOne({ "_id": req.params.project })
//    .then(data => {
//      let card = data.cards.filter(card => card._id == req.params.card);
//      console.log("before set", card)
//      card = req.body;
//      console.log("after set", card)
//       response = project.save();
//       if (response) {
//         res.status(201).send(response)
//       } else {
//         res.status(200).send({ message: "search found no results" })
//       }
//     }).catch(err => {
//       res.status(500).send({ message: "there was an error" + err.message })
//     })
// })

router.put('/:project/:card/update', (req, res) => {
  project.findOneAndUpdate({ "_id": req.params.project, "cards._id": req.params.card }, {
    $set: {
    "cards.$": req.body
  }})
    .then(data => {
      if (data) {
        res.status(201).send(data)
      } else {
        res.status(200).send({ message: "search found no results" })
      }
    }).catch(err => {
      res.status(500).send({ message: "there was an error" + err.message })
    })
})

module.exports = router;