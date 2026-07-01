function timeToMinutes(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * Menyembunyikan jadwal Exclusive yang sudah selesai tanpa mengubah
 * data Show/Event dari API resmi JKT48.
 *
 * - Tanggal lampau selalu kedaluwarsa.
 * - Untuk hari ini, endTime dipakai sebagai batas utama.
 * - Jika endTime tidak tersedia, startTime dipakai sebagai fallback.
 * - Jika jam tidak tersedia, item tetap tampil sampai hari berganti.
 */
export function isExpiredExclusive(schedule, jakartaNow) {
  if (schedule?.type !== "EXCLUSIVE") return false;

  const dateKey = String(schedule?.dateKey || "").trim();
  const todayKey = String(jakartaNow?.key || "").trim();

  if (!dateKey || !todayKey) return false;
  if (dateKey < todayKey) return true;
  if (dateKey > todayKey) return false;

  const hour = Number(jakartaNow?.hour);
  const minute = Number(jakartaNow?.minute);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;

  const cutoffMinutes =
    timeToMinutes(schedule?.endTime) ?? timeToMinutes(schedule?.startTime);

  if (cutoffMinutes === null) return false;
  return hour * 60 + minute >= cutoffMinutes;
}
