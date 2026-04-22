module.exports = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.XAPI_KEY)
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  next();
};
