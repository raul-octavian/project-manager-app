const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('../models/user');
const { registerValidation, loginValidation, updateValidation, verifyToken } = require('../validate');


//register user
router.post('/register', async (req, res) => {


  //validate user inputs
  const { error } = registerValidation(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  //email exists

  const emailExists = await user.findOne({ email: req.body.email });

  if (emailExists) {
    return res.status(400).json({ error: "email exists, please login" })
  }

  //hash password
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(req.body.password, salt);


  //create user object
  const userObj = new user({
    name: req.body.name,
    email: req.body.email,
    password
  });

  try {
    const savedUser = await userObj.save();
    res.status(201).json({ error: null, data: savedUser._id })

  } catch (err) {
    res.status(400).json({ err })
  }

});

router.post('/login', async (req, res) => {

  //validate

  const { error } = loginValidation(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  //find user

  const foundUser = await user.findOne({ email: req.body.email });

  if (!foundUser) {
    return res.status(400).json({ error: "email is wrong" })
  } else {
    console.log("user logged in")
  }

  //check for password

  const validPass = await bcrypt.compare(req.body.password, foundUser.password);

  if (!validPass) {
    return res.status(400).json({ error: "password is wrong" })
  }

  //create auth token 

  const token = jwt.sign(
    //payload
    {
      name: foundUser.name,
      id: foundUser._id
    },

    //TOKEN_SECRET
    process.env.SECRET,

    //EXPIRATION
    { expiresIn: process.env.TOKEN_LIFE },
  );
  //attach auth to header

  res.header("auth-token", token).json({

    error: null,
    data: { user_id: foundUser._id, token }
  });

})

//get user information

router.get('/:user', verifyToken, (req, res) => {
  user.findById(req.params.user)
    .then(data => {
      if (!data) {
        res.status(200).send({message: "there are no results, please login to see your information"})
      } else {
        res.status(200).send(data);
      }
  })
})

//update user

router.put("/:user/update", verifyToken, async (req, res) => {
  
  const { error } = await updateValidation(req.body);

  if (error) {
    console.log(error);
    return res.status(400).json({ error: error.details[0].message })
  }

  user.findByIdAndUpdate(req.params.user, req.body)
    .then(data => {
      if (!data) {
        res.status(400).send({ message: "cannot find user with id " + id })
      } else {
        res.status(201).send(data)
      }
    })
    .catch(err => {
      res.status(500).send({ message: "error updating the toto with id: " + id })
    })
})

module.exports = router;