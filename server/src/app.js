require('dotenv').config();
require('express-async-errors');

// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () { return this.toString(); };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { startErpCron } = require('./services/erpCron');

const app = express();

app.use(helmet());
const allowedOrigins = [process.env.CLIENT_URL, process.env.STOCK_CLIENT_URL].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use((req, _res, next) => { req._startTime = Date.now(); next(); });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startErpCron();
});

module.exports = app;
