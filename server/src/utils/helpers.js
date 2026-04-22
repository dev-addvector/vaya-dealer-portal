const crypto = require('crypto');

const randomToken = () => crypto.randomBytes(32).toString('hex');

const detectDevice = (ua = '') => {
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

const detectOS = (ua = '') => {
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac/i.test(ua)) return 'Mac';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad/i.test(ua)) return 'iOS';
  return 'Unknown';
};

module.exports = { randomToken, detectDevice, detectOS };
