import { useEffect, useState } from "react";

export default function OfflineNotice() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <output className="offline-notice" aria-live="polite">
      <span aria-hidden="true" />
      Koneksi internet terputus. CEK48 belum dapat memperbarui data.
    </output>
  );
}
