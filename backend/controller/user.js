const express = require("express");
const path = require("path");
const router = express.Router();
const { upload } = require("../multer");
const User = require("../model/userModel");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//create-new-user
router.post("/new-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password, confirm } = req.body;
    const userEmail = await User.findOne({ email });
    if (userEmail) {
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ message: "Delete file" });
        }
      });
      return next(new ErrorHandler("Người dùng đã tồn tại"), 500);
    }
    const filename = req.file.filename;
    const filePath = path.join(filename);
    const user = {
      name: name,
      email: email,
      password: password,
      avatar: {
        public_id: "null",
        url: filePath,
      },
    };
    const activationToken = createActivationToken(user);
    const activationUrl = `https://localhost:3000/activation/${activationToken}`;
    try {
      await sendMail({
        email: user.email,
        subject: "Kích hoạt tài khoản",
        message: `Xin chào ${user.name}, vui lòng nhấn vào liên kết để kích hoạt tài khoản của bạn: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `Vui lòng kiểm tra email:- ${user.email} để kích hoạt tài khoản !`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
    const newUser = await User.create(user);
    res.status(201).json({
      success: true,
      newUser,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message), 400);
  }
});
//create activationtoken
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("Người dùng đã tồn tạitại", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
module.exports = router;
