const router = require('express').Router();
const { resetWatchers } = require('nodemon/lib/monitor/watch');
const card = require('../models/card');
const task = require('../models/task')
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
    // .populate({
    //   path: 'cards',
    //   populate: {
    //     path: 'tasks',
    //     populate: {
    //       path: 'task_members'
    //     }
    //   }
    // })
    .populate('cards')
    .populate('card.card_members')
    .populate('cards.tasks')
    .populate('cards.tasks.task_members')
    .populate('members')
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


//get one project


router.get('/:project', (req, res) => {
  project.findById(req.params.project)
    .populate('cards')
    .populate('card.card_members')
    .populate('cards.tasks')
    .populate('cards.tasks.task_members')
    .populate('members')
    .then(data => {
      if (data) {
        res.status(200).send(data);
      } else {
        res.status(200).send({message : "The search found no result, the project might have been deleted, make sure the project id "+ req.params.project + " is correct"})
      }
    }).catch(err => {
      res.status(500).send({ message: `there was an error ${err.message}` });
    })
})
//get project where user is owner

router.get('/:user/owned', (req, res) => {
  project.find({ "owner": req.params.user })
    .populate({
      path: 'cards',
      populate: {
        path: 'card_members',
      },
      populate: {
        path: 'tasks',
        populate: {
          path: 'task_members'
        }
      }
    })
    .populate('members')
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

router.put('/:user/:project/members', async (req, res) => {

  userInfo = await user.findOne({ email: req.body.email })
    .catch(err => {
      res.status(500).send({ message: `there was an error adding user ${err.message}` })
    });

  if (!userInfo) {
    res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct we will send him an join link.` })
  };
  userExistsOnProject = await project.find({ _id: req.params.project, "members": userInfo.id });

  if (userExistsOnProject.length) {
    res.status(200).send({ message: "user is already a member on this project" })
  } else {
    project.updateOne({ _id: req.params.project }, { $addToSet: { members: userInfo.id } })
      .then(data => {
        if (data) {
          res.status(200).send({ message: userInfo.id })
        }
      }).catch(err => {
        res.status(500).send({ message: `there was an error adding user ${err.message}` })
      })
  }
});

// remove member from project

router.put('/:user/:project/members/remove', async (req, res) => {

  userInfo = await user.findOne({ email: req.body.email })
    .catch(err => {
      res.status(500).send({ message: `there was an error finding user ${err.message}` })
    });

  if (!userInfo) {
    res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, the account might have been deleted` })
  };
  userExistsOnProject = await project.find({ _id: req.params.project, "members": userInfo.id });

  if (userExistsOnProject.length) {
    project.findOneAndUpdate({ _id: req.params.project, "members": userInfo.id }, { $pull: { members: userInfo.id } }, { new: true })
      .then(project =>
        res.status(201).send(project))
      .catch(err => {
        res.status(500).send({ message: `there was an error removing user ${err.message}` })
    })
  }
})

//delete project


router.delete('/:project/delete', async (req, res) => {
  const project_id = req.params.project;

  try {
    let foundCards = await project.findById(req.params.project);
    let deletedTasks = []
    let deletedCards = []
    if (foundCards?.cards.length) {
      for (const el of foundCards.cards) {
        deletedTasks = await card.findById(el).then(response => {
          if (response?.tasks.length) {
            for (const item of response.tasks) {
              task.findByIdAndRemove(item).then(
                console.log(`tasks deleted`, item)
              )
            }
          }
        });
        deletedCards = await card.findByIdAndDelete(el)
          .then(console.log("card deleted"))
      }
    }

    project.findByIdAndRemove(project_id).then(response => {
      if (response) {
        res.status(201).send({ message: "project deleted" })
      } else {
        res.status(400).send({ message: "the project could not be found, it may have been deleted, refresh the page and try again" })
      }
    }).catch(err => {
      res.status(500).send({ message: "error deleting the card with id: " + card_id + "error: " + err.message })
    })
  } catch (err) {
    res.status(500).send({message: "delete aborted " + err.message})
  }
  
})


module.exports = router;