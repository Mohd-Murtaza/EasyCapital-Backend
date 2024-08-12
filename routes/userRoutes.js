const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { BlacklistModel } = require("../models/blacklistModel");
require("dotenv").config();

const router = express.Router();
const ACCESS_KEY = process.env.ACCESS_KEY;
const REFRESH_KEY = process.env.REFRESH_KEY;

// Register
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const checkUserIsExist = await User.exists({ email });
    if (checkUserIsExist) {
      res.status(400).send("user is exist already");
    } else {
      bcrypt.hash(password, 5, async (err, hash) => {
        if (hash) {
          const newUser = new User({ name, email, password: hash });
          await newUser.save();
          res.status(200).send({ msg: "user register successfully", newUser });
          //when some one registering then login route also hit at a time
        } else {
          res
            .status(400)
            .send({ msg: "error while hashing password!", err: err.message });
        }
      });
    }
  } catch (error) {
    res.status(400).send({ msg: "error while sign up!", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cookieOptions = { httpOnly: true, secure: true, sameSite: "none" };
    const checkUserIsExist = await User.findOne({ email });
    console.log(checkUserIsExist);
    if (!checkUserIsExist) {
      res.status(404).send({ msg: "user not found please signup first" });
    } else {
      bcrypt.compare(password, checkUserIsExist.password, (err, decode) => {
        if (err) {
          console.error("Error during password comparison:", err);
          res.status(500).send({ msg: "Internal server error" });
        } else if (!decode) {
          res.status(401).send({ msg: "Invalid password" });
        } else {
          const accessToken = jwt.sign(
            {
              userId: checkUserIsExist._id,
              name: checkUserIsExist.name,
            },
            ACCESS_KEY,
            { expiresIn: "5m" }
          );
          const refreshToken = jwt.sign(
            {
              userId: checkUserIsExist._id,
              name: checkUserIsExist.name,
            },
            REFRESH_KEY,
            { expiresIn: "1h" }
          );
          res.cookie("accessToken", accessToken, cookieOptions);
          res.cookie("refreshToken", refreshToken, cookieOptions);
          console.log("access Token from cookies", req.cookies.accessToken)
          res
            .status(200)
            .send({
              msg: "user login successfully.",
              name: checkUserIsExist.name,
              accessToken,
              refreshToken,
            });
        }
      });
    }
  } catch (error) {
    res.status(400).send({ msg: "error while login!", error: error.message });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  const accessToken = req.cookies.accessToken;
  console.log({ accessToken: accessToken });
  try {
    const checkTokensIsExists = await BlacklistModel.findOne({ accessToken });
    console.log(checkTokensIsExists, "check is token")
    if (checkTokensIsExists) {
      res.status(400).send({ msg: "you already logout!" });
    } else {
      const blacklistTokens = new BlacklistModel({ accessToken });
      await blacklistTokens.save();
      res.status(200).send({ msg: "logout successfull", blacklistTokens });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ msg: "error while logout!", error: error });
  }
});

module.exports = router;