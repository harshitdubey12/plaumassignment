const departmentMap = new Map([
  ["dentist", "Dentistry"],
  ["dentistry", "Dentistry"],
  ["dental", "Dentistry"],
  ["cardiology", "Cardiology"],
  ["cardiologist", "Cardiology"],
  ["dermatology", "Dermatology"],
  ["dermatologist", "Dermatology"],
  ["ent", "ENT"],
  ["orthopedics", "Orthopedics"],
  ["orthopaedics", "Orthopedics"],
  ["physiotherapy", "Physiotherapy"],
  ["pediatrician", "Pediatrics"],
  ["paediatrician", "Pediatrics"],
  ["pediatrics", "Pediatrics"],
  ["general physician", "General Medicine"],
  ["physician", "General Medicine"],
  ["gp", "General Medicine"]
]);

function titleCase(s) {
  return s
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function mapDepartment(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "Unknown";
  const key = raw.toLowerCase().replace(/\.+$/g, "");
  return departmentMap.get(key) || titleCase(raw);
}

