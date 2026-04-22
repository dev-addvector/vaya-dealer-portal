module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err?.status || err?.response?.status || 500;
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.msg ||
    err?.message ||
    'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
  });
};
