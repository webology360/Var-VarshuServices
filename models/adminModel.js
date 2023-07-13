const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    resetPassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
