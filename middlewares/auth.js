const jwt = require("jsonwebtoken");
const HttpError = require("./httpError");

const dotenv = require("dotenv");
dotenv.config();
const SECRET = process.env.SECRET;

module.exports = (req, res, next) => {
  try {
    const token = req.header("token");
    if (!token) {
      return next(new HttpError("Access Denied", 403));
    }
    const decodedToken = jwt.verify(token, SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return next(new HttpError("Invalid token", 400));
    // res.status(400).send("Invalid token");
  }
};
