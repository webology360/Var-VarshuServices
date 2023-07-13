const HttpError = require("../middlewares/httpError");
const { validationResult } = require("express-validator");
const User = require("../models/userModel");
const userStatus = require("../utils/userStatus");
const genderTypes = require("../utils/genderTypes");
const dotenv = require("dotenv");
const { BlobServiceClient } = require("@azure/storage-blob");
dotenv.config();

const CONTAINER_NAME = process.env.CONTAINER_NAME;
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const SAS_TOKEN = process.env.SAS_TOKEN;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN_TWILIO = process.env.AUTH_TOKEN_TWILIO;

const sgMail = require("@sendgrid/mail");
const messageTypes = require("../utils/messageTypes");
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

const ACCOUNT_MOBILE_NUMBER = process.env.ACCOUNT_MOBILE_NUMBER;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN_TWILIO);

const getUsers = (req, res, next) => {
  try {
    const { genderType } = req.params;
    const {
      // ageFrom, ageTo, state, location,
      value,
      // , motherTounge
    } = req.query;

    const { ageFrom, ageTo, state, motherTounge } = req.body;
    console.log(ageFrom, ageTo, state, motherTounge);
    const isSearchValueNumber =
      value !== undefined && value !== "" ? !isNaN(value) : false;

    const query =
      value !== undefined
        ? isSearchValueNumber
          ? {
              $and: [
                {
                  $or: [
                    { firstName: { $regex: value, $options: "i" } },
                    { middleName: { $regex: value, $options: "i" } },
                    { lastName: { $regex: value, $options: "i" } },
                    { occupation: { $regex: value, $options: "i" } },
                    { education: { $regex: value, $options: "i" } },
                    { age: { $in: parseInt(value) } },
                    { annualIncome: { $in: parseInt(value) } },
                    { bodyComplexion: { $regex: value } },
                    { zodiacSign: { $regex: value } },
                    // {
                    //   "presentAddress.location": {
                    //     $regex: value,
                    //     $options: "i",
                    //   },
                    // },
                    {
                      "presentAddress.state": { $regex: value, $options: "i" },
                    },
                    { "presentAddress.area": { $regex: value, $options: "i" } },
                    { "presentAddress.pincode": { $in: parseInt(value) } },
                    // {
                    //   "permanentAddress.location": {
                    //     $regex: value,
                    //     $options: "i",
                    //   },
                    // },
                    {
                      "permanentAddress.state": {
                        $regex: value,
                        $options: "i",
                      },
                    },
                    {
                      "permanentAddress.area": { $regex: value, $options: "i" },
                    },
                    {
                      "permanentAddress.pincode": { $in: parseInt(value) },
                    },
                  ],
                },
                { gender: parseInt(genderType) },
              ],
            }
          : {
              $and: [
                {
                  $or: [
                    { firstName: { $regex: value, $options: "i" } },
                    { middleName: { $regex: value, $options: "i" } },
                    { lastName: { $regex: value, $options: "i" } },
                    { occupation: { $regex: value, $options: "i" } },
                    { education: { $regex: value, $options: "i" } },
                    { bodyComplexion: { $regex: value } },
                    { zodiacSign: { $regex: value } },
                    // {
                    //   "presentAddress.location": {
                    //     $regex: value,
                    //     $options: "i",
                    //   },
                    // },
                    {
                      "presentAddress.state": { $regex: value, $options: "i" },
                    },
                    { "presentAddress.area": { $regex: value, $options: "i" } },
                    // {
                    //   "permanentAddress.location": {
                    //     $regex: value,
                    //     $options: "i",
                    //   },
                    // },
                    {
                      "permanentAddress.state": {
                        $regex: value,
                        $options: "i",
                      },
                    },
                    {
                      "permanentAddress.area": { $regex: value, $options: "i" },
                    },
                  ],
                },
                { gender: parseInt(genderType) },
              ],
            }
        : {
            $and: [
              { gender: parseInt(genderType) },
              { age: { $gte: parseInt(ageFrom), $lte: parseInt(ageTo) } },
              // { state: { $in: state } },
              // { location: { $in: location } },
              { motherTounge: motherTounge },
              { status: 1 },
              {
                $or: [
                  {
                    "presentAddress.state": state,
                  },
                  {
                    "permanentAddress.state": state,
                  },
                ],
              },
              // {
              //   $or: [
              //     {
              //       "presentAddress.location": location,
              //     },
              //     {
              //       "permanentAddress.location": location,
              //     },
              //   ],
              // },
            ],
          };
    User.find(query)
      .sort({ firstName: "asc" })
      .then((users) => {
        if (!users) {
          return next(
            new HttpError("can not get users while finding data", 404)
          );
        }
        return res.status(200).send({
          messageType:
            users?.length > 0 ? messageTypes.SUCCESS : messageTypes.FAIL,
          message:
            users?.length > 0
              ? "users found successfully!"
              : "No users data found!",
          data: users,
        });
      })
      .catch((err) => {
        if (err) {
          console.log(err);
          return next(
            new HttpError(
              "unexpected error occurred while finding matching users",
              500
            )
          );
        }
      });
  } catch (error) {
    console.log(error);
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const getTopProfiles = (req, res, next) => {
  try {
    const { genderType } = req.params;

    User.find({ gender: genderType })
      .sort({ viewCount: "desc" })
      .limit(10)
      .then((users) => {
        if (!users) {
          return next(
            new HttpError("can not get users while finding data", 404)
          );
        }
        return res.status(200).send({
          messageType:
            users?.length > 0 ? messageTypes.SUCCESS : messageTypes.FAIL,
          message:
            users?.length > 0
              ? "users found successfully!"
              : "No users data found!",
          data: users,
        });
      })
      .catch((err) => {
        if (err) {
          console.log(err);
          return next(
            new HttpError(
              "unexpected error occurred while finding matching users",
              500
            )
          );
        }
      });
  } catch (error) {
    console.log(error);
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const addUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      messageType: messageTypes.FAIL,
      message: errors.array(),
    });
  }
  try {
    // const { user_id } = req.user;
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      email,
      mobileNumber,
      occupation,
      education,
      preferredPartnerChoice,
      gender,
      height,
      age,
      bodyComplexion,
      motherTounge,
      employmentType,
      familyMembersAndRelations,
      zodiacSign,
      presentAddress,
      permanentAddress,
      bioData,
      remarks,
      imgList,
      annualIncome,
    } = req.body;

    const dateOfBirthFormat = new Date(dateOfBirth);
    const genderType =
      gender === genderTypes.MALE ? genderTypes.MALE : genderTypes.FEMALE;

    const userCreate = new User({
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      dateOfBirth: dateOfBirthFormat,
      email: email,
      mobileNumber: mobileNumber,
      occupation: occupation,
      education: education,
      preferredPartnerChoice: preferredPartnerChoice,
      gender: genderType,
      height: height,
      age: age,
      bodyComplexion: bodyComplexion,
      motherTounge: motherTounge,
      employmentType: employmentType,
      familyMembersAndRelations: familyMembersAndRelations,
      zodiacSign: zodiacSign,
      presentAddress: presentAddress,
      permanentAddress: permanentAddress,
      bioData: bioData,
      remarks: remarks,
      imgList: imgList,
      annualIncome: annualIncome,
    });

    userCreate
      .save()
      .then((user) => {
        if (!user) {
          return next(new HttpError("Can not get user while adding data", 404));
        }
        return res.status(201).send({
          messageType: messageTypes.SUCCESS,
          message: "User was successfully added!",
          data: user,
        });
      })
      .catch((err) => {
        if (err) {
          console.log(err);
          return next(
            new HttpError("Unexpected error occurred while adding user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("Unexpected error occurred", 500));
  }
};

const uploadBioData = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const uploadUrl = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/?${SAS_TOKEN}`;
    const blobService = new BlobServiceClient(uploadUrl);
    const containerClient = blobService.getContainerClient(CONTAINER_NAME);
    const blobName = `${Date.now()}-${req.file.originalname}`;
    const stream = req.file.buffer;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(stream);
    const url = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${SAS_TOKEN}`;

    const userUpdate = {
      bioData: url,
    };

    User.findByIdAndUpdate(userId, userUpdate, { new: true })
      .then((user) => {
        if (!user) {
          return next(new HttpError("No user data found on given id", 404));
        }
        return res.status(201).send({
          messageType: messageTypes.SUCCESS,
          message: "Biodata was successfully uploaded!",
          data: user,
        });
      })
      .catch((err) => {
        console.log(err);
        if (err) {
          return next(
            new HttpError(
              "unexpected error occurred while uploading biodata",
              500
            )
          );
        }
      });
  } catch (error) {
    console.log(error);
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const uploadImages = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const uploadUrl = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/?${SAS_TOKEN}`;
    const blobService = new BlobServiceClient(uploadUrl);
    const containerClient = blobService.getContainerClient(CONTAINER_NAME);

    const promises = [];
    const urls = [];

    for (let i = 0; i < req.files.length; i++) {
      const blobName = `${Date.now()}-${req.files[i].originalname}`;
      const stream = req.files[i].buffer;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const promise = blockBlobClient.uploadData(stream);
      urls.push(
        `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${SAS_TOKEN}`
      );
      promises.push(promise);
    }

    await Promise.all(promises);

    const userUpdate = {
      imgList: urls,
    };

    User.findByIdAndUpdate(userId, userUpdate, { new: true })
      .then((user) => {
        if (!user) {
          return next(new HttpError("No user data found on given id", 404));
        }
        return res.status(201).send({
          messageType: messageTypes.SUCCESS,
          message: "Images was successfully uploaded!",
          data: user,
        });
      })
      .catch((err) => {
        console.log(err);
        if (err) {
          return next(
            new HttpError(
              "unexpected error occurred while uploading images",
              500
            )
          );
        }
      });
  } catch (error) {
    console.log(error);
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const updateUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      messageType: messageTypes.FAIL,
      message: errors.array(),
    });
  }
  try {
    const { userId } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      email,
      mobileNumber,
      occupation,
      education,
      preferredPartnerChoice,
      gender,
      height,
      age,
      bodyComplexion,
      motherTounge,
      employmentType,
      familyMembersAndRelations,
      zodiacSign,
      presentAddress,
      permanentAddress,
      bioData,
      remarks,
      imgList,
      annualIncome,
    } = req.body;

    const dateOfBirthFormat = new Date(dateOfBirth);

    const userCreate = {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      dateOfBirth: dateOfBirthFormat,
      email: email,
      mobileNumber: mobileNumber,
      occupation: occupation,
      education: education,
      preferredPartnerChoice: preferredPartnerChoice,
      //1-male,2-female
      gender: gender,
      height: height,
      age: age,
      bodyComplexion: bodyComplexion,
      motherTounge: motherTounge,
      employmentType: employmentType,
      familyMembersAndRelations: familyMembersAndRelations,
      zodiacSign: zodiacSign,
      presentAddress: presentAddress,
      permanentAddress: permanentAddress,
      bioData: bioData,
      remarks: remarks,
      imgList: imgList,
      annualIncome: annualIncome,
    };

    User.findByIdAndUpdate(userId, userCreate, { new: true })
      .then((user) => {
        if (!user) {
          return next(new HttpError("No user data found on given id", 404));
        }
        return res.status(201).send({
          messageType: messageTypes.SUCCESS,
          message: "User was successfully updated!",
          data: user,
        });
      })
      .catch((err) => {
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

const getUser = (req, res, next) => {
  try {
    const { userId } = req.params;
    const { updateCount } = req.query;
    //user status - 1-active, 2-disable
    User.findById(userId)
      .then((user) => {
        if (!user) {
          return next(new HttpError("no user found on given id", 404));
        }
        if (updateCount) {
          user.viewCount += 1;
          user
            .save()
            .then((updatedUser) => {
              if (!updatedUser) {
                return next(
                  new HttpError("can not get user data while updating", 404)
                );
              }
              return res.status(201).send({
                messageType: messageTypes.SUCCESS,
                message: "User was found successfully!",
                data: updatedUser,
              });
            })
            .catch((err) => {
              if (err) {
                return next(
                  new HttpError(
                    "unexpected error occurred while updating user",
                    500
                  )
                );
              }
            });
        } else {
          return res.status(201).send({
            messageType: messageTypes.SUCCESS,
            message: "User was found successfully!",
            data: user,
          });
        }
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError(
              "unexpected error occurred while finding matching user",
              500
            )
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const toggleUserStatus = (req, res, next) => {
  try {
    const { userId } = req.params;
    //user status - 1-active, 2-disable
    User.findById(userId)
      .then((user) => {
        if (!user) {
          return next(new HttpError("no user found on given id", 404));
        }
        user.status =
          user.status === userStatus.ACTIVE
            ? userStatus.DISABLE
            : userStatus.ACTIVE;
        user
          .save()
          .then((updatedUser) => {
            if (!updatedUser) {
              return next(
                new HttpError("can not get user data while updating", 404)
              );
            }
            return res.status(200).send({
              messageType: messageTypes.SUCCESS,
              message:
                user.status === userStatus.ACTIVE
                  ? "User was disabled successfully"
                  : "User was enabled successfully",
              data: updatedUser,
            });
          })
          .catch((err) => {
            if (err) {
              return next(
                new HttpError(
                  "unexpected error occurred while updating user",
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
              "unexpected error occurred while finding matching user",
              500
            )
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const deleteUser = (req, res, next) => {
  try {
    const { userId } = req.params;
    User.findByIdAndDelete(userId)
      .then((user) => {
        if (!user) {
          return next(new HttpError("No user Found on given Id", 400));
        }
        return res.status(200).send({
          messageType: messageTypes.SUCCESS,
          message: "user was successfully deleted!",
          data: user,
        });
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError("unexpected error occurred while deleting user", 500)
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

const sendMessage = (req, res, next) => {
  try {
    const { userId } = req.params;

    const { mobileNumber, emailId } = req.body;

    User.findById(userId)
      .select("-password")
      .then((user) => {
        if (!user) {
          return next(new HttpError("no user found on given id", 404));
        }
        const msg = {
          to: emailId,
          from: SENDGRID_FROM_EMAIL,
          subject: "Vivaah Matrimony - Profile Information",
          html: `<h4>User Name: ${user.firstName + " " + user.lastName}</h4>`,
        };
        sgMail
          .send(msg)
          .then((response) => {
            console.log(response[0].statusCode);
            console.log(response[0].headers);
            client.messages
              .create({
                body: `User Name: ${user.firstName + " " + user.lastName}`,
                from: ACCOUNT_MOBILE_NUMBER,
                to: `+91${mobileNumber}`,
              })
              .then((message) => {
                console.log(message.sid);
                return res.status(200).send({
                  messageType: messageTypes.SUCCESS,
                  message: `User Information has been sent to ${emailId} and ${mobileNumber} with user contact details.`,
                });
              })
              .catch((error) => {
                console.error(error);
                // return res.status(401).json(error);
                return next(
                  new HttpError(
                    "unexpected error occurred while sending message",
                    401
                  )
                );
              });
          })
          .catch((error) => {
            console.error(error);
            // return res.status(401).json(error);
            return next(
              new HttpError("unexpected error occurred while sending mail", 401)
            );
          });
      })
      .catch((err) => {
        if (err) {
          return next(
            new HttpError(
              "unexpected error occurred while finding matching user",
              500
            )
          );
        }
      });
  } catch (error) {
    return next(new HttpError("unexpected error occurred", 500));
  }
};

exports.getUsers = getUsers;
exports.getTopProfiles = getTopProfiles;
exports.addUser = addUser;
exports.sendMessage = sendMessage;
exports.uploadImages = uploadImages;
exports.uploadBioData = uploadBioData;
exports.updateUser = updateUser;
exports.toggleUserStatus = toggleUserStatus;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
