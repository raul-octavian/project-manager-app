const router = require('express').Router();
const Project = require("../models/project");
const Card = require("../models/card");
const User = require('../models/user');
const Task = require('../models/task');
const { verifyToken } = require('../validate');
const { response } = require('express');


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
                res.status(200).send(data)
              } else {
                res.status(400).send({ message: "there was an error retrieving card information or creating the task" })
              }
            })
        }
      }).catch(err => {
        res.status(500).send({ message: `there was an error creating task ${err.message}` })
      })
})

//update task

router.put('/tasks/:task/update', (req, res) => {
  const task_id = req.params.task;

  Task.findByIdAndUpdate(task_id, req.body)
    .then(data => {
      if (!data) {
        res.status(400).send({ message: `cannot find the task with id ${task_id}` })
      } else {
        res.status(201).send({ message: "task updated successfully" })
      }
    }).catch(err => {
      res.status(500).send({ message: `error updating task with id ${task_id},  ${err.message}` })
    })
})



//get one task info

router.get('/tasks/:task', (req, res) => {
  Task.findById(req.params.task)
    .then(data => {
      if (!data) {
        res.status(400).send({ message: `cannot find the task with id ${req.params.task}` })
      } else {
        res.status(200).send(data)
      }
    }).catch(err => {
      res.status(500).send({ message: `error finding task with id ${req.params.task},  ${err.message}` })
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
            res.status(400).send({ message: "cannot update card " + card_id })
          } else {
            res.status(201).send({ message: "task deleted" })
          }
        })
    } else {
      res.status(400).send({ message: "the task not be found, it may have been deleted, refresh the page and try again" })
    }
  }).catch(err => {
    res.status(500).send({ message: "error deleting the task with id: " + task_id + "error: " + err.message })
  })
})

// add users to task

router.put('/:user/:project/:card/:task/members', async (req, res) => {

  try {

    userInfo = await User.findOne({ email: req.body.email })
      .catch(err => {
        res.status(500).send({ message: `there was an error adding user ${err.message}` })
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
            res.status(500).send({ message: `there was an error adding user ${err.message}` })
          })
      }
    } else {
      Project.updateOne({ _id: req.params.project }, { $addToSet: { members: userInfo.id } })
        .then(data => {
          if (data) {
            console.log(userInfo.id)
          }
        }).catch(err => {
          res.status(500).send({ message: `there was an error adding user ${err.message}` })
        }).then(
          Task.updateOne({ _id: req.params.task }, { $addToSet: { taskMembers: userInfo.id } })
            .then(data => {
              if (data) {
                res.status(200).send({ message: "user added to task and project" })
              }
            }).catch(err => {
              res.status(500).send({ message: `there was an error adding user ${err.message}` })
            })
        )
    }
  } catch (err) {
    res.status(500).send({ message: "err.message" })
  }


});

// remove user from task


router.put('/:user/:project/:card/:task/members/remove', async (req, res) => {

  try {


    userInfo = await User.findOne({ email: req.body.email })
      .catch(err => {
        res.status(500).send({ message: `there was an error finding user ${err.message}` })
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
          res.status(500).send({ message: `there was an error removing user ${err.message}` })
        })
    } else {
      res.status(400).send({ message: "user is not on the task members list" })
    }
  } catch (err) {
    res.status(500).send({ message: "err.message" })
  }


})

module.exports = router;