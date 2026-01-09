import * as chrono from "chrono-node";

const departmentKeywords = [
  "dentist",
  "dentistry",
  "dental",
  "cardiology",
  "cardiologist",
  "dermatology",
  "dermatologist",
  "orthopedics",
  "orthopaedics",
  "physiotherapy",
  "pediatrician",
  "paediatrician",
  "pediatrics",
  "general physician",
  "physician",
  "gp",
  "ent"
];

function findDepartment(rawText) {
  const lower = rawText.toLowerCase();
  const hit = departmentKeywords.find((k) => lower.includes(k));
  return hit || null;
}

function findTimePhrase(rawText) {
  const m =
    rawText.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
    rawText.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))\b/);
  return m ? m[0] : null;
}

function findDatePhrase(rawText) {
  const m = rawText.match(
    /\b(today|tomorrow|day after tomorrow|next\s+[a-z]+|this\s+[a-z]+)\b/i
  );
  if (m) return m[0];
  const m2 = rawText.match(/\b(\d{1,2})(st|nd|rd|th)?\s+[a-z]+\b/i);
  return m2 ? m2[0] : null;
}

function toHHmmFromDate(d) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(d);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

function toYyyyMmDdFromDate(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

function referenceDateInKolkata(currentDateIso) {
  return new Date(`${currentDateIso}T00:00:00+05:30`);
}

export function fallbackExtractEntities(rawText) {
  const date_phrase = findDatePhrase(rawText);
  const time_phrase = findTimePhrase(rawText);
  const department = findDepartment(rawText);
  const complete = Boolean(date_phrase && time_phrase && department);
  return {
    entities: { date_phrase, time_phrase, department },
    entities_confidence: complete ? 0.7 : 0.5
  };
}

export function fallbackNormalize({ entities, currentDateIso, tz }) {
  const combined = [entities?.date_phrase, entities?.time_phrase]
    .filter(Boolean)
    .join(" ");
  if (!combined) {
    return {
      normalized: { date: null, time: null, tz },
      normalization_confidence: 0.4
    };
  }

  const ref = referenceDateInKolkata(currentDateIso);
  const d = chrono.parseDate(combined, ref);
  if (!d) {
    return {
      normalized: { date: null, time: null, tz },
      normalization_confidence: 0.4
    };
  }

  return {
    normalized: { date: toYyyyMmDdFromDate(d), time: toHHmmFromDate(d), tz },
    normalization_confidence: 0.65
  };
}
