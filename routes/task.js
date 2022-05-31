const router = require('express').Router();
const Project = require("../models/project");
const Card = require("../models/card");
const User = require('../models/user');
const Task = require('../models/task');
const { verifyToken } = require('../validate');
const { response } = require('express');
const cache = require('../cache/cache')


//create task and add it to card


router.post('/:user/:project/:card/create-task', async (req, res) => {
  const userId = req.params.user;
  const cardId = req.params.card;
  const projectId = req.params.project;
  const payload = req.body

  const createNewTask = async (payload) => {
    return await Task.insertMany(payload)
  }

  const addTaskIdToCard = async (cardId, taskResponse) => {
    const id = taskResponse[0].toObject()._id
    return await Card.updateOne({ _id: cardId }, { $push: { tasks: `${id}` } }, { new: true })
  }

  try {
    const taskResponse = await createNewTask(payload).catch(err => {
      sendError(res, err)
    })

    const cardResponse = taskResponse ?
      await addTaskIdToCard(cardId, taskResponse) : null

    cardResponse ?
      sendResponse(res, 200, taskResponse) :
      sendResponse(res, 400, { error: "there was an error retrieving card information or creating the task" })
  } catch (err) {
    sendError(res, err)
  }
})

//update task

router.put('/tasks/:task/update', async (req, res) => {
  const taskId = req.params.task;
  const payload = req.body

  const updateTask = async (taskId, payload) => {
    return await Task.findByIdAndUpdate(taskId, payload)
  }

  try {
    const response = await updateTask(taskId, payload)
      .catch(err => {
        sendError(res, err)
      })

    response ? sendResponse(res, 201, { message: "task updated successfully" }) : sendResponse(res, 400, { error: `cannot find the task with id ${taskId}` })

  } catch (err) {
    sendError(res, err)
  }

})



//get one task info

router.get('/tasks/:task', async (req, res) => {

  const taskId = req.params.task;

  const getOneTaskById = async (taskId) => {
    return await Task.findById(taskId)
  }

  try {
    const response = await getOneTaskById(taskId)
      .catch(err => {
        sendError(res, err)
      })
    response ? sendResponse(res, 200, response) : sendResponse(res, 200, { message: `cannot find the task with id ${taskId}, it might have been deleted` })

  } catch (err) {
    sendError(res, err)
  }
})



//delete task

router.delete('/tasks/:card/:task/delete', async (req, res) => {
  const cardId = req.params.card;
  const taskId = req.params.task;

  const deleteTask = async (taskId) => {
    return await Task.findByIdAndRemove(taskId)
  }

  const removeTaskIdFromCard = async (cardId, taskId) => {
    return await Card.findByIdAndUpdate(cardId, { $pull: { tasks: taskId } }, { new: true })
  }

  try {
    const taskDeleted = await deleteTask(taskId)

    const cardResponse = taskDeleted ?
      removeTaskIdFromCard(cardId, taskId) :
      sendResponse(res, 400, { error: "the task not be found, it may have been deleted, refresh the page and try again" })

    cardResponse ?
      sendResponse(res, 201, { message: "task deleted" }) :
      sendResponse(res, 400, { error: "cannot update card " + cardId })

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