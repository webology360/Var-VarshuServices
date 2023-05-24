const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  state: { type: String, required: true },
  location: { type: String, required: true },
  area: { type: String, required: true },
  pincode: { type: Number, required: true },
});
const familyMembersAndRelationsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String, required: true },
});

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    occupation: { type: String, required: true },
    education: { type: String, required: true },
    preferredPartnerChoice: { type: String, required: true },
    gender: { type: Number, required: true },
    height: { type: Number, required: true },
    age: { type: Number, required: true },
    bodyComplexion: { type: String, required: true },
    motherTounge: { type: String, required: true },
    familyMembersAndRelations: [familyMembersAndRelationsSchema],
    zodiacSign: { type: String, required: true },
    presentAddress: { type: addressSchema, required: true },
    permanentAddress: { type: addressSchema, required: true },
    bioData: { type: String },
    remarks: { type: String, required: true },
    imgList: { type: Array },
    annualIncome: { type: Number, required: true },
    status: { type: Number, default: 1 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
