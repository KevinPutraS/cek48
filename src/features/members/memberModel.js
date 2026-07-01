import {
  buildMemberSocialUrl,
  normalizeSocialAccount,
} from "../../services/externalLinks";
import { ALL_MEMBER_TYPES, normalizeMemberType } from "../../services/memberDirectory";

export const ALL_TYPES = ALL_MEMBER_TYPES;

export const TEAM_ACCENTS = {
  LOVE: "#ff5b87",
  DREAM: "#53dff3",
  PASSION: "#ffad4d",
  TRAINEE: "#d98bff",
  JKT48_VIRTUAL: "#7594ff",
};

export const MEMBER_BIRTHDAY_CACHE_KEY = "cek48.member-birthdays.v1";
export const MEMBER_BIRTHDAY_CACHE_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export const BIRTHDAY_SYNC_CONCURRENCY = 6;

export function normalizeText(value = "") {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== "",
  );
}

export function formatMemberType(value = "") {
  const normalized = normalizeMemberType(value);
  if (!normalized) return "JKT48";
  if (normalized === "TRAINEE") return "Trainee";
  if (normalized === "JKT48_VIRTUAL") return "JKT48 Virtual";

  const label = normalized
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `Team ${label}`;
}

export function getTeamAccent(value = "") {
  return TEAM_ACCENTS[normalizeMemberType(value)] || "#8f7dff";
}

export function getPhotoUrl(photo) {
  const normalized = String(photo || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("/api/jkt48-image?")) return normalized;
  return `/api/jkt48-image?url=${encodeURIComponent(normalized)}`;
}

export function hasMemberId(member) {
  const value = String(member?.id ?? "").trim();
  return /^[1-9]\d{0,5}$/.test(value);
}

export function slugify(value = "") {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeMember(member) {
  const gallery = [member.photo_1, member.photo_2, member.photo_3, member.photo]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);

  return {
    type: normalizeMemberType(member.type),
    code: String(member.code || "").trim(),
    name: String(member.name || "").trim(),
    nickname: String(member.nickname || "").trim(),
    photo: String(
      firstValue(member.photo_1, member.photo, member.photo_2) || "",
    ).trim(),
    id: member.jkt48_member_id ?? member.id ?? null,
    birthday: String(
      firstValue(
        member.birthday,
        member.birth_date,
        member.birthdate,
        member.birth_day,
        member.birthday_date,
        member.date_birth,
        member.date_of_birth,
        member.tanggal_lahir,
        member.tanggalLahir,
      ) || "",
    ).trim(),
    birthPlace: String(
      firstValue(member.birth_place, member.birthPlace, member.tempat_lahir) || "",
    ).trim(),
    height: String(
      firstValue(member.height, member.body_height, member.tinggi) || "",
    ).trim(),
    bloodType: String(
      firstValue(
        member.blood_type,
        member.bloodType,
        member.blood,
        member.golongan_darah,
      ) || "",
    ).trim(),
    horoscope: String(
      firstValue(member.horoscope, member.zodiac, member.zodiak) || "",
    ).trim(),
    twitterAccount: String(member.twitter_account || member.twitter || "").trim(),
    instagramAccount: String(member.instagram_account || member.instagram || "").trim(),
    tiktokAccount: String(member.tiktok_account || member.tiktok || "").trim(),
    youtubeProfileMovie: String(
      member.youtube_profile_movie || member.youtube || "",
    ).trim(),
    gallery,
  };
}

export function getMemberIdentity(member) {
  const code = String(member?.code || "")
    .trim()
    .toUpperCase();
  if (code) return `code:${code}`;
  if (hasMemberId(member)) return `id:${String(member.id).trim()}`;
  return `name:${normalizeText(member?.name)}:${normalizeMemberType(member?.type)}`;
}

export function getBirthdayCacheKey(member) {
  if (hasMemberId(member)) return `id:${String(member.id).trim()}`;

  const code = String(member?.code || "")
    .trim()
    .toUpperCase();
  if (code) return `code:${code}`;

  return getMemberIdentity(member);
}

export function readBirthdayCache() {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(MEMBER_BIRTHDAY_CACHE_KEY) || "{}",
    );
    const updatedAt = Number(parsed?.updatedAt || 0);

    if (
      !updatedAt ||
      Date.now() - updatedAt > MEMBER_BIRTHDAY_CACHE_MAX_AGE ||
      !parsed?.birthdays ||
      typeof parsed.birthdays !== "object"
    ) {
      return {};
    }

    return parsed.birthdays;
  } catch {
    return {};
  }
}

export function writeBirthdayCache(entries) {
  if (typeof window === "undefined" || !entries?.size) return;

  try {
    const birthdays = { ...readBirthdayCache() };
    entries.forEach((birthday, key) => {
      if (birthday) birthdays[key] = birthday;
    });

    window.localStorage.setItem(
      MEMBER_BIRTHDAY_CACHE_KEY,
      JSON.stringify({ updatedAt: Date.now(), birthdays }),
    );
  } catch {
    // Cache hanya optimasi. Tracker tetap berjalan saat storage diblokir.
  }
}

export function applyBirthdayCache(members) {
  const birthdays = readBirthdayCache();

  return members.map((member) => {
    if (member.birthday) return member;

    const cachedBirthday = birthdays[getBirthdayCacheKey(member)];
    return cachedBirthday ? { ...member, birthday: cachedBirthday } : member;
  });
}

export function getMemberRouteKey(member) {
  const code = String(member?.code || "").trim();
  if (code) return `code:${code}`;
  if (hasMemberId(member)) return `id:${String(member.id).trim()}`;

  const nameSlug = slugify(member?.name);
  if (!nameSlug) return "";
  return `name:${nameSlug}:${normalizeMemberType(member?.type)}`;
}

export function memberMatchesRoute(member, routeKey) {
  const normalizedRouteKey = String(routeKey || "").trim();
  if (!normalizedRouteKey) return false;

  const memberCode = String(member?.code || "").trim();
  const memberId = hasMemberId(member) ? String(member.id).trim() : "";

  if (normalizedRouteKey.startsWith("code:")) {
    const routeCode = normalizedRouteKey.slice(5);
    return (
      Boolean(memberCode) &&
      memberCode.localeCompare(routeCode, undefined, {
        sensitivity: "base",
      }) === 0
    );
  }

  if (normalizedRouteKey.startsWith("id:")) {
    return Boolean(memberId) && memberId === normalizedRouteKey.slice(3);
  }

  if (normalizedRouteKey.startsWith("name:")) {
    return getMemberRouteKey(member) === normalizedRouteKey;
  }

  // Tetap menerima format URL lama yang memakai code/id tanpa prefix.
  return (
    (Boolean(memberCode) &&
      memberCode.localeCompare(normalizedRouteKey, undefined, {
        sensitivity: "base",
      }) === 0) ||
    (Boolean(memberId) && memberId === normalizedRouteKey)
  );
}

export function mergeDuplicateMember(current, next) {
  const pick = (currentValue, nextValue) =>
    String(currentValue ?? "").trim() !== "" ? currentValue : nextValue;

  return {
    type: pick(current.type, next.type),
    code: pick(current.code, next.code),
    name: pick(current.name, next.name),
    nickname: pick(current.nickname, next.nickname),
    photo: pick(current.photo, next.photo),
    id: hasMemberId(current) ? current.id : next.id,
    birthday: pick(current.birthday, next.birthday),
    birthPlace: pick(current.birthPlace, next.birthPlace),
    height: pick(current.height, next.height),
    bloodType: pick(current.bloodType, next.bloodType),
    horoscope: pick(current.horoscope, next.horoscope),
    twitterAccount: pick(current.twitterAccount, next.twitterAccount),
    instagramAccount: pick(current.instagramAccount, next.instagramAccount),
    tiktokAccount: pick(current.tiktokAccount, next.tiktokAccount),
    youtubeProfileMovie: pick(current.youtubeProfileMovie, next.youtubeProfileMovie),
    gallery: [...new Set([...(current.gallery || []), ...(next.gallery || [])])],
  };
}

export function mergeMemberProfile(baseMember, detailMember) {
  if (!baseMember) return null;
  if (!detailMember) return baseMember;

  const pick = (detailValue, baseValue) =>
    String(detailValue ?? "").trim() !== "" ? detailValue : baseValue;

  return {
    type: pick(detailMember.type, baseMember.type),
    code: pick(detailMember.code, baseMember.code),
    name: pick(detailMember.name, baseMember.name),
    nickname: pick(detailMember.nickname, baseMember.nickname),
    photo: pick(detailMember.photo, baseMember.photo),
    id: hasMemberId(baseMember) ? baseMember.id : detailMember.id,
    birthday: pick(detailMember.birthday, baseMember.birthday),
    birthPlace: pick(detailMember.birthPlace, baseMember.birthPlace),
    height: pick(detailMember.height, baseMember.height),
    bloodType: pick(detailMember.bloodType, baseMember.bloodType),
    horoscope: pick(detailMember.horoscope, baseMember.horoscope),
    twitterAccount: pick(detailMember.twitterAccount, baseMember.twitterAccount),
    instagramAccount: pick(detailMember.instagramAccount, baseMember.instagramAccount),
    tiktokAccount: pick(detailMember.tiktokAccount, baseMember.tiktokAccount),
    youtubeProfileMovie: pick(
      detailMember.youtubeProfileMovie,
      baseMember.youtubeProfileMovie,
    ),
    gallery: [
      ...new Set([...(detailMember.gallery || []), ...(baseMember.gallery || [])]),
    ],
  };
}

export function normalizeMemberList(result) {
  const memberMap = new Map();

  result.forEach((rawMember) => {
    const member = normalizeMember(rawMember || {});
    if (!member.name) return;

    const identity = getMemberIdentity(member);
    const existing = memberMap.get(identity);
    memberMap.set(identity, existing ? mergeDuplicateMember(existing, member) : member);
  });

  return [...memberMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "id", { sensitivity: "base" }),
  );
}

export function formatHeight(value = "") {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return /\d$/.test(normalized) ? `${normalized} cm` : normalized;
}

export function formatBirthday(value = "") {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) {
    const zonedDate = new Date(normalized);

    if (!Number.isNaN(zonedDate.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(zonedDate);
    }
  }

  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return normalized;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return normalized;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getMemberSocialLinks(member) {
  if (!member) return [];

  return [
    {
      id: "twitter",
      label: "X",
      account: normalizeSocialAccount(member.twitterAccount),
      href: buildMemberSocialUrl("twitter", member.twitterAccount),
    },
    {
      id: "instagram",
      label: "Instagram",
      account: normalizeSocialAccount(member.instagramAccount),
      href: buildMemberSocialUrl("instagram", member.instagramAccount),
    },
    {
      id: "tiktok",
      label: "TikTok",
      account: normalizeSocialAccount(member.tiktokAccount),
      href: buildMemberSocialUrl("tiktok", member.tiktokAccount),
    },
    {
      id: "youtube",
      label: "Profile Movie",
      account: "YouTube",
      href: buildMemberSocialUrl("youtube", member.youtubeProfileMovie),
    },
  ].filter((item) => item.href);
}

export function formatUpdatedTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "Belum diperbarui";
  }

  return `Diperbarui ${new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value)}`;
}
