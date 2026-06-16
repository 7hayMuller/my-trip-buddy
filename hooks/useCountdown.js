import { useState, useEffect } from 'react';

function calcDiff(targetDateStr) {
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  if (!targetDateStr) return zero;
  // Count down to end of departure day so it doesn't hit 0 at midnight
  const target = new Date(targetDateStr + 'T23:59:59');
  if (isNaN(target.getTime())) return zero;
  const total = Math.max(0, target - new Date());
  return {
    total,
    days:    Math.floor(total / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
  };
}

export function useCountdown(targetDateStr) {
  // Initialize with calculated values to avoid a flash of zeros
  const [diff, setDiff] = useState(() => calcDiff(targetDateStr));

  useEffect(() => {
    setDiff(calcDiff(targetDateStr));
    if (!targetDateStr) return;
    const t = setInterval(() => setDiff(calcDiff(targetDateStr)), 1000);
    return () => clearInterval(t);
  }, [targetDateStr]);

  return diff;
}
