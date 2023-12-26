const express = require('express');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const foodRouter = require('./routes/foodRoutes');

const app = express();

//1) Global Middlewares

// Implemet CORS
app.use(cors()); // It will allow origin or url to access to our APIs but it work with simple requests only like get and post
app.options('*', cors());
app.use(express.urlencoded({ extended: true }));

//3) Routes

// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/reviews', reviewRouter);
// app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/ingredients', foodRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
