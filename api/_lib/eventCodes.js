const EVENT_CODE_PATTERN = /^EX[A-Z0-9]{4,12}$/i;
const EVENT_CODE_KEYS = [
  "code",
  "event_code",
  "eventCode",
  "exclusive_code",
  "exclusiveCode",
];

function normalizeEventCode(value) {
  const code = String(value || "")
    .trim()
    .toUpperCase();
  return EVENT_CODE_PATTERN.test(code) ? code : "";
}

export function parseEventCodeList(value, maxCodes = 12) {
  const raw = Array.isArray(value) ? value.join(",") : String(value || "");
  const seen = new Set();
  const codes = [];

  raw
    .split(",")
    .map(normalizeEventCode)
    .filter(Boolean)
    .forEach((code) => {
      if (seen.has(code) || codes.length >= maxCodes) return;
      seen.add(code);
      codes.push(code);
    });

  return codes;
}

export function extractEventCodes(payload, maxCodes = 12) {
  const seen = new Set();
  const codes = [];

  function add(value) {
    const code = normalizeEventCode(value);
    if (!code || seen.has(code) || codes.length >= maxCodes) return;
    seen.add(code);
    codes.push(code);
  }

  function walk(node) {
    if (codes.length >= maxCodes || node === null || node === undefined) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node !== "object") return;

    for (const key of EVENT_CODE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        add(node[key]);
      }
    }

    Object.values(node).forEach((value) => {
      if (value && typeof value === "object") walk(value);
    });
  }

  walk(payload?.data ?? payload);
  return codes;
}
