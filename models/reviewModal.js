const { default: mongoose } = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    // parent referecing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    // parent referecing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
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

// indexing tour and user so that each user can only give review per tour and we can't achieve this by creating tour and user field as unique because if we do that then every tour will have one review and every user will have one review so we need to have unique combination of both these field which we can achieve using indexing

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// populating user and tour field
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// static method and it is available directlt on Model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this here points to Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // adding the stats to Tour Model
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating,
  });
};

// this works when new review is created
reviewSchema.post('save', function () {
  //the calAverageRating() method is available on Model but here we don't have access to Review Model but we have this we point to current review/doc and it has this.contructor method which point to Modal
  this.constructor.calcAverageRatings(this.tour);
});

// this works for when review is updated or delete and it's a bit complex

// findByIdAndUpdate
// findByIdAndDelete
// Now these methods are query methods and they don't have doc access with them so we can't perform the above post middleware we have a hack for this
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  next();
});
// we are passing the document value in this.r variable so that we can access it on the next middleware
reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); does not work here, query has already executed
  if (this.r) await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
