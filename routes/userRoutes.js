const express = require("express");
const multer = require("multer");
const { check } = require("express-validator");
const {
  getUsers,
  getTopProfiles,
  toggleUserStatus,
  getUser,
  addUser,
  uploadImages,
  updateUser,
  deleteUser,
  uploadBioData,
} = require("../controllers/userController");
const auth = require("../middlewares/auth");

let router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// getAll users by gender/type
router.get("/list/:genderType", getUsers);

// getAll users by view count by gender/type
router.get("/topProfiles/:genderType", auth, getTopProfiles);

// toggle user status
router.put("/toggleStatus/:userId", auth, toggleUserStatus);

// get user by id and update user view count
router.get("/getUser/:userId", getUser);

// delete user
router.delete("/delete/:userId", auth, deleteUser);

//add user
router.post(
  "/add",
  auth,
  [
    check("firstName").not().isEmpty(),
    check("middleName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("dateOfBirth").not().isEmpty(),
    check("occupation").not().isEmpty(),
    check("education").not().isEmpty(),
    check("preferredPartnerChoice").not().isEmpty(),
    check("gender").not().isEmpty().isInt(),
    check("height").not().isEmpty(),
    check("age").not().isEmpty().isInt({ min: 18 }),
    check("bodyComplexion").not().isEmpty(),
    check("motherTounge").not().isEmpty(),
    check("familyMembersAndRelations").not().isEmpty(),
    check("zodiacSign").not().isEmpty(),
    check("presentAddress").not().isEmpty(),
    check("permanentAddress").not().isEmpty(),
    // check("bioData").not().isEmpty(),
    check("remarks").not().isEmpty(),
    // check("imgList").not().isEmpty(),
    check("annualIncome").not().isEmpty(),
  ],
  addUser
);

//update user images
router.put(
  "/upload/images/:userId",
  auth,
  upload.array("images", 5),
  uploadImages
);
//update user bio data
router.put(
  "/upload/bioData/:userId",
  auth,
  upload.single("bioData"),
  uploadBioData
);
//update user
router.put(
  "/update/:userId",
  auth,
  [
    check("firstName").not().isEmpty(),
    check("middleName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("dateOfBirth").not().isEmpty(),
    check("occupation").not().isEmpty(),
    check("education").not().isEmpty(),
    check("preferredPartnerChoice").not().isEmpty(),
    check("gender").not().isEmpty().isInt(),
    check("height").not().isEmpty(),
    check("age").not().isEmpty().isInt({ min: 18 }),
    check("bodyComplexion").not().isEmpty(),
    check("motherTounge").not().isEmpty(),
    check("familyMembersAndRelations").not().isEmpty(),
    check("zodiacSign").not().isEmpty(),
    check("presentAddress").not().isEmpty(),
    check("permanentAddress").not().isEmpty(),
    // check("bioData").not().isEmpty(),
    check("remarks").not().isEmpty(),
    // check("imgList").not().isEmpty(),
    check("annualIncome").not().isEmpty(),
  ],
  updateUser
);
module.exports = router;
