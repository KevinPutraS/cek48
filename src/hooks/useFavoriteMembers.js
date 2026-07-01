import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FAVORITES_KEY,
  FAVORITE_PROFILES_KEY,
  isMemberFavorite,
  readFavoriteSnapshot,
  reconcileFavoriteSnapshot,
  toggleFavoriteSnapshot,
  writeFavoriteSnapshot,
} from "../services/favoriteMembers";

export default function useFavoriteMembers() {
  const [snapshot, setSnapshot] = useState(() => readFavoriteSnapshot());
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    function reloadFavorites(event) {
      if (
        event.key &&
        event.key !== FAVORITES_KEY &&
        event.key !== FAVORITE_PROFILES_KEY
      ) {
        return;
      }

      const next = readFavoriteSnapshot();
      snapshotRef.current = next;
      setSnapshot(next);
    }

    window.addEventListener("storage", reloadFavorites);
    return () => window.removeEventListener("storage", reloadFavorites);
  }, []);

  const commit = useCallback((updater) => {
    const next = writeFavoriteSnapshot(updater(snapshotRef.current));
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const isFavorite = useCallback(
    (member) => isMemberFavorite(member, snapshot),
    [snapshot],
  );

  const toggleFavorite = useCallback(
    (member) => commit((current) => toggleFavoriteSnapshot(current, member)),
    [commit],
  );

  const reconcileFavorites = useCallback(
    (members) => commit((current) => reconcileFavoriteSnapshot(current, members)),
    [commit],
  );

  return useMemo(
    () => ({
      favoriteKeys: new Set(snapshot.keys),
      favoriteProfiles: snapshot.profiles,
      favoriteCount: snapshot.keys.length,
      isFavorite,
      toggleFavorite,
      reconcileFavorites,
    }),
    [isFavorite, reconcileFavorites, snapshot, toggleFavorite],
  );
}
