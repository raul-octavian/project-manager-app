const router = require('express').Router();
const { resetWatchers } = require('nodemon/lib/monitor/watch');
const project = require('../models/project');
const user = require('../models/user');
const { route } = require('./user');


//create project

router.post('/:user/create', (req, res) => {
  data = req.body;

  project.insertMany(data)
    .then(data => {
      res.status(200).send(data);
    }).catch(err => {
      res.status(500).send({ message: err.message })
    })
});

//get all project where user is member

router.get('/:user/all', (req, res) => {
  project.find({ "members.userID": req.params.user })
    .then(data => {
      if (data) {
        res.status(200).send(data);
      } else {
        res.status(400).send({ message: "there are no result found" })
      }
    }).catch(err => {
      res.status(500).send({ message: err.message })
    })
});

//get project where user is owner

router.get('/:user/owned', (req, res) => {
  project.find({ "owner": req.params.user })
    .then(data => {
      if (data) {
        res.status(200).send(data);
      } else {
        res.status(400).send({ message: "there are no result found" })
      }
    }).catch(err => {
      res.status(500).send({ message: err.message })
    })
});

//update projects where user in member

router.put('/:user/:id', (req, res) => {
  id = req.params.id;

  project.findByIdAndUpdate(id, req.body)
    .then(data => {
      if (!data) {
        res.status(400).send({ message: `cannot find the project with id ${id}` })
      } else {
        res.status(201).send({ message: "project updated successfully" })
      }
    }).catch(err => {
      res.status(500).send({ message: `error updating project with id ${id},  ${err.message}` })
    })
});

// add users to project

router.put('/:user/:id/members', async (req, res) => {

  userInfo = await user.findOne({ email: req.body.email })
    .catch(err => {
      res.status(500).send({ message: `there was an error adding user ${err.message}` })
    });

  if (!userInfo) {
    res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct click Continue and we will send him an join link.` })
  };
  userExistsOnProject = await project.find({ _id: req.params.id, "members.userID": userInfo.id });

  if (userExistsOnProject.length) {
    res.status(200).send({ message: "user is already a member on this project" })
  } else {
    project.updateOne({ _id: req.params.id }, { $addToSet: { members: [{ "userID": userInfo.id }] } })
      .then(data => {
        if (data) {
          res.status(200).send({ message: userInfo._id })
        }
      }).catch(err => {
        res.status(500).send({ message: `there was an error adding user ${err.message}` })
      })
  }
});

// remove member from project

router.put('/:user/:id/members/remove', async (req, res) => {

  userInfo = await user.findOne({ email: req.body.email });

  if (!userInfo) {
    res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, the account might have been deleted` })
  };
  userExistsOnProject = await project.find({ _id: req.params.id, "members.userID": userInfo.id });
  if (userExistsOnProject.length) {
    project.findOneAndUpdate({ _id: req.params.id, "members.userID": userInfo.id }, { $pull: { members: { userID: userInfo.id } } }, { new: true })
      .then(project =>
        res.status(201).send(project))
      .catch(err => {
        res.status(500).send({ message: `there was an error removing user ${err.message}` })
    })
  }
})

//delete project








module.exports = router;