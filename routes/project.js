const router = require('express').Router();
const Card = require('../models/card');
const Task = require('../models/task')
const Project = require('../models/project');
const User = require('../models/user');
const cache = require('../cache/cache');
const project = require('../models/project');



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

router.get('/:user/all', async (req, res) => {
  const userId = req.params.user

  const getAllProjectsWhereUserIsMember = async (userId) => {
    return await Project.find({ "members": userId })
  }

  const setResponsePayload = (data) => {
    let projects = data
    projects = data.map((item) => {
      return {
        name: item.name,
        id: item._id,
        description: item.description,
        dueDate: item.timeSchedule.dueDate || "",
        availableHours: (item.timeSchedule.allocatedHours - item.timeSchedule.usedHours).toFixed(2) || 0,
        usedHours: item.timeSchedule.usedHours
      }
    })
    return projects
  }

  try {
    const responseData = await getAllProjectsWhereUserIsMember(userId)
    const payload = responseData ? setResponsePayload(responseData) : false
    responseData ? sendResponse(res, 200, payload) : sendResponse(res, 400, { error: 'there are no result found' })
  } catch (err) {
    sendError(res, err)
  }

});


//get one project


router.get('/:project', async (req, res) => {

  const projectId = req.params.project

  const getOneProjectById = async (projectId) => {
    return await Project.findById(projectId)
  }

  try {
    const response = await getOneProjectById(projectId)
      .catch(err => {
        sendError(res, err)
      })
    response ? sendResponse(res, 200, response) : sendResponse(res, 200, { message: "The search found no result, the project might have been deleted, make sure the project id " + projectId + " is correct" })

  } catch (err) {
    sendError(res, err)
  }
})


//get project where user is owner

router.get('/:user/owned', async (req, res) => {
  const userId = req.params.user

  const getAllProjectsWhereUserIsOwner = async (userId) => {
    return await Project.find({ "owner": userId })
  }

  try {
    const response = await getAllProjectsWhereUserIsOwner(userId)
      .catch(err => {
        sendError(res, err)
      })
    response ? sendResponse(res, 200, response) : sendResponse(res, 400, { error: "there are no result found" })
  } catch (err) {
    sendError(res, err)
  }

});


//add stage

router.put('/:project/add-stage', async (req, res) => {

  const projectId = req.params.project
  const stageName = req.body.name

  const setNewStageOnProject = async (projectId, stageName) => {
    return await Project.findByIdAndUpdate(projectId, { $addToSet: { stages: stageName } }, { new: true, upsert: true })
  }

  try {

    const response = await setNewStageOnProject(projectId, stageName)
      .catch(err => {
        sendError(res, err)
      })
    response ? sendResponse(res, 201, response) : sendResponse(res, 400, { error: "something went wrong" })

  } catch (err) {
    sendError(res, err)
  }

})

//remove stage

router.put('/:project/remove-stage', async (req, res) => {
  const projectId = req.params.project
  const stageName = req.body.name

  const removeStageFromProject = async (projectId, stageName) => {
    return await Project.findByIdAndUpdate(projectId, { $pull: { stages: stageName } }, { new: true })
  }

  const performRemoveOperation = async (projectId, stageName) => {
    const response = await removeStageFromProject(projectId, stageName)
      .catch(err => {
        sendError(res, err)
      })
    response ? sendResponse(res, 201, response) : sendResponse(res, 400, { error: "something went wrong" })
  }

  const project = await Project.findById(projectId);
  const cards = await project?.cards;
  const cardsOnStage = await cards.find(el => el.stage == req.body.name);

  try {
    cardsOnStage ?
      sendResponse(res, 200, { error: "you have cards registers on this stage, remove them and then retry" }) :
      performRemoveOperation(projectId, stageName)

  } catch (err) {
    sendError(res, err)
  }

})

//update projects where user in member

router.put('/:user/:project', (req, res) => {
  const projectId = req.params.project;
  const payload = req.body;

  const updateProject = async (projectId, payload) => {
    return await Project.findByIdAndUpdate(projectId, payload)
  }

  try {
    const response = updateProject(projectId, payload)
      .catch(err => {
        sendError(res, err)
      })

    response ?
      sendResponse(res, 201, { message: "project updated successfully" }) :
      sendResponse(res, 400, { error: `cannot find the project with id ${projectId}` })

  } catch (err) {
    sendError(res, err)
  }
});

// add users to project

