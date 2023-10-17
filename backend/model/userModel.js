const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Vui lòng nhập họ và tên!"],
  },
  email: {
    type: String,
    required: [true, "Vui lòng điền địa chỉ email!"],
  },
  password: {
    type: String,
    required: [true, "Vui lòng nhập mật khẩu của bạn! "],
    minLength: [4, "Mật khẩu phải hơn 8 ký tự "],
    select: false,
  },
  phoneNumber: {
    type: String,
    default: "null",
  },
  birthDay: {
    type: Date,
    default: Date.now(),
  },
  addresses: [
    {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      province: {
        type: String,
      },
      street: {
        type: String,
      },
      addressType: {
        type: String,
      },
    },
  ],
  role: {
    type: String,
    default: "user",
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

//  Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
