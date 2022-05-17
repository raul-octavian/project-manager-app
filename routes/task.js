const router = require('express').Router();
const Project = require("../models/project");
const Card = require("../models/card");
const User = require('../models/user');
const Task = require('../models/task');
const { verifyToken } = require('../validate');
const { response } = require('express');
const cache = require('../cache/cache')


//create task and add it to card


router.post('/:user/:project/:card/create-task', (req, res) => {
  Task.insertMany(req.body)
    .then(
      data => {
        if (data) {
          const id = data[0].toObject()._id
          Card.updateOne({ _id: req.params.card }, { $push: { tasks: `${id}` } }, { new: true })
            .then(card_data => {
              if (card_data) {
                cache.flushAll();
                res.status(200).send(data)
              } else {
                res.status(400).send({ error: "there was an error retrieving card information or creating the task" })
              }
            })
        }
      }).catch(err => {
        sendError(res, err)
      })
})

//update task

router.put('/tasks/:task/update', (req, res) => {
  const task_id = req.params.task;

  Task.findByIdAndUpdate(task_id, req.body)
    .then(data => {
      if (!data) {
        res.status(400).send({ error: `cannot find the task with id ${task_id}` })
      } else {
        cache.flushAll();
        res.status(201).send({ message: "task updated successfully" })
      }
    }).catch(err => {
      sendError(res, err)
    })
})



//get one task info

router.get('/tasks/:task', (req, res) => {
  Task.findById(req.params.task)
    .then(data => {
      if (!data) {
        res.status(200).send({ message: `cannot find the task with id ${req.params.task}, it might have been deleted` })
      } else {
        cache.flushAll();
        res.status(200).send(data)
      }
    }).catch(err => {
      sendError(res, err)
    })
})



//delete task

router.delete('/tasks/:card/:task/delete', (req, res) => {
  const card_id = req.params.card;
  const task_id = req.params.task;


  Task.findByIdAndRemove(task_id).then(response => {

    if (response) {
      Card.findByIdAndUpdate(card_id, { $pull: { tasks: task_id } }, { new: true })
        .then(data => {
          if (data?.tasks.find(item => item == task_id)) {
            res.status(400).send({ error: "cannot update card " + card_id })
          } else {
            cache.flushAll();
            res.status(201).send({ message: "task deleted" })
          }
        })
    } else {
      res.status(400).send({ error: "the task not be found, it may have been deleted, refresh the page and try again" })
    }
  }).catch(err => {
    sendError(res, err)
  })
})

// add users to task

// not in use anymore after the task module was simplified

router.put('/:user/:project/:card/:task/members', async (req, res) => {

  try {

    userInfo = await User.findOne({ email: req.body.email })
      .catch(err => {
        sendError(res, err)
      });

    if (!userInfo) {
      res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct we will send him an join link.` })
    };
    const userExistsOnProject = await Project.find({ _id: req.params.project, "members": userInfo.id });

    const userExistsOnTask = await Task.find({ _id: req.params.task, "taskMembers": userInfo.id });

    const taskMembers = [];

    const projectMembers = [];

    if (userExistsOnProject.length) {
      if (userExistsOnTask.length) {
        cardMembers = res.status(200).send({ message: "user is already a member on this task" })
      } else {
        Task.updateOne({ _id: req.params.task }, { $addToSet: { taskMembers: userInfo.id } })
          .then(data => {
            if (data) {
              res.status(200).send({ message: "user added to task " + userInfo.name })
            }
          }).catch(err => {
            sendError(res, err)
          })
      }
    } else {
      Project.updateOne({ _id: req.params.project }, { $addToSet: { members: userInfo.id } })
        .then(data => {
          if (data) {
            console.log(userInfo.id)
          }
        }).catch(err => {
          sendError(res, err)
        }).then(
          Task.updateOne({ _id: req.params.task }, { $addToSet: { taskMembers: userInfo.id } })
            .then(data => {
              if (data) {
                res.status(200).send({ message: "user added to task and project" })
              }
            }).catch(err => {
              sendError(res, err)
            })
        )
    }
  } catch (err) {
    sendError(res, err)
  }


});

// remove user from task


router.put('/:user/:project/:card/:task/members/remove', async (req, res) => {

  try {


    userInfo = await User.findOne({ email: req.body.email })
      .catch(err => {
        sendError(res, err)
      });

    if (!userInfo) {
      res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, the account might have been deleted` })
    };
    const userExistsOnCard = await Task.find({ _id: req.params.task, "taskMembers": userInfo.id });

    if (userExistsOnCard.length) {
      Task.updateOne({ _id: req.params.task }, { $pull: { taskMembers: userInfo.id } })
        .then(data => {
          if (data) {
            res.status(200).send({ message: "user removed from task member list" })
          }
        }).catch(err => {
          sendError(res, err)
        })
    } else {
      res.status(400).send({ error: "user is not on the task members list" })
    }
  } catch (err) {
    sendError(res, err)
  }


})

const sendError = (res, err) => {
  return res.status(500).send({ error: "there was an error " + err.message })
}


module.exports = router;