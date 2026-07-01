function toFiniteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizedText(...values) {
  return values
    .flat()
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).trim().toUpperCase())
    .filter(Boolean)
    .join(" ");
}

function periodQuota(period) {
  const directQuota = toFiniteNumber(period?.quota);
  if (directQuota !== null) return Math.max(0, directQuota);

  if (!Array.isArray(period?.pricing)) return 0;
  return period.pricing.reduce((total, price) => {
    const quota = toFiniteNumber(price?.quota);
    return total + Math.max(0, quota || 0);
  }, 0);
}

function classifyPeriod(period) {
  const text = normalizedText(
    period?.label,
    period?.method,
    period?.salesMethod,
    period?.pricing?.map((price) => price?.label),
  );
  const pricingMarksOfc = Array.isArray(period?.pricing)
    ? period.pricing.some((price) => Boolean(price?.isOfcOnly))
    : false;
  const isFcfs = /\bFCFS\b|FIRST\s*COME|SIAPA\s*CEPAT/.test(text);
  const isOfc = !isFcfs && (pricingMarksOfc || /\bOFC\b|FAN\s*CLUB/.test(text));
  const isGeneral = !isFcfs && !isOfc && /GENERAL|UMUM/.test(text);

  return {
    quota: periodQuota(period),
    isFcfs,
    isOfc,
    isGeneral,
  };
}

export function buildTheaterQuotaSummary({
  totalQuota,
  remainingQuota,
  salesPeriods = [],
} = {}) {
  const periods = Array.isArray(salesPeriods) ? salesPeriods : [];
  const classified = periods.map(classifyPeriod);

  const ofcQuota = classified
    .filter((period) => period.isOfc)
    .reduce((total, period) => total + period.quota, 0);
  const generalQuota = classified
    .filter((period) => period.isGeneral)
    .reduce((total, period) => total + period.quota, 0);
  const fcfsQuota = classified
    .filter((period) => period.isFcfs)
    .reduce((total, period) => total + period.quota, 0);
  const hasFcfs = classified.some((period) => period.isFcfs);

  const explicitTotal = toFiniteNumber(totalQuota);
  const explicitRemaining = toFiniteNumber(remainingQuota);
  // FCFS bukan alokasi baru. Nilainya adalah sisa dari kuota OFC + General
  // yang belum terjual. Karena beberapa respons API memasukkan kuota FCFS ke
  // total_quota, prioritaskan jumlah alokasi awal agar total tidak membengkak.
  // Ini tetap aman untuk show luar kota karena kuotanya mengikuti nilai OFC dan
  // General yang diberikan pada sales period masing-masing venue.
  const calculatedInitialQuota = ofcQuota + generalQuota;
  const resolvedTotal =
    calculatedInitialQuota > 0 ? calculatedInitialQuota : explicitTotal;
  const resolvedRemaining = hasFcfs
    ? (explicitRemaining ?? (fcfsQuota > 0 ? fcfsQuota : null))
    : null;

  return {
    totalQuota: resolvedTotal,
    ofcQuota: ofcQuota > 0 ? ofcQuota : null,
    generalQuota: generalQuota > 0 ? generalQuota : null,
    hasFcfs,
    remainingQuota: resolvedRemaining,
    hasData:
      resolvedTotal !== null ||
      ofcQuota > 0 ||
      generalQuota > 0 ||
      (hasFcfs && resolvedRemaining !== null),
  };
}
