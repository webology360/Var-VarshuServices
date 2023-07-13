const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const HttpError = require("./middlewares/httpError");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const messageTypes = require("./utils/messageTypes");

dotenv.config();
const PORT = process.env.PORT;
const URI = process.env.URI;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.use((req, res) => {
  throw new HttpError("could not find this route", 404);
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    console.log(res.headerSent);
    return next(error);
  }
  res.status(error.status || 500);
  res.json({
    messageType: messageTypes.FAIL,
    message: error.message,
    status: error.status || "An unknown error occured",
  });
});

mongoose
  .connect(URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Started on port ${PORT}, and database connected`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
