const IST = 'Asia/Kolkata';

/** Today's date as YYYY-MM-DD in IST — use for date input defaults/min/max */
export const todayIST = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: IST });

/** UTC string → "DD MMM YYYY"  e.g. "08 Jun 2026" */
export const formatDateIST = (utcStr) => {
  if (!utcStr) return '—';
  return new Date(utcStr).toLocaleDateString('en-IN', {
    timeZone: IST, day: '2-digit', month: 'short', year: 'numeric',
  });
};

/** UTC string → "YYYY-MM-DD HH:MM:SS"  e.g. "2026-06-08 14:40:59" */
export const formatDateTimeIST = (utcStr) => {
  if (!utcStr) return '—';
  return new Date(utcStr)
    .toLocaleString('en-CA', {
      timeZone: IST,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
    .replace(',', '');
};
