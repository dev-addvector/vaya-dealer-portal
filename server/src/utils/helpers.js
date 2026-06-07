const crypto = require('crypto');
const https = require('https');

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

const getLocation = (ip) => {
  return new Promise((resolve) => {
    const isLocal = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');
    if (isLocal) return resolve('');

    const req = https.get(`https://ip-api.com/json/${ip}?fields=status,regionName,country`, { timeout: 5000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.status === 'success') {
            resolve(data.regionName || data.country || '');
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      });
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
};

module.exports = { randomToken, detectDevice, detectOS, getLocation };
