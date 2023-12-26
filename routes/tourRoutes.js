const express = require('express');
const {
  getTour,
  getTours,
  updateTour,
  deleteTour,
  createTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
  //   checkId,
  //   checkBody,
} = require('../controllers/toursController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Param Middleware
// router.param('id', checkId);

// nested routes
router.use('/:tourId/reviews', reviewRouter);

//Route alliasing
router.route('/top-5-cheap').get(aliasTopTours, getTours);
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
// we can also write this as 'tours-within?distance=200&latlng=20,30&unit=miles but above one is a standard approach and clean too

router.route('/distances/:latlng/unit/:unit').get(getDistances);
// middleware chaining
// router.route('/').get(getTours).post(checkBody, addTour); //passing two middleware in single method application of middleware chaining
router
  .route('/')
  .get(getTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
