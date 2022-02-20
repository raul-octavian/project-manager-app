// const router = require('express').Router();
// const Card = require('../models/card');
// const project = require('../models/project');
// const Project = require('../models/project');
// const Stage = require('../models/stage')



// router.post('/:project/stage', async (req, res) => {
//   let stageExists = {};
//   try {

//     stages = await Stage.find()
//     stageExists = await stages.find(el => el.name == req.body.name)
    
//     console.log("stage", stageExists);

//     if (!stageExists) {
//       console.log("if triggered")
//       Stage.insertMany(req.body)
//         .then(data => {
//           if (data) {
//             const id = data[0].id;
//             Project.updateOne({ _id: req.params.project }, { $push: { stages: `${id}` } }, { new: true })
//               .then(project_data => {
//                 if (project_data) {
//                   res.status(200).send(data)
//                 } else {
//                   res.status(400).send({ message: "there was an error retrieving project information or creating the stage" })
//                 }
//               })
//           } else {
//             res.status(400).send({ message: "there was an error creating project stage" })
//           }
//         }).catch(err => {
//           res.status(500).send({ message: `there was an error creating card ${err.message}` })
//         })
      
//     } else {
//       console.log("else triggered")
//       const id = stageExists._id;
//       console.log(stageExists);
//       Project.updateOne({ _id: req.params.project }, { $addToSet: { stages: `${id}` } }, { new: true })
//         .then(project_data => {
//           if (project_data) {
//             if (project_data.modifiedCount > 0) {
//               res.status(200).send(`inserted ${project_date.modifiedCount} new elements`)
//             } else {
//               res.status(200).send(`element with the same id already exist on the project`)
//             }
//           } else {
//             res.status(400).send({ message: "there was an error retrieving project information or creating the stage" })
//           }
//         })
//     }
//   } catch (err) {
//     res.status(500).send({ message: `there was an error creating card ${err.message}` })
//   }

// })

// module.exports = router;
