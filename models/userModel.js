const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email!'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password!'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm password!'],
      validate: {
        // this will only work on CREATE and SAVE method only and not on UPDATE methods like findByIdAndUpdate
        validator: function (val) {
          return val === this.password;
        },
        message: 'Passwords are not same!',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    // to never send password field in response
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
      },
    },
  },
);

userSchema.pre('save', async function (next) {
  // Only run this func if password is actually modified or updated
  if (!this.isModified('password')) return next();

  // 12 here salt value and default salt is 10, please note that higher the salt value it will be more cpu intensive work and will hence take more time
  this.password = await bcrypt.hash(this.password, 12);

  //we don't to store it's value in DB we needed this field only for validation of passwords
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    // the isNew property tell us is the doc is newly created because we don't have password changedAt in new doc
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000; // we are subtracting 1 sec because sometimes token is generated before saving passwordChangedAt is DB so we minus 1 sec therefore token will always generate after passwordChangesAt
  next();
});

userSchema.pre(/^find/, function (next) {
  // here this will point to query object

  this.find({ active: { $ne: false } });
  next();
});

// this is an instance method is available to all the documents of particular Modals
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // in this method we can't use this.password as we have used select:false that's why we have to pass both the passwords in function
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp; // 100 < 200 : true means changes and 300 < 200 : false means not changes
  }

  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // this is plain reset token which we will send to user on their email
  const resetToken = crypto.randomBytes(32).toString('hex');

  // this is the encrypted reset Token and it is stored in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // this the expiration time of reset token and it's of 10 mins
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
