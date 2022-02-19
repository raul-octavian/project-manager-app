const router = require('express').Router();
const { resetWatchers } = require('nodemon/lib/monitor/watch');
const project = require("../models/project");
const card = require("../models/card");
const task = require("../models/task")
const user = require('../models/user');
const { route } = require('./user');
const { verifyToken } = require('../validate');
const { response } = require('express');


//create card

router.post('/:user/:project/:stage/create-card', async (req, res) => {
  card.insertMany(req.body)
    .then(
      data => {
        if (data) {
          const id = data[0].toObject()._id
          project.updateOne({ _id: req.params.project }, { $push: { cards: `${id}` } }, { new: true })
            .then(project => {

              if (project) {
                res.status(200).send(data)
              } else {
                res.status(400).send({ message: "there was an error retrieving project information or creating the card" })
              }
            })
        }
      }).catch(err => {
        res.status(500).send({ message: `there was an error creating card ${err.message}` })
      })
})



//get one card

router.get('/cards/:card', (req, res) => {
  card.findOne({ "_id": req.params.card })
    .populate({
      path: 'tasks',
      populate: {
        path: 'task_members',
      },
    })
    .populate('members')
    .then(data => {

      if (data) {

        res.status(200).send(data)
      } else {
        res.status(200).send({ message: "search found no results" })
      }
    }).catch(err => {
      res.status(500).send({ message: "there was an error" + err.message })
    })
})

//update

router.put('/cards/:card/update', (req, res) => {
  const id = req.params.card;

  card.findByIdAndUpdate(id, req.body)
    .then(data => {
      if (!data) {
        res.status(400).send({ message: `cannot find the card with id ${id}` })
      } else {
        res.status(201).send({ message: "card updated successfully" })
      }
    }).catch(err => {
      res.status(500).send({ message: `error updating card with id ${id},  ${err.message}` })
    })
})

//delete

router.delete('/cards/:project/:card/delete', async (req, res) => {
  const card_id = req.params.card;
  const project_id = req.params.project;

  try {

    let deletedTasks = await card.findById(card_id).then(response => {
      if (response.tasks.length) {
        for (const item of response.tasks) {
          task.findByIdAndRemove(item).then(
            response => console.log(response)
          )
        }
      }
    })

    card.findByIdAndRemove(card_id).then(response => {
      if (response) {
        project.findByIdAndUpdate(project_id, { $pull: { cards: card_id } }, { new: true })
          .then(data => {
            if (data.cards.find(item => item == card_id)) {
              res.status(400).send({ message: "cannot and update project " + project_id })
            } else {
              res.status(201).send({ message: "card deleted from project" })
            }
          })
      } else {
        res.status(400).send({ message: "the card could not be found, it may have been deleted, refresh the page and try again" })
      }
    }).catch(err => {
      res.status(500).send({ message: "error deleting the card with id: " + card_id + "error: " + err.message })
    })

  } catch (err) {
    res.status(500).send({ message: "there was an error deleting the card " + err.message })
  }
});

// add users to card

router.put('/:user/:project/:card/members', async (req, res) => {

  try {

    userInfo = await user.findOne({ email: req.body.email })
      .catch(err => {
        res.status(500).send({ message: `there was an error adding user ${err.message}` })
      });

    if (!userInfo) {
      res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct we will send him an join link.` })
    };
    const userExistsOnProject = await project.find({ _id: req.params.project, "members": userInfo.id });

    const userExistsOnCard = await card.find({ _id: req.params.card, "card_members": userInfo.id });

    const cardMembers = [];

    const projectMembers = [];

    if (userExistsOnProject.length) {
      if (userExistsOnCard.length) {
        cardMembers = await res.status(200).send({ message: "user is already a member on this card" })
      } else {
        card.updateOne({ _id: req.params.card }, { $addToSet: { card_members: userInfo.id } })
          .then(data => {
            if (data) {
              res.status(200).send({ message: "user added to card " + userInfo.id })
            }
          }).catch(err => {
            res.status(500).send({ message: `there was an error adding user ${err.message}` })
          })
      }
    } else {
      project.updateOne({ _id: req.params.project }, { $addToSet: { members: userInfo.id } })
        .then(data => {
          if (data) {
            console.log(userInfo.id )
          }
        }).catch(err => {
          res.status(500).send({ message: `there was an error adding user ${err.message}` })
        }).then(
          card.updateOne({ _id: req.params.card }, { $addToSet: { card_members: userInfo.id } })
            .then(data => {
              if (data) {
                res.status(200).send({ message: "user added to card and project"  })
              }
            }).catch(err => {
              res.status(500).send({ message: `there was an error adding user ${err.message}` })
            })
        )
    }
  } catch (err) {
    res.status(500).send({message: "err.message"})
  }

  
});

// remove member from card


router.put('/:user/:project/:card/members/remove', async (req, res) => {

  try { 


    userInfo = await user.findOne({ email: req.body.email })
      .catch(err => {
        res.status(500).send({ message: `there was an error finding user ${err.message}` })
      });

    if (!userInfo) {
      res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, the account might have been deleted` })
    };
    const userExistsOnCard = await card.find({ _id: req.params.card, "card_members": userInfo.id });

    if (userExistsOnCard.length) {
      console.log("if passed");
      card.updateOne({ _id: req.params.card }, { $pull: { card_members: userInfo.id } })
        .then(data => {
          if (data) {
            console.log(data);
            res.status(200).send({ message: "user removed from card member list" })
          }
        }).catch(err => {
          res.status(500).send({ message: `there was an error adding user ${err.message}` })
        })
    } else {
      res.status(400).send({ message: "user is not on the card members list" })
    }
  } catch (err) {
    res.status(500).send({ message: "err.message" })
  }

  
})

module.exports = router;