const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({
  path: './config.env',
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION shuting down 💥');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => {
  console.log('DB Connection Successfull!');
});
// .catch((err) => {
//   console.log('Error', err);
// });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`app is listem at ${port} ...`);
});

// handling unhandled Rejections for the entire app at a single place for async operations

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION shuting down 💥');
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
