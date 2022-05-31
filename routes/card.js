const router = require('express').Router();

const Project = require("../models/project");
const Card = require("../models/card");
const Task = require("../models/task")
const User = require('../models/user');
const cache = require('../cache/cache');
const { get } = require('express/lib/request');
const { ConnectionClosedEvent } = require('mongodb');



//create card

router.post('/:project/create-card', async (req, res) => {
  let cardIndex = 0;
  const projectId = req.params.project;

  const setPayload = (cardIndex) => {
    const payload = {
      cardName: req.body.cardName,
      stage: req.body.stage,
      index: cardIndex
    }
    return payload
  }

  const getCardCount = async () => {
    return await Card.count();
  }

  const createNewCard = async (payload) => {
    return await Card.insertMany(payload)
  }

  const updateProject = async (projectId, cardResponse) => {
    const id = cardResponse[0].toObject()._id
    return await Project.updateOne({ _id: projectId }, { $push: { cards: `${id}` } }, { new: true })
  }

  try {

    cardIndex = await getCardCount()
    const cardPayload = setPayload(cardIndex)
    const cardResponse = await createNewCard(cardPayload)
      .catch(err => {
        sendError(res, err)
      })

    const projectResponse = cardResponse ?
      updateProject(projectId, cardResponse)
        .catch(err => {
          sendError(res, err)
        }) :
      sendResponse(res, 400, { error: "there was an error creating the card" })

    projectResponse ?
      sendResponse(res, 200, cardResponse) :
      sendResponse(res, 400, { error: "there was an error retrieving project information or creating the card" })

  } catch (err) {
    sendError(res, err)

  }

})


//get one card

router.get('/cards/:card', async (req, res) => {

  const cardId = req.params.card

  const getOneCardById = async (cardId) => {
    return await Card.findOne({ "_id": cardId })
  }

  try {

    const cardResponse = await getOneCardById(cardId)
      .catch(err => {
        sendError(res, err)
      })

    cardResponse ?
      sendResponse(res, 200, cardResponse) :
      sendResponse(res, 200, { message: "search found no results, the card might have been deleted" })

  } catch (err) {
    sendError(res, err)
  }
})


//update

router.put('/:project/cards/:card/update', async (req, res) => {
  const cardId = req.params.card;
  const projectId = req.params.project
  const isCardModified = !!req?.body?.cardUsedHours
  const payload = req.body

  const updateCard = async (cardId, payload) => {
    return await Card.findByIdAndUpdate(cardId, payload, { new: true, upsert: true })
  }

  try {

    const response = await updateCard(cardId, payload)
      .catch(err => {
        sendError(res, err)
      })
    await setUsedHoursOnProject(isCardModified, projectId)
    response ?
      sendResponse(res, 201, response) :
      sendResponse(res, 400, { error: `cannot find the card with id ${cardId}` })

  } catch (err) {
    sendError(res, err)
  }
})

//set stage


router.put('/cards/:card/set-stage', async (req, res) => {
  const cardId = req.params.card;
  const payload = req.body

  const updateCard = async (cardId, payload) => {
    return await Card.findByIdAndUpdate(cardId, payload, { new: true })
  }

  try {
    const response = await updateCard(cardId, payload)
      .catch(err => {
        sendError(res, err)
      })

    response ?
      sendResponse(res, 200, response) :
      sendResponse(res, 400, { error: `cannot find the card with id ${cardId}` })

  } catch (err) {
    sendError(res, err)
  }

})


//delete

router.delete('/cards/:project/:card/delete', async (req, res) => {
  const cardId = req.params.card;
  const projectId = req.params.project;
  const isCardModified = !!req.params.card;

  const getCardToBeDeleted = async (cardId) => {
    return await Card.findById(cardId)
  }

  const deleteTask = async (taskId) => {

    return await Task.findByIdAndDelete(taskId)
  }

  const deleteCard = async (cardId) => {
    return await Card.findByIdAndRemove(cardId)
  }

  const removeCardIdFromProject = async (projectId, cardId) => {
    return await Project.findByIdAndUpdate(projectId, { $pull: { cards: cardId } }, { new: true })
  }

  const sendSuccessMessageAndSetUsedHours = async (isCardModified, projectId) => {
    await setUsedHoursOnProject(isCardModified, projectId, res)
    sendResponse(res, 201, { message: "card deleted from project" })
  }

  try {

    let cardToBeDeleted = await getCardToBeDeleted(cardId);

    await cardToBeDeleted?.tasks.map(async task => {

      const deletedTask = await deleteTask(task._id)
    })

    const cardResponse = await deleteCard(cardId)
      .catch(err => {
        sendError(res, err)
      })

    const projectResponse = cardResponse ?
      await removeCardIdFromProject(projectId, cardId).catch(err => {
        sendError(res, err)
      }) :
      sendResponse(res, 400, { error: "the card could not be found, it may have been deleted, refresh the page and try again" })

    const cardDeletedFromProject = !projectResponse?.cards.find(card => card.toString() == cardId)

    cardDeletedFromProject ?
      await sendSuccessMessageAndSetUsedHours(isCardModified, projectId, res) :
      sendResponse(res, 400, { error: "cannot delete card from project " + projectId })

  } catch (err) {
    sendError(res, err)
  }
});

