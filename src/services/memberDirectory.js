export const ALL_MEMBER_TYPES = "ALL";

export function normalizeMemberType(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.startsWith("TEAM_") ? normalized.slice(5) : normalized;
}

export function resolveMemberTypeFilter(value) {
  return normalizeMemberType(value) || ALL_MEMBER_TYPES;
}
