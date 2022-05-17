const router = require('express').Router();

const Project = require("../models/project");
const Card = require("../models/card");
const Task = require("../models/task")
const User = require('../models/user');
const cache = require('../cache/cache')



//create card

router.post('/:project/create-card', async (req, res) => {
  let cardIndex = 0;
  try {

    cardIndex = await Card.count();
    Card.insertMany({
      cardName: req.body.cardName,
      stage: req.body.stage,
      index: cardIndex
    })
      .then(
        data => {
          if (data) {
            cache.flushAll();
            const id = data[0].toObject()._id
            Project.updateOne({ _id: req.params.project }, { $push: { cards: `${id}` } }, { new: true })
              .then(project => {

                if (project) {
                  res.status(200).send(data)
                } else {
                  res.status(400).send({ error: "there was an error retrieving project information or creating the card" })
                }
              })
          }
        }).catch(err => {
          sendError(res, err)
        })

  } catch (err) {
    sendError(res, err)

  }

})



//get one card

router.get('/cards/:card', (req, res) => {
  Card.findOne({ "_id": req.params.card })
    .then(data => {

      if (data) {

        res.status(200).send(data)
      } else {
        res.status(200).send({ message: "search found no results, the card might have been deleted" })
      }
    }).catch(err => {
      sendError(res, err)
    })
})

//update

router.put('/:project/cards/:card/update', (req, res) => {
  const id = req.params.card;
  const projectId = req.params.project
  const card = req?.body?.cardUsedHours


  Card.findByIdAndUpdate(id, req.body, { new: true, upsert: true })
    .then(data => {
      if (!data) {
        res.status(400).send({ error: `cannot find the card with id ${id}` })
      } else {
        cache.flushAll();
        res.status(201).send(data)
      }
    }).then(
      setUsedHoursOnProject(card, projectId)
    ).catch(err => {
      sendError(res, err)
    })
})

//set stage

// not in user anymore

router.put('/cards/:card/set-stage', (req, res) => {
  const id = req.params.card;

  Card.findByIdAndUpdate(id, req.body, { new: true })
    .then(data => {
      if (!data) {
        res.status(400).send({ error: `cannot find the card with id ${id}` })
      } else {
        cache.flushAll();
        res.status(201).send(data)
      }
    }).catch(err => {
      sendError(res, err)
    })
})


//delete

router.delete('/cards/:project/:card/delete', async (req, res) => {
  const card_id = req.params.card;
  const project_id = req.params.project;

  try {

    let cardToBeDeleted = await Card.findById(card_id);

    const tasksDeleted = await cardToBeDeleted?.tasks.map(async item => {
      let taskDeleted = await Task.findByIdAndDelete(item._id)
    })


    deletedCard = await Card.findByIdAndRemove(card_id).then(response => {
      if (response) {
        Project.findByIdAndUpdate(project_id, { $pull: { cards: card_id } }, { new: true })
          .then(data => {
            if (data?.cards.find(item => item == card_id)) {
              res.status(400).send({ error: "cannot delete card from project " + project_id })
            } else {
              cache.flushAll();
              res.status(201).send({ message: "card deleted from project" })
            }
          })
      } else {
        res.status(400).send({ error: "the card could not be found, it may have been deleted, refresh the page and try again" })
      }
    }).catch(err => {
      sendError(res, err)
    })

  } catch (err) {
    sendError(res, err)
  }
});

// add users to card

router.put('/:user/:project/:card/members', async (req, res) => {

  try {
    let userInfo = await User.findOne({ email: req.body.email })
      .catch(err => {
        sendError(res, err)
        return
      });

    if (!userInfo) {
      res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct we will send him an join link.` })
      return
    };
    const userExistsOnProject = await Project.find({ _id: req.params.project, "members": userInfo.id });

    const userExistsOnCard = await Card.find({ _id: req.params.card, "cardMembers": userInfo.id });

    const cardMembers = [];


    const projectMembers = [];

    if (userExistsOnProject.length) {
      if (userExistsOnCard.length) {
        res.status(200).send({ message: "user is already a member on this card" })
        return
      } else {
        Card.updateOne({ _id: req.params.card }, { $addToSet: { cardMembers: userInfo.id } })
          .then(data => {
            if (data) {
              cache.flushAll();
              res.status(200).send({ message: "user added to card" })
            }
          }).catch(err => {
            sendError(res, err)
          })
      }
    } else {
      console.log("user not on project")
      Project.updateOne({ _id: req.params.project }, { $addToSet: { members: userInfo.id } })
        .then(data => {
          if (data) {

          }
        }).catch(err => {
          sendError(res, err)
          return
        }).then(
          Card.updateOne({ _id: req.params.card }, { $addToSet: { cardMembers: userInfo.id } })
            .then(data => {
              if (data) {
                cache.flushAll();
                res.status(200).send({ message: "user added to card and project" })
              }
            }).catch(err => {
              sendError(res, err)
              return
            })
        )
    }
  } catch (err) {
    sendError(res, err)
  }

});

// remove member from card


router.put('/:user/:project/:card/members/remove', async (req, res) => {
  try {


    userInfo = await User.findOne({ email: req.body.email })
      .catch(err => {
        sendError(res, err)
      });


    if (!userInfo) {
      res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, the account might have been deleted` })
      return
    };
    const userExistsOnCard = await Card.find({ _id: req.params.card, "cardMembers": userInfo.id });

    if (userExistsOnCard.length) {
      Card.updateOne({ _id: req.params.card }, { $pull: { cardMembers: userInfo.id } })
        .then(data => {
          if (data) {
            cache.flushAll();
            res.status(200).send({ message: "user removed from card member list" })
          }
        }).catch(err => {
          sendError(res, err)
        })
    } else {
      res.status(400).send({ error: "user is not on the card members list" })
    }
  } catch (err) {
    sendError(res, err)
  }

})

const setUsedHoursOnProject = async (card, projectId) => {
  if (card) {
    const project = await Project.findById(projectId);
    const cards = project.cards
    let allUsedHours = 0;
    cards.forEach((item) => {
      allUsedHours += item.cardUsedHours
    })
    allUsedHours.toFixed(2)
    project.timeSchedule.usedHours = allUsedHours
    Project.findByIdAndUpdate(projectId, project, { new: true }).then(data => {
    })
  }
}

const sendError = (res, err) => {
  return res.status(500).send({ error: "there was an error " + err.message })
}

module.exports = router;