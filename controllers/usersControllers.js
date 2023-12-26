const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// this approach will store the image in disk i.e we have to store it in our hard drive in a particular directory
// const multerStorage = multer.diskStorage({
//   //cb here is like next method only provide by multer it's first arg is always error
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// it will store the image in memory i.e RAM
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, file);
  } else {
    cb(new AppError('Not an image! Please upload image only.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // here we are assigning the filename in req.file.filename because in multer.memoryStorage we don't have access to req.file.filename and we are using this in update me middleware so to not have any undefined error
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90,
    })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// getMe to get current user details now we want to use getOne factory method but the issue here is that is getOne() we are taking userId from req.params but in this endpoint we have user details in req.user variable so we will create a middleware to set req.params.id = req.user.id
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user POSTs password data
  const { password, passwordConfirm, name, email } = req.body;

  if (password || passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Update user document

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name,
      email,
      ...(req.file && { photo: req.file.filename }),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user.id,
    { active: false },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not been defined! and please use /signup instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do not use this to update password as we are using save method in updating password in our middlewares
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
