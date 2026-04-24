const jwt = require("jsonwebtoken");

const env = require("../config/env");

function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      error: "Authentication required."
    });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired auth token."
    });
  }
}

module.exports = {
  requireAuth
};