router.put('/:user/:project/members', async (req, res) => {

  const projectId = req.params.project;
  const email = req.body.email

  const getUserInfo = async (data) => {
    return await User.findOne({ email: data })
  }
  const userInfo = await getUserInfo(email).catch(err => {
    sendError(res, err)
    return
  });

  const userId = userInfo?._id ?? null

  const checkIfUserExistsOnProject = async (projectId, userId) => {
    return await Project.find({ _id: projectId, "members": userId });
  }

  const updateProject = async (projectId, userId) => {
    return await Project.updateOne({ _id: projectId }, { $addToSet: { members: userId } })
  }

  const userIsMember = !!userId
  const userExistsOnProject = userIsMember ? !! await checkIfUserExistsOnProject(projectId, userId).length : null


  const response = await updateProject(projectId, userId)
    .catch(err => {
      sendError(res, err)
    })

  const sendNewUserMessage = () => {
    response && !userIsMember ? sendResponse(res, 200, { message: `there is no user with ${email} email address in our database, if email is correct we will send him an join link.` }) : response ? sendResponse(res, 200, { message: 'user added to the team' }) : null
  }

  userExistsOnProject ? sendResponse(res, 200, { message: "user is already a member on this project" }) : sendNewUserMessage()

});

// remove member from project

router.put('/:user/:project/members/remove', async (req, res) => {

  const projectId = req.params.project;
  const email = req.body.email;

  const getUserInfo = async (data) => {
    return await User.findOne({ email: data })
  }
  const checkIfUserExistsOnProject = async (projectId, userId) => {
    return await Project.find({ _id: projectId, "members": userId });
  }

  const updateProject = async (projectId, userId) => {
    return await Project.findOneAndUpdate({ _id: projectId, "members": userId }, { $pull: { members: userId } }, { new: true })
  }

  const checkIfUserExistsOnCard = async (projectId, userId) => {
    const project = await checkIfUserExistsOnProject(projectId, userId);
    let userOnCards = false
    const cards = project[0].cards
    cards.map(item => {
      item?.cardMembers.map(member => {
        if (member._id.equals(userId)) {
          userOnCards = true
        }
      })
    })
    return userOnCards
  }

  try {
    const userInfo = await getUserInfo(email).catch(err => {
      sendError(res, err)
      return
    });

    const userId = userInfo?._id ?? null
    const userIsMember = !!userId
    const userExistsOnProject = userIsMember ? await checkIfUserExistsOnProject(projectId, userId) : null
    const userIsOwner = userExistsOnProject[0]?.owner === userId
    const userExistsOnCard = await checkIfUserExistsOnCard(projectId, userId)

    const response = userExistsOnProject && !userExistsOnCard ? updateProject(projectId, userId)
      .catch(err => {
        sendError(res, err)
      }) : null

    !userIsMember ? sendResponse(res, 200, { message: `there is no user with ${email} email address in our database, the account might have been deleted` }) :
      userIsOwner ? sendResponse(res, 200, { message: 'Project owner can not be deleted from member list' }) :
        userExistsOnCard ? sendResponse(res, 200, { message: 'User is assigned to card and can not be removed from project team' }) :
          response ? sendResponse(res, 201, { message: "user removed from the project" }) :
            sendResponse(res, 400, { error: 'something went wrong when removing user' })

  } catch (err) {
    sendError(res, err)
  }

})

//delete project


router.delete('/:project/delete', async (req, res) => {
  const projectId = req.params.project;

  const getProjectToBeDeleted = async (projectId) => {
    return await Project.findById(projectId)
  }
  const projectHasCards = (project) => {
    return !!project?.cards.length
  }
  const deleteTask = async (taskId) => {
    await Task.findByIdAndDelete(taskId)
  }

  const deleteCard = async (cardId) => {
    await Card.findByIdAndDelete(cardId)
  }
  const deleteProject = async (projectId) => {
    return await Project.findByIdAndDelete(projectId)
  }

  const deleteCardsAndTasks = (project) => {
    project.cards.map(async item => {
      item?.tasks.map(async task => {
        await deleteTask(task._id)
      })
      await deleteCard(item._id)
    })
  }

  try {
    let projectToBeDeleted = await getProjectToBeDeleted(projectId).catch(err => {
      sendError(res, err)
    })

    projectHasCards ? deleteCardsAndTasks(projectToBeDeleted) : null

    const response = deleteProject(projectId).catch(err => {
      sendError(res, err)
    })

    response ? sendResponse(res, 201, { message: "project deleted" }) : sendResponse(res, 400, { error: "the project could not be found, it may have been deleted, refresh the page and try again" })

  } catch (err) {
    sendError(res, err)
  }

})

const sendError = (res, err) => {
  return res.status(500).send({ error: "there was an error " + err.message })
}

const sendResponse = (res, code, payload) => {
  res.status(code).send(payload);
  return
}


module.exports = router;