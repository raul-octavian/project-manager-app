const router = require('express').Router();
const Card = require('../models/card');
const Task = require('../models/task')
const Project = require('../models/project');
const User = require('../models/user');
const cache = require('../cache/cache')



//create project

router.post('/:user/create', (req, res) => {
  data = req.body;

  Project.insertMany(data)
    .then(data => {
      cache.flushAll();
      res.status(200).send(data);
    }).catch(err => {
      sendError(res, err)
    })
});

//get all project where user is member

router.get('/:user/all', (req, res) => {

  try {
    let simpleProjectsCache = cache.get('simpleProjects');

    if (!simpleProjectsCache) {
      Project.find({ "members": req.params.user })
        .then(data => {
          if (data) {
            projectNames = data.map((item) => {

              return {
                name: item.name,
                id: item._id,
                description: item.description,
                dueDate: item.timeSchedule.dueDate || "",
                availableHours: (item.timeSchedule.allocatedHours - item.timeSchedule.usedHours).toFixed(2) || 0,
                usedHours: item.timeSchedule.usedHours
              }
            })
            cache.set('simpleProjects', projectNames);
            res.status(200).send(projectNames);
          } else {
            res.status(400).send({ error: "there are no result found" })
          }
        }).catch(err => {
          sendError(res, err)
        })

    } else {
      res.status(200).send(simpleProjectsCache);
    }

  } catch (err) {
    sendError(res, err)
  }

});


//get one project


router.get('/:project', (req, res) => {


  Project.findById(req.params.project)
    .then(data => {
      if (data) {
        res.status(200).send(data);
      } else {
        res.status(200).send({ message: "The search found no result, the project might have been deleted, make sure the project id " + req.params.project + " is correct" })
      }
    }).catch(err => {
      sendError(res, err)
    })
})
//get project where user is owner

router.get('/:user/owned', (req, res) => {

  try {
    let ownedProjectCache = cache.get('ownedProject')

    if (!ownedProjectCache) {
      Project.find({ "owner": req.params.user })
        .then(data => {
          if (data) {
            cache.set('ownedProjects', data)
            res.status(200).send(data);
          } else {
            res.status(400).send({ error: "there are no result found" })
          }
        }).catch(err => {
          sendError(res, err)
        })
    }

  } catch (err) {
    sendError(res, err)
  }


});

//add stage

router.put('/:project/add-stage', (req, res) => {

  Project.findByIdAndUpdate(req.params.project, { $addToSet: { stages: req.body.name } }, { new: true, upsert: true })
    .then(data => {
      if (data) {
        cache.flushAll();
        res.status(201).send(data);
      } else {
        res.status(400).send({ error: "something went wrong" });
      }
    }).catch(err => {
      sendError(res, err)
    })
})

//remove stage

router.put('/:project/remove-stage', async (req, res) => {

  try {

    const project = await Project.findById(req.params.project);
    const cards = await project?.cards;
    const cardsOnStage = await cards.find(el => el.stage == req.body.name);


    if (cardsOnStage) {
      res.status(200).send({ error: "you have cards registers on this stage, remove them and then retry" })
      return

    } else {

      Project.findByIdAndUpdate(req.params.project, { $pull: { stages: req.body.name } }, { new: true })
        .then(data => {
          if (data) {
            cache.flushAll();
            res.status(201).send(data);
          } else {
            res.status(400).send({ error: "something went wrong" });
          }
        }).catch(err => {
          sendError(res, err)
        })
    }

  } catch (err) {
    sendError(res, err)
  }

})

//update projects where user in member

router.put('/:user/:project', (req, res) => {
  project_id = req.params.project;

  Project.findByIdAndUpdate(project_id, req.body)
    .then(data => {
      if (!data) {
        res.status(400).send({ error: `cannot find the project with id ${project_id}` })
      } else {
        cache.flushAll();
        res.status(201).send({ message: "project updated successfully" })
      }
    }).catch(err => {
      sendError(res, err)
    })
});

// add users to project

router.put('/:user/:project/members', async (req, res) => {

  userInfo = await User.findOne({ email: req.body.email })
    .catch(err => {
      sendError(res, err)
      return
    });

  if (!userInfo) {
    res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct we will send him an join link.` })
    return
  };
  userExistsOnProject = await Project.find({ _id: req.params.project, "members": userInfo.id });

  if (userExistsOnProject.length) {
    res.status(200).send({ message: "user is already a member on this project" })
  } else {
    Project.updateOne({ _id: req.params.project }, { $addToSet: { members: userInfo.id } })
      .then(data => {
        if (data && !userInfo) {
          res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, if email is correct we will send him an join link.` })
        } else if (data) {
          cache.flushAll();
          res.status(200).send({ message: 'user added to the team' })
        }
      }).catch(err => {
        sendError(res, err)
      })
  }
});

// remove member from project

router.put('/:user/:project/members/remove', async (req, res) => {

  const userInfo = await User.findOne({ email: req.body.email })
    .catch(err => {
      sendError(res, err)
    });

  if (!userInfo) {
    res.status(200).send({ message: `there is no user with ${req.body.email} email address in our database, the account might have been deleted` })
    return
  };
  const userExistsOnProject = await Project.find({ _id: req.params.project, "members": userInfo.id });

  if (userExistsOnProject[0].owner == userInfo.id) {
    res.status(200).send({ message: 'Project owner can not be deleted from member list' })
    return
  }

  const userExistsOnCard = await Card.find({ "cardMembers": userInfo.id });

  if (userExistsOnCard.length) {
    res.status(200).send({ message: 'User is assigned to card and can not be removed from project team' })
    return
  }

  if (userExistsOnProject.length) {
    Project.findOneAndUpdate({ _id: req.params.project, "members": userInfo.id }, { $pull: { members: userInfo.id } }, { new: true })
      .then(project => {
        cache.flushAll()
        res.status(201).send({ message: "user removed from the project" })
      })
      .catch(err => {
        sendError(res, err)
      })
  }
})

//delete project


router.delete('/:project/delete', async (req, res) => {
  const project_id = req.params.project;

  try {
    let foundCards = await Project.findById(req.params.project);
    let deletedTasks = []
    let deletedCards = []
    if (foundCards?.cards.length) {
      for (const el of foundCards.cards) {
        deletedTasks = await Card.findById(el).then(response => {
          if (response?.tasks.length) {
            for (const item of response.tasks) {
              Task.findByIdAndRemove(item)
            }
          }
        });
        deletedCards = await Card.findByIdAndDelete(el)
      }
    }

    Project.findByIdAndRemove(project_id).then(response => {
      if (response) {
        cache.flushAll()
        res.status(201).send({ message: "project deleted" })
      } else {
        res.status(400).send({ error: "the project could not be found, it may have been deleted, refresh the page and try again" })
      }
    }).catch(err => {
      sendError(res, err)
    })
  } catch (err) {
    sendError(res, err)
  }

})

const sendError = (res, err) => {
  return res.status(500).send({ error: "there was an error " + err.message })
}


module.exports = router;