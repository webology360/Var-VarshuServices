const express = require("express");
const { check } = require("express-validator");
const {
  login,
  signUp,
  updateAdmin,
  profile,
  changePassword,
  resetPassword,
  forgotPassword,
} = require("../controllers/adminController");
const auth = require("../middlewares/auth");
let router = express.Router();

//<---------------auth----------------->
//get user info
router.get("/profile", auth, profile);
//login user
router.post(
  "/login",
  [
    check("userId", "Please enter your user id/mobile number properly")
      .not()
      .isEmpty(),
    check("password", "Please enter your password properly").not().isEmpty(),
  ],
  login
);
//forgot password
router.post("/forgotPassword/:adminId", forgotPassword);
//reset password
router.put(
  "/resetPassword/:userId",
  [
    check(
      "newPassword",
      "Please enter a password at least 8 character and max 18 character and contain At least one uppercase, one lowercase, one special character and one number."
    )
      .matches(
        /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!"#\$%&'\(\)\*\+,-\.\/:;<=>\?@[\]\^_`\{\|}~])[a-zA-Z0-9!"#\$%&'\(\)\*\+,-\.\/:;<=>\?@[\]\^_`\{\|}~]{8,16}$/,
        "i"
      )
      .not()
      .isEmpty(),
  ],
  resetPassword
);
//change password
router.put(
  "/changePassword",
  [
    check("oldPassword", "Please enter your old password").not().isEmpty(),
    check(
      "newPassword",
      "Please enter a password at least 8 character and max 18 character and contain At least one uppercase, one lowercase, one special character and one number."
    )
      .matches(
        /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!"#\$%&'\(\)\*\+,-\.\/:;<=>\?@[\]\^_`\{\|}~])[a-zA-Z0-9!"#\$%&'\(\)\*\+,-\.\/:;<=>\?@[\]\^_`\{\|}~]{8,16}$/,
        "i"
      )
      .not()
      .isEmpty(),
  ],
  auth,
  changePassword
);
//signup user
router.post(
  "/signup",
  [
    check("userId", "Please enter your user id properly").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("mobileNumber").not().isEmpty(),
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check(
      "password",
      "Please enter a password at least 8 character and max 18 character and contain At least one uppercase, one lowercase, one special character and one number."
    )
      .matches(
        /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!"#\$%&'\(\)\*\+,-\.\/:;<=>\?@[\]\^_`\{\|}~])[a-zA-Z0-9!"#\$%&'\(\)\*\+,-\.\/:;<=>\?@[\]\^_`\{\|}~]{8,16}$/,
        "i"
      )
      .not()
      .isEmpty(),
  ],
  auth,
  signUp
);
//signup user
router.post(
  "/updateAdmin/:adminId",
  [
    check("userId", "Please enter your user id properly").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("mobileNumber").not().isEmpty(),
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
  ],
  auth,
  updateAdmin
);

module.exports = router;
