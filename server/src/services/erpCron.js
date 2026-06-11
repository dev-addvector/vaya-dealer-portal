const cron = require('node-cron');
const axios = require('axios');
const prisma = require('../config/database');

const RETAIN_DAYS = 30;

async function checkErpStatus() {
  let online = false;
  try {
    await axios.get(process.env.ERP_API_URL, {
      timeout: 10000,
      headers: { Authorization: `Bearer ${process.env.ERP_API_TOKEN}` },
      validateStatus: () => true,
    });
    online = true;
  } catch {
    online = false;
  }

  await prisma.erpStatusLog.create({ data: { online } });

  const cutoff = new Date(Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.erpStatusLog.deleteMany({ where: { checkedAt: { lt: cutoff } } });
}

function startErpCron() {
  checkErpStatus(); // run immediately on startup
  cron.schedule('*/15 * * * *', checkErpStatus);
  console.log('ERP status cron started (every 15 min)');
}

module.exports = { startErpCron };
