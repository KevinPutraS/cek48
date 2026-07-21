import { useEffect, useState } from "react";
import { getPhotoUrl } from "./memberModel";

export function MemberPhoto({ member, hero = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [member.photo]);

  const initials = String(member.nickname || member.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const photoUrl = getPhotoUrl(member.photo);

  return (
    <div className={hero ? "nx-member-photo nx-member-photo--hero" : "nx-member-photo"}>
      {photoUrl && !failed ? (
        <img
          src={photoUrl}
          alt={`Foto ${member.name}`}
          loading={hero ? "eager" : "lazy"}
          decoding="async"
          width={hero ? 720 : 320}
          height={hero ? 900 : 336}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}

export function ProfileStat({ label, value }) {
  return (
    <div className="nx-profile-stat">
      <span>{label}</span>
      <strong>{value || "Belum tersedia"}</strong>
    </div>
  );
}
