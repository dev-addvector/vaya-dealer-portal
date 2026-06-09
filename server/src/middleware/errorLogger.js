const prisma = require('../config/database');

module.exports = async function logError(err, req) {
  try {
    const erpBaseUrl = process.env.ERP_API_URL;
    const isErpError =
      err?.isErpError === true ||
      (erpBaseUrl && err?.config?.baseURL === erpBaseUrl);

    const origin = isErpError ? 'ERP' : 'APP';
    const responseTime = req?._startTime ? Date.now() - req._startTime : null;

    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.msg ||
      err?.message ||
      'Unknown error';

    await prisma.errorLog.create({
      data: {
        origin,
        requestPath: req?.originalUrl || req?.path || null,
        errorMessage: String(message).slice(0, 2000),
        responseTime,
      },
    });
  } catch (logErr) {
    console.error('[ErrorLogger] Failed to store error log:', logErr.message);
  }
};
