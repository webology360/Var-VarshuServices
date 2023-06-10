const HttpError = require("../middlewares/httpError");
const { validationResult } = require("express-validator");
const Admin = require("../models/adminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");
const SECRET = process.env.SECRET;
const NODEMAILER_USERNAME = process.env.NODEMAILER_USERNAME;
const NODEMAILER_PASSWORD = process.env.NODEMAILER_PASSWORD;

const sgMail = require("@sendgrid/mail");
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

const login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array(), status: 422 });
  }
  try {
    const { userId, password } = req.body;
    const query = {
      $or: [{ userId: { $in: userId } }, { mobileNumber: { $in: userId } }],
    };

    Admin.findOne(query)
      // .select("-password")
      .then((user) => {
        if (!user) {
          return next(new HttpError("User not found!", 400));
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
          return next(new HttpError("Invalid Password!", 401));
        }

        const expirationSeconds = 60 * 60 * 24 * 7; // one week

        const token = jwt.sign({ userId: user.id }, SECRET, {
          expiresIn: expirationSeconds, // 24 hours
        });

        res.status(200).send({
          message: "Login Successful!",
          status: 200,
          token,
          resetPassword: user?.resetPassword,
        });
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError("unexpected error occurred while finding user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array(), status: 422 });
  }
  try {
    const { userId, mobileNumber, email, password, firstName, lastName } =
      req.body;

    const userCreate = new Admin({
      userId: userId,
      mobileNumber: mobileNumber,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: bcrypt.hashSync(password, 10),
    });

    //check username
    Admin.findOne({
      userId: userId,
    })
      .then((user) => {
        if (user) {
          return next(new HttpError("Failed! User id is already in use!", 400));
        }
        //Check Email
        Admin.findOne({
          mobileNumber: mobileNumber,
        })
          .then((user) => {
            if (user) {
              return next(
                new HttpError(
                  "Failed! Mobile number is already in use! try different mobilr number.",
                  400
                )
              );
            }
            userCreate
              .save()
              .then((user) => {
                res.status(201).send({
                  message: "User was successfully registered!",
                  status: 201,
                });
              })
              .catch((err) => {
                if (err) {
                  console.log(err);
                  return next(
                    new HttpError(
                      "unexpected error occurred while saving user data",
                      500
                    )
                  );
                }
              });
          })
          .catch((err) => {
            if (err) {
              return next(
                new HttpError(
                  "unexpected error occurred while finding mobile number",
                  500
                )
              );
            }
          });
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError(
              "unexpected error occurred while finding username",
              500
            )
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const updateAdmin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array(), status: 422 });
  }
  try {
    const { adminId } = req.params;
    const { userId, mobileNumber, firstName, lastName, email } = req.body;

    const adminCreate = {
      userId: userId,
      mobileNumber: mobileNumber,
      firstName: firstName,
      lastName: lastName,
      email: email,
    };

    Admin.findByIdAndUpdate(adminId, adminCreate, { new: true })
      .then((user) => {
        if (!user) {
          return next(new HttpError("No user data found on given id", 404));
        }
        return res.status(200).send({
          message: "User was successfully updated!",
          data: user,
        });
      })
      .catch((err) => {
        console.log(err);
        if (err) {
          return next(
            new HttpError(
              "unexpected error occurred while updating matching user",
              500
            )
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const profile = (req, res, next) => {
  try {
    const { userId } = req.user;
    Admin.findById(userId)
      .select("-password")
      .then((user) => {
        if (!!user) {
          return res.status(200).json({
            message: `Welcome, ${user.firstName}`,
            data: user,
            status: 200,
          });
        }
        return next(new HttpError("no user found", 404));
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError("unexpected error occurred while finding user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const changePassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array(), status: 422 });
  }
  try {
    const { oldPassword, newPassword } = req.body;
    const { userId } = req.user;

    Admin.findById(userId)
      .then((user) => {
        const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
        if (!isPasswordValid) {
          return next(new HttpError("Your old password is incorrect!", 401));
        } else if (newPassword === oldPassword) {
          return next(
            new HttpError("Please Enter Different New Password!", 401)
          );
        } else {
          const hash = bcrypt.hashSync(newPassword, 10);
          user.password = hash;
          user.resetPassword = false;
          user
            .save()
            .then((updatedUser) => {
              if (!updatedUser) {
                return next(
                  new HttpError("can not get user data while updating", 404)
                );
              }
              return res.status(200).send({
                message: "Password successfully updated!",
              });
            })
            .catch((err) => {
              if (err) {
                return next(
                  new HttpError(
                    "unexpected error occurred while updating password",
                    500
                  )
                );
              }
            });
        }
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError("unexpected error occurred while finding user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const resetPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array(), status: 422 });
  }
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    Admin.findOne({ userId })
      .then((user) => {
        if (!user._doc.resetPassword) {
          return next(
            new HttpError(
              "Please Login to Change Password or Click Forgot Password for New Password!",
              401
            )
          );
        }
        const isPasswordValid = bcrypt.compareSync(newPassword, user.password);
        if (isPasswordValid) {
          return next(
            new HttpError("Please Enter Different New Password!", 401)
          );
        } else {
          const hash = bcrypt.hashSync(newPassword, 10);
          user.password = hash;
          user.resetPassword = false;
          user
            .save()
            .then((updatedUser) => {
              if (!updatedUser) {
                return next(
                  new HttpError("can not get user data while updating", 404)
                );
              }
              const expirationSeconds = 60 * 60 * 24 * 7; // one week
              const token = jwt.sign({ userId: user.id }, SECRET, {
                expiresIn: expirationSeconds, // 24 hours
              });
              return res.status(200).send({
                message: "Password successfully updated!",
                status: 200,
                token,
              });
            })
            .catch((err) => {
              if (err) {
                return next(
                  new HttpError(
                    "unexpected error occurred while updating password",
                    500
                  )
                );
              }
            });
        }
      })
      .catch((err) => {
        if (err) {
          console.log(err);
          return next(
            new HttpError("unexpected error occurred while finding user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const forgotPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array(), status: 422 });
  }
  try {
    const { adminId } = req.params;
    const query = {
      $or: [{ userId: { $in: adminId } }, { mobileNumber: { $in: adminId } }],
    };
    Admin.findOne(query)
      .then((user) => {
        if (!user) {
          return next(new HttpError("User not found!", 400));
        }
        const randomPassword = Math.random().toString(36).slice(-10);
        const hash = bcrypt.hashSync(randomPassword, 10);
        user.password = hash;
        user.resetPassword = true;
        user
          .save()
          .then((updatedUser) => {
            if (!updatedUser) {
              return next(
                new HttpError(
                  "can not get user data while updating passoword",
                  404
                )
              );
            }
            // const transporter = nodemailer.createTransport({
            //   service: "gmail",
            //   auth: {
            //     user: NODEMAILER_USERNAME,
            //     pass: NODEMAILER_PASSWORD,
            //   },
            // });
            const msg = {
              to: user.email,
              from: SENDGRID_FROM_EMAIL,
              subject: "Vivaah Matrimony - Reset Password",
              html:
                "<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>\n\n" +
                `<h4>Password: ${randomPassword}</h4>` +
                "<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>" +
                "<p>In case of any queries, please feel free to reach out to us at <a href='mailto:support@webology.in'>support@webology.in</a>.</p>",
            };
            sgMail
              .send(msg)
              .then((response) => {
                console.log(response[0].statusCode);
                console.log(response[0].headers);
                return res.status(200).send({
                  message: `An e-mail has been sent to ${user.email} with new password, Please Login again with new Password.`,
                });
              })
              .catch((error) => {
                console.error(error);
                return res.status(401).json(error);
              });
            // const mailOptions = {
            //   to: user.email,
            //   from: NODEMAILER_USERNAME,
            //   subject: "Vivaah Matrimony - Reset Password",
            //   html:
            //     "<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>\n\n" +
            //     // '<p>Please click on the following link, or paste this into your browser to complete the process:</p>\n\n' +
            //     // `<a href=${mailLink} > Reset Password </a>` +
            //     `<h4>Password: ${randomPassword}</h4>` +
            //     "<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>",
            // };
            // transporter.sendMail(mailOptions, function (err) {
            //   if (err) {
            //     return res.status(401).json(err);
            //   }
            //   return res.status(200).send({
            //     message: `An e-mail has been sent to ${user.email} with new password, Please Login again with new Password.`,
            //   });
            // });
          })
          .catch((err) => {
            if (err) {
              console.log(err);
              return next(
                new HttpError(
                  "unexpected error occurred while updating password",
                  500
                )
              );
            }
          });
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError("unexpected error occurred while finding user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

exports.login = login;
exports.signUp = signUp;
exports.updateAdmin = updateAdmin;
exports.profile = profile;
exports.changePassword = changePassword;
exports.resetPassword = resetPassword;
exports.forgotPassword = forgotPassword;
