const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name'],
      maxLength: [40, 'A tour name must have less or equal then 40 characters'],
      minLength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contains characters'],
      //this is just a demonstration of how to use a third party validator to validate the data
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // to round to 1 decimal point
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      //custom validator
      validate: {
        validator: function (val) {
          // this keyword only points to current doc on New Document creation and not while updating doc
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false, // this is done to not send this field in response this used in sensitive data like password
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON to store geo spatial data of any location
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      // embedding in mongoDB
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, embedding example
    // child referencing example
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// indexing in moongoose to increase read performance by default mongoose create "_id" field as index so basicially indexing means it will look fetch the values from database with this particular index instead search the the whole database. Now we can also create our own index field which we use often for querying like price field in tour model

// tourSchema.index({ price: 1 }); // 1 = ascending and -1 = descending this is single field indexing

// compound field indexing
tourSchema.index({ price: 1, ratingsAverage: -1 }); // it will also work for individual fields too
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // for geospatiacl query

// Virtual Properties these properties are not stored in DB and can only be used in response send by api and we cannot use this in controllers for any data manipulation as these are not stored in DB they are related to business logic

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Now we have used parent referencing in review model to get tour and user info in reviews but the tour and user model don't have any info about their reviews so we have to link them but we can't use child referencing because then it's array will grom indefinitely because reviews can be in millons so we will use virtuals to show the reviews in tours but will not store them in DB

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  // we are linking both models to each other here
  foreignField: 'tour', // field name we are using for parent referencing in review model
  localField: '_id', // equivalent field name in tour model
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()

// If you use this then only use regular function otherwise use arrow functions
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// middleware to embed guides in tour model but this is not a good approach because if user updates it' email then we have to update tour also which contains that guide this example is only to show how we can embed data in schema
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', (next) => {
//   console.log('Document will Save...');
//   next();
// });

// DOCUMENT MIDDLEWARE: runs after .save() and .create()

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: { $ne: true },
  });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} miliseconds`);
//   // console.log(docs);
//   next();
// });

//  AGGREGATION MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
