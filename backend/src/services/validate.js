export function isValidIsoDate(s) {
  if (typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function isValidTimeHHmm(s) {
  if (typeof s !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [hh, mm] = s.split(":").map(Number);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

