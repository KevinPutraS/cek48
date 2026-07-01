export const FAVORITES_KEY = "cek48:favorite-members";
export const FAVORITE_PROFILES_KEY = "cek48:favorite-member-profiles-v1";
const MEMBER_PROFILE_CACHE_KEY = "cek48-member-profiles-v1";

export function normalizeFavoriteToken(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function compactFavoriteProfile(member = {}) {
  const code = String(member.code ?? member.memberCode ?? "").trim();
  const id = member.id ?? member.memberId ?? member.jkt48_member_id ?? null;
  const name = String(member.name ?? member.member ?? member.member_name ?? "").trim();
  const nickname = String(member.nickname ?? member.alias ?? "").trim();
  const type = String(member.type ?? member.team ?? "").trim();
  const photo = String(member.photo ?? member.avatar ?? "").trim();
  const key = String(code || id || name || nickname).trim();

  return { key, code, id, name, nickname, type, photo };
}

export function getFavoriteTokens(member = {}) {
  const profile = compactFavoriteProfile(member);

  return [
    ...new Set(
      [
        profile.key,
        profile.code,
        profile.id,
        profile.name,
        profile.nickname,
        member.member,
        member.member_name,
        member.alias,
        member.memberCode,
        member.memberId,
      ]
        .map(normalizeFavoriteToken)
        .filter(Boolean),
    ),
  ];
}

function sanitizeSnapshot(snapshot = {}) {
  const keys = Array.isArray(snapshot.keys)
    ? [...new Set(snapshot.keys.map((key) => String(key).trim()).filter(Boolean))]
    : [];
  const profiles = Array.isArray(snapshot.profiles)
    ? snapshot.profiles.map(compactFavoriteProfile).filter((profile) => profile.key)
    : [];

  const profileMap = new Map();
  profiles.forEach((profile) =>
    profileMap.set(normalizeFavoriteToken(profile.key), profile),
  );

  return { keys, profiles: [...profileMap.values()] };
}

export function readFavoriteSnapshot(storage = globalThis?.localStorage) {
  if (!storage) return { keys: [], profiles: [] };

  try {
    const keys = JSON.parse(storage.getItem(FAVORITES_KEY) || "[]");
    const profiles = JSON.parse(storage.getItem(FAVORITE_PROFILES_KEY) || "[]");
    const cachedMembers = JSON.parse(storage.getItem(MEMBER_PROFILE_CACHE_KEY) || "[]");
    const snapshot = sanitizeSnapshot({ keys, profiles });
    return Array.isArray(cachedMembers) && cachedMembers.length
      ? reconcileFavoriteSnapshot(snapshot, cachedMembers)
      : snapshot;
  } catch {
    return { keys: [], profiles: [] };
  }
}

export function writeFavoriteSnapshot(snapshot, storage = globalThis?.localStorage) {
  const next = sanitizeSnapshot(snapshot);
  if (!storage) return next;

  try {
    storage.setItem(FAVORITES_KEY, JSON.stringify(next.keys));
    storage.setItem(FAVORITE_PROFILES_KEY, JSON.stringify(next.profiles));
  } catch {
    // Favorit tetap berubah di sesi aktif walau storage browser penuh/diblokir.
  }

  return next;
}

function buildSnapshotTokenSet(snapshot) {
  const normalized = sanitizeSnapshot(snapshot);
  const tokens = new Set(normalized.keys.map(normalizeFavoriteToken).filter(Boolean));
  normalized.profiles.forEach((profile) => {
    getFavoriteTokens(profile).forEach((token) => tokens.add(token));
  });
  return tokens;
}

export function isMemberFavorite(member, snapshot) {
  const favoriteTokens = buildSnapshotTokenSet(snapshot);
  return getFavoriteTokens(member).some((token) => favoriteTokens.has(token));
}

export function toggleFavoriteSnapshot(snapshot, member) {
  const current = sanitizeSnapshot(snapshot);
  const memberProfile = compactFavoriteProfile(member);
  const memberTokens = new Set(getFavoriteTokens(member));
  const active = isMemberFavorite(member, current);

  if (!memberProfile.key || memberTokens.size === 0) return current;

  if (active) {
    current.profiles.forEach((profile) => {
      const profileTokens = getFavoriteTokens(profile);
      if (profileTokens.some((token) => memberTokens.has(token))) {
        profileTokens.forEach((token) => memberTokens.add(token));
      }
    });

    return sanitizeSnapshot({
      keys: current.keys.filter(
        (key) => !memberTokens.has(normalizeFavoriteToken(key)),
      ),
      profiles: current.profiles.filter(
        (profile) =>
          !getFavoriteTokens(profile).some((token) => memberTokens.has(token)),
      ),
    });
  }

  const nextProfiles = current.profiles.filter(
    (profile) => !getFavoriteTokens(profile).some((token) => memberTokens.has(token)),
  );

  return sanitizeSnapshot({
    keys: [...current.keys, memberProfile.key],
    profiles: [...nextProfiles, memberProfile],
  });
}

export function reconcileFavoriteSnapshot(snapshot, members = []) {
  const current = sanitizeSnapshot(snapshot);
  if (!Array.isArray(members) || !members.length) return current;

  const memberIndex = members.map((member) => ({
    profile: compactFavoriteProfile(member),
    tokens: new Set(getFavoriteTokens(member)),
  }));
  const matchedMemberIndexes = new Set();
  const unmatchedKeys = [];
  const unmatchedProfiles = [];

  current.keys.forEach((key) => {
    const normalizedKey = normalizeFavoriteToken(key);
    const matchIndex = memberIndex.findIndex(({ tokens }) => tokens.has(normalizedKey));

    if (matchIndex >= 0) matchedMemberIndexes.add(matchIndex);
    else unmatchedKeys.push(key);
  });

  current.profiles.forEach((profile) => {
    const profileTokens = getFavoriteTokens(profile);
    const matchIndex = memberIndex.findIndex(({ tokens }) =>
      profileTokens.some((token) => tokens.has(token)),
    );

    if (matchIndex >= 0) matchedMemberIndexes.add(matchIndex);
    else unmatchedProfiles.push(profile);
  });

  const matchedProfiles = [...matchedMemberIndexes]
    .map((index) => memberIndex[index]?.profile)
    .filter((profile) => profile?.key);

  return sanitizeSnapshot({
    keys: [
      ...unmatchedKeys,
      ...unmatchedProfiles.map((profile) => profile.key),
      ...matchedProfiles.map((profile) => profile.key),
    ],
    profiles: [...unmatchedProfiles, ...matchedProfiles],
  });
}
