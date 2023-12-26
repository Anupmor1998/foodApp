class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //we are calling super to get all the parent class properties and methods and As the original Error class will only expect message as argument e.g const err = new Error("Some err message")
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // we are writing the below code to not include this class in the error stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