// add users to card

router.put('/:user/:project/:card/members', async (req, res) => {
  const cardId = req.params.card;
  const projectId = req.params.project;
  const email = req.body.email

  const getUserInfo = async (data) => {
    return await User.findOne({ email: data })
  }

  const checkIfUserExistsOnProject = async (projectId, userId) => {
    return await Project.find({ _id: projectId, "members": userId });
  }

  const checkIfUserExistsOnCard = async (cardId, userId) => {
    return await Card.find({ _id: cardId, "cardMembers": userId });
  }

  const addUserIdToCard = async (cardId, userId) => {
    return await Card.updateOne({ _id: cardId }, { $addToSet: { cardMembers: userId } })
  }

  const addUserIdToProject = async (projectId, userId) => {
    return await Project.updateOne({ _id: projectId }, { $addToSet: { members: userId } })
  }

  const updateCardAndSendResponse = async (cardId, userId) => {

    const cardResponse = await addUserIdToCard(cardId, userId)
      .catch(err => {
        sendError(res, err)
      })

    cardResponse ?
      sendResponse(res, 200, { message: "user added to card" }) :
      sendResponse(res, 400, { error: "user could not be added to card" })

  }

  const updateProjectAndCardAndSendResponse = async (res, projectId, cardId, userId) => {

    const projectResponse = await addUserIdToProject(projectId, userId)
      .catch(err => {
        sendError(res, err)
      })

    projectResponse ? await updateCardAndSendResponse(cardId, userId) : null
  }

  try {
    let userInfo = await getUserInfo(email)
      .catch(err => {
        sendError(res, err)
        return
      });

    const userId = userInfo?._id ?? null

    !userInfo ? sendResponse(res, 200, { message: `there is no user with ${email} email address in our database, if email is correct we will send him an join link.` }) : null

    const userExistsOnProject = userInfo ? !!(await checkIfUserExistsOnProject(projectId, userId)).length : null

    const userExistsOnCard = userInfo ? !!(await checkIfUserExistsOnCard(cardId, userId)).length : null

    userExistsOnProject && userInfo && userExistsOnCard ?
      sendResponse(res, 200, { message: "user is already a member on this card" }) :
      userInfo && userExistsOnProject && !userExistsOnCard ?
        await updateCardAndSendResponse(cardId, userId) :
        userInfo && !userExistsOnProject && !userExistsOnCard ?
          await updateProjectAndCardAndSendResponse(res, projectId, cardId, userId) : null

  } catch (err) {
    sendError(res, err)
  }

});

// remove member from card

router.put('/:user/:project/:card/members/remove', async (req, res) => {

  const userId = req.params.user;
  const cardId = req.params.card;
  const projectId = req.params.project;
  const email = req.body.email

  const getUserInfo = async (data) => {
    return await User.findOne({ email: data })
  }

  const checkIfUserExistsOnCard = async (cardId, userId) => {
    return await Card.find({ _id: cardId, "cardMembers": userId });
  }

  const removeUserFromCard = async (cardId, userId) => {
    return await Card.updateOne({ _id: cardId }, { $pull: { cardMembers: userId } })
  }


  try {
    const userInfo = await getUserInfo(email)
      .catch(err => {
        sendError(res, err)
      });

    const userId = userInfo?._id ?? null

    userId ? sendResponse(res, 200, { message: `there is no user with ${email} email address in our database, the account might have been deleted` }) : null

    const userExistsOnCard = userInfo ? !!(await checkIfUserExistsOnCard(cardId, userId)).length : null

    const response = userExistsOnCard ? removeUserFromCard(cardId, userId)
      .catch(err => {
        sendError(res, err)
      }) :
      sendResponse(res, 400, { error: "user is not on the card members list" })

    response ? sendResponse(res, 200, { message: "user removed from card member list" }) :
      sendResponse(res, 400, { error: "user is not on the card members list" })

  } catch (err) {
    sendError(res, err)
  }

})

const setUsedHoursOnProject = async (isCardModified, projectId) => {
  if (isCardModified) {
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

const sendResponse = (res, code, payload) => {
  res.status(code).send(payload);
  return
}


module.exports = router;