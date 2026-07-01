const SOCIAL_PLATFORMS = {
  twitter: {
    hosts: new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]),
    profileUrl: (account) => `https://x.com/${encodeURIComponent(account)}`,
  },
  instagram: {
    hosts: new Set(["instagram.com", "www.instagram.com"]),
    profileUrl: (account) => `https://instagram.com/${encodeURIComponent(account)}`,
  },
  tiktok: {
    hosts: new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]),
    profileUrl: (account) => `https://www.tiktok.com/@${encodeURIComponent(account)}`,
  },
  youtube: {
    hosts: new Set([
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtu.be",
    ]),
  },
};

function parseHttpsUrl(value, allowedHosts) {
  const text = String(value || "").trim();
  if (!text) return "";

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(text)
    ? text
    : /^(?:www\.|m\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(text)
      ? `https://${text}`
      : "";

  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !allowedHosts.has(hostname)
    ) {
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeSocialAccount(value = "") {
  return String(value ?? "")
    .trim()
    .replace(/^@+/, "");
}

export function buildMemberSocialUrl(platform, account) {
  const config = SOCIAL_PLATFORMS[platform];
  const value = normalizeSocialAccount(account);
  if (!config || !value) return "";

  const absoluteUrl = parseHttpsUrl(value, config.hosts);
  if (absoluteUrl) return absoluteUrl;

  if (platform === "youtube") {
    return /^[A-Za-z0-9_-]{6,}$/.test(value)
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(value)}`
      : "";
  }

  if (!/^[A-Za-z0-9._-]{1,64}$/.test(value)) return "";
  return config.profileUrl(value);
}

function slugify(value = "") {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getOfficialMemberProfileUrl(member) {
  const nameSlug = slugify(member?.name);
  const memberId = String(
    member?.id ?? member?.jkt48_member_id ?? member?.memberId ?? "",
  ).trim();

  if (!nameSlug || !/^[1-9]\d{0,5}$/.test(memberId)) return "";

  const url = new URL("https://jkt48.com/member/detail");
  url.searchParams.set("member", `${nameSlug}-${memberId}`);
  url.searchParams.set("type", String(member?.type || ""));
  return url.toString();
}

export function getOfficialJkt48ScheduleUrl(link = "") {
  const value = String(link || "").trim();
  if (!value) return "";

  let url;

  try {
    if (/^https?:\/\//i.test(value)) {
      url = new URL(value);
    } else if (value.startsWith("/")) {
      url = new URL(value, "https://jkt48.com");
    } else if (value.startsWith("schedule/")) {
      url = new URL(`/${value}`, "https://jkt48.com");
    } else {
      url = new URL(`/schedule/${encodeURIComponent(value)}`, "https://jkt48.com");
    }
  } catch {
    return "";
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !new Set(["jkt48.com", "www.jkt48.com"]).has(url.hostname.toLowerCase())
  ) {
    return "";
  }

  url.hash = "";
  return url.toString();
}
