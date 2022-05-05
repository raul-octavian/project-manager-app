const Joi = require('joi');
const jwt = require('jsonwebtoken');

const registerValidation = (data) => {
  const schema = Joi.object(
    {
      name: Joi.string().max(255).required(),
      email: Joi.string().min(6).max(255).required(),
      password: Joi.string().min(10).max(255).required(),
      username: Joi.string()
    }
  );
  return schema.validate(data);
}


const updateValidation = (data) => {
  const schema = Joi.object(
    {
      name: Joi.string().max(255),
      email: Joi.string().min(6).max(255),
      username: Joi.string()
    }
  );
  return schema.validate(data);
}

const loginValidation = (data) => {
  const schema = Joi.object(
    {
      email: Joi.string().min(6).max(255).required(),
      password: Joi.string().min(10).max(255).required(),
    }
  );
  return schema.validate(data);
}

//logic to verify our token

const verifyToken = (req, res, next) => {
  const token = req.header('auth-token');

  if (!token) {
    return res.status(401).json({ error: "access denied" });
  }
  try {
    const verified = jwt.verify(token, process.env.SECRET)
    req.user = verified;
    next();

  } catch (error) {
    res.status(400).json({
      error: "token is not valid"
    })
  }
}



module.exports = { registerValidation, loginValidation, updateValidation, verifyToken }