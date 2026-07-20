import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getOfficialMemberProfileUrl } from "../../services/externalLinks";
import useFavoriteMembers from "../../hooks/useFavoriteMembers";
import { getUpcomingBirthdays } from "../../services/memberBirthdays";
import {
  normalizeMemberType,
  resolveMemberTypeFilter,
} from "../../services/memberDirectory";
import {
  ALL_TYPES,
  BIRTHDAY_SYNC_CONCURRENCY,
  applyBirthdayCache,
  formatMemberType,
  getBirthdayCacheKey,
  getMemberRouteKey,
  getMemberSocialLinks,
  hasMemberId,
  memberMatchesRoute,
  mergeMemberProfile,
  normalizeMember,
  normalizeMemberList,
  normalizeText,
  writeBirthdayCache,
} from "./memberModel";

export default function useMembersDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [directoryTab, setDirectoryTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [birthdaySync, setBirthdaySync] = useState({
    loading: false,
    completed: 0,
    total: 0,
    failed: 0,
  });
  const {
    isFavorite,
    toggleFavorite: updateFavorite,
    reconcileFavorites,
  } = useFavoriteMembers();

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const detailRequestRef = useRef({ id: 0, controller: null });
  const birthdayRequestRef = useRef({ id: 0, controller: null });
  const profileSheetRef = useRef(null);
  const profileCloseRef = useRef(null);
  const previousFocusRef = useRef(null);

  const selectedCode = String(searchParams.get("member") || "").trim();
  const selectedType = resolveMemberTypeFilter(searchParams.get("type"));

  const hydrateMemberBirthdays = useCallback(async (memberList) => {
    birthdayRequestRef.current.controller?.abort();

    const candidates = memberList.filter(
      (member) => !member.birthday && hasMemberId(member),
    );

    if (!candidates.length) {
      setBirthdaySync({ loading: false, completed: 0, total: 0, failed: 0 });
      return;
    }

    const requestId = birthdayRequestRef.current.id + 1;
    const controller = new AbortController();
    birthdayRequestRef.current = { id: requestId, controller };

    setBirthdaySync({
      loading: true,
      completed: 0,
      total: candidates.length,
      failed: 0,
    });

    let cursor = 0;
    let completed = 0;
    let failed = 0;
    const allResolvedBirthdays = new Map();
    const pendingBirthdays = new Map();

    const flushBirthdayBatch = () => {
      if (!pendingBirthdays.size) return;

      const batch = new Map(pendingBirthdays);
      pendingBirthdays.clear();

      setMembers((currentMembers) =>
        currentMembers.map((currentMember) => {
          const birthday = batch.get(getBirthdayCacheKey(currentMember));
          return birthday ? { ...currentMember, birthday } : currentMember;
        }),
      );
    };

    async function worker() {
      while (cursor < candidates.length && !controller.signal.aborted) {
        const candidateIndex = cursor;
        cursor += 1;
        const member = candidates[candidateIndex];

        try {
          const response = await fetch(
            `/api/jkt48-member-detail?id=${encodeURIComponent(member.id)}`,
            {
              headers: { Accept: "application/json" },
              cache: "force-cache",
              signal: controller.signal,
            },
          );

          const payload = await response.json();
          if (!response.ok || payload?.status === false || !payload?.data) {
            throw new Error(payload?.message || "Tanggal lahir gagal dimuat.");
          }

          const detail = normalizeMember({
            ...payload.data,
            jkt48_member_id: member.id,
          });

          if (detail.birthday) {
            const cacheKey = getBirthdayCacheKey(member);
            allResolvedBirthdays.set(cacheKey, detail.birthday);
            pendingBirthdays.set(cacheKey, detail.birthday);
          } else {
            failed += 1;
          }
        } catch (syncError) {
          if (syncError?.name === "AbortError") return;
          failed += 1;
        } finally {
          if (!controller.signal.aborted) {
            completed += 1;

            if (pendingBirthdays.size >= BIRTHDAY_SYNC_CONCURRENCY) {
              flushBirthdayBatch();
            }

            if (birthdayRequestRef.current.id === requestId) {
              setBirthdaySync({
                loading: completed < candidates.length,
                completed,
                total: candidates.length,
                failed,
              });
            }
          }
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(BIRTHDAY_SYNC_CONCURRENCY, candidates.length) },
        () => worker(),
      ),
    );

    if (birthdayRequestRef.current.id !== requestId || controller.signal.aborted) {
      return;
    }

    flushBirthdayBatch();
    writeBirthdayCache(allResolvedBirthdays);
    birthdayRequestRef.current = { id: requestId, controller: null };
    setBirthdaySync({
      loading: false,
      completed,
      total: candidates.length,
      failed,
    });
  }, []);

  const loadMembers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      // 1. CEK CACHE: Gunakan data di Session Storage jika umurnya belum 5 menit
      const cacheKey = "jkt48_members_list";
      const cachedData = sessionStorage.getItem(cacheKey);

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isCacheValid = (Date.now() - timestamp) < 300000; // 300.000 ms = 5 menit

        if (isCacheValid) {
          const normalizedMembers = applyBirthdayCache(normalizeMemberList(data));
          if (requestId !== requestIdRef.current) return;
          
          setMembers(normalizedMembers);
          setLastUpdated(new Date(timestamp)); // Tampilkan waktu terakhir kali di-fetch
          void hydrateMemberBirthdays(normalizedMembers);
          setLoading(false);
          return; // STOP: Jangan lanjut fetch ke server
        }
      }

      // 2. FETCH SERVER: Jika cache kosong atau sudah lewat 5 menit
      const response = await fetch("/api/jkt48-members", {
        headers: { Accept: "application/json" },
        cache: "no-store", // Tetap no-store agar browser tidak ikut campur, kita kontrol manual via sessionStorage
        signal: controller.signal,
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error("Respons API member bukan JSON.");
      }

      if (!response.ok || payload?.status === false) {
        throw new Error(
          payload?.message || payload?.error || "Data member gagal dimuat.",
        );
      }

      const result =
        payload?.data?.members ?? payload?.data ?? payload?.members ?? payload;

      if (!Array.isArray(result)) {
        throw new Error("Format data member tidak dikenali.");
      }

      // 3. SIMPAN CACHE: Simpan hasil fetch segar ke Session Storage
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));

      if (requestId !== requestIdRef.current) return;

      const normalizedMembers = applyBirthdayCache(normalizeMemberList(result));
      setMembers(normalizedMembers);
      setLastUpdated(new Date());
      void hydrateMemberBirthdays(normalizedMembers);
    } catch (loadError) {
      if (loadError?.name === "AbortError" || requestId !== requestIdRef.current) {
        return;
      }

      setError(loadError.message || "Data member gagal dimuat.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [hydrateMemberBirthdays]);

  const loadMemberDetail = useCallback(async (memberId, birthdayCacheKey = "") => {
    detailRequestRef.current.controller?.abort();

    const requestId = detailRequestRef.current.id + 1;
    const controller = new AbortController();
    detailRequestRef.current = { id: requestId, controller };

    setMemberDetail(null);
    setDetailError("");

    const normalizedMemberId = String(memberId ?? "").trim();
    if (!/^[1-9]\d{0,5}$/.test(normalizedMemberId)) {
      setDetailLoading(false);
      detailRequestRef.current = { id: requestId, controller: null };
      return;
    }

    setDetailLoading(true);

    try {
      const response = await fetch(
        `/api/jkt48-member-detail?id=${encodeURIComponent(normalizedMemberId)}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        },
      );

      let payload;

      try {
        payload = await response.json();
      } catch {
        throw new Error("Respons detail member bukan JSON.");
      }

      if (!response.ok || payload?.status === false) {
        throw new Error(
          payload?.message || payload?.error || "Detail member gagal dimuat.",
        );
      }

      if (!payload?.data || typeof payload.data !== "object") {
        throw new Error("Format detail member tidak dikenali.");
      }

      if (detailRequestRef.current.id !== requestId) return;

      const normalizedDetail = normalizeMember({
        ...payload.data,
        jkt48_member_id: normalizedMemberId,
      });

      setMemberDetail(normalizedDetail);

      if (normalizedDetail.birthday) {
        const cacheKey = birthdayCacheKey || `id:${normalizedMemberId}`;
        writeBirthdayCache(new Map([[cacheKey, normalizedDetail.birthday]]));
        setMembers((currentMembers) =>
          currentMembers.map((currentMember) => {
            if (getBirthdayCacheKey(currentMember) !== cacheKey) {
              return currentMember;
            }

            // Jangan membuat objek member baru bila nilainya tidak berubah.
            // Ini mencegah effect detail menganggap profil yang sama sebagai pilihan baru.
            return currentMember.birthday === normalizedDetail.birthday
              ? currentMember
              : { ...currentMember, birthday: normalizedDetail.birthday };
          }),
        );
      }
    } catch (loadError) {
      if (
        loadError?.name === "AbortError" ||
        detailRequestRef.current.id !== requestId
      ) {
        return;
      }

      setDetailError(
        loadError instanceof Error ? loadError.message : "Detail member gagal dimuat.",
      );
    } finally {
      if (detailRequestRef.current.id === requestId) {
        setDetailLoading(false);
        detailRequestRef.current.controller = null;
      }
    }
  }, []);

  const changeType = useCallback(
    (type) => {
      const normalizedType = normalizeMemberType(type) || ALL_TYPES;
      const next = new URLSearchParams(searchParams);

      if (normalizedType === ALL_TYPES) next.delete("type");
      else next.set("type", normalizedType);

      next.delete("member");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openMember = useCallback(
    (member) => {
      const routeKey = getMemberRouteKey(member);
      if (!routeKey) return;

      setMemberDetail(null);
      setDetailError("");
      setDetailLoading(hasMemberId(member));

      const next = new URLSearchParams(searchParams);
      next.set("member", routeKey);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const closeMember = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("member");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const toggleFavorite = useCallback(
    (member, event) => {
      event?.stopPropagation();
      updateFavorite(member);
    },
    [updateFavorite],
  );

  useEffect(() => {
    loadMembers();

    return () => {
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
      birthdayRequestRef.current.controller?.abort();
      birthdayRequestRef.current = {
        id: birthdayRequestRef.current.id + 1,
        controller: null,
      };
    };
  }, [loadMembers]);

  const typeOptions = useMemo(() => {
    const types = [
      ...new Set(members.map((member) => member.type).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));

    return [ALL_TYPES, ...types];
  }, [members]);

  useEffect(() => {
    if ((loading || error) && members.length === 0) return;
    if (selectedType === ALL_TYPES) return;
    if (typeOptions.includes(selectedType)) return;

    const next = new URLSearchParams(searchParams);
    next.delete("type");
    setSearchParams(next, { replace: true });
  }, [
    error,
    loading,
    members.length,
    searchParams,
    selectedType,
    setSearchParams,
    typeOptions,
  ]);

  useEffect(() => {
    if (members.length) reconcileFavorites(members);
  }, [members, reconcileFavorites]);

  const validFavoriteCount = useMemo(
    () => members.filter((member) => isFavorite(member)).length,
    [isFavorite, members],
  );

  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(members), [members]);

  const filteredMembers = useMemo(() => {
    const keyword = normalizeText(search);
    const result = members.filter((member) => {
      const matchesTab = directoryTab === "all" || isFavorite(member);
      const matchesType = selectedType === ALL_TYPES || member.type === selectedType;
      const searchable = normalizeText(
        [
          member.name,
          member.nickname,
          member.code,
          member.type,
          formatMemberType(member.type),
        ].join(" "),
      );

      return matchesTab && matchesType && (!keyword || searchable.includes(keyword));
    });

    return [...result].sort((a, b) => {
      const favoriteDifference = Number(isFavorite(b)) - Number(isFavorite(a));
      if (favoriteDifference) return favoriteDifference;
      return a.name.localeCompare(b.name, "id", { sensitivity: "base" });
    });
  }, [directoryTab, isFavorite, members, search, selectedType]);

  const selectedMember = useMemo(
    () => members.find((member) => memberMatchesRoute(member, selectedCode)) || null,
    [members, selectedCode],
  );

  // Gunakan nilai primitif yang stabil sebagai pemicu fetch detail.
  // Sinkronisasi ulang tahun dapat mengganti objek di array members, tetapi tidak
  // boleh membuat detail profil yang sama di-fetch berulang kali.
  const selectedMemberId = hasMemberId(selectedMember)
    ? String(selectedMember.id).trim()
    : "";
  const selectedMemberBirthdayCacheKey = selectedMember
    ? getBirthdayCacheKey(selectedMember)
    : "";
  const hasSelectedMember = Boolean(selectedMember);

  useEffect(() => {
    if ((loading || error) && members.length === 0) return;
    if (!selectedCode || selectedMember) return;

    const next = new URLSearchParams(searchParams);
    next.delete("member");
    setSearchParams(next, { replace: true });
  }, [
    error,
    loading,
    members.length,
    searchParams,
    selectedCode,
    selectedMember,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!hasSelectedMember) {
      detailRequestRef.current.controller?.abort();
      detailRequestRef.current = {
        id: detailRequestRef.current.id + 1,
        controller: null,
      };
      setMemberDetail(null);
      setDetailError("");
      setDetailLoading(false);
      return undefined;
    }

    loadMemberDetail(selectedMemberId, selectedMemberBirthdayCacheKey);

    return () => {
      detailRequestRef.current.controller?.abort();
    };
  }, [
    loadMemberDetail,
    hasSelectedMember,
    selectedMemberBirthdayCacheKey,
    selectedMemberId,
  ]);

  useEffect(() => {
    if (!hasSelectedMember) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      profileCloseRef.current?.focus();
    });

    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMember();
        return;
      }

      if (event.key !== "Tab" || !profileSheetRef.current) return;

      const focusableElements = [
        ...profileSheetRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];

      if (!focusableElements.length) {
        event.preventDefault();
        profileSheetRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);

      const previousFocus = previousFocusRef.current;
      if (previousFocus && typeof previousFocus.focus === "function") {
        window.requestAnimationFrame(() => previousFocus.focus());
      }
    };
  }, [closeMember, hasSelectedMember, selectedCode]);

  const teamSummary = useMemo(() => {
    const counts = new Map();

    members.forEach((member) => {
      if (!member.type) return;
      counts.set(member.type, (counts.get(member.type) || 0) + 1);
    });

    return counts;
  }, [members]);

  const emptyStateCopy = useMemo(() => {
    if (directoryTab !== "favorites") {
      return "Coba nama lain atau pilih filter tim yang berbeda.";
    }

    if (validFavoriteCount === 0) {
      return "Belum ada member favorit. Tekan ikon bintang pada card member.";
    }

    return "Tidak ada member favorit yang cocok dengan pencarian atau filter tim ini.";
  }, [directoryTab, validFavoriteCount]);

  const selectedTypeLabel =
    selectedType === ALL_TYPES ? "Semua tim" : formatMemberType(selectedType);

  const hasActiveFilters =
    Boolean(search.trim()) || directoryTab !== "all" || selectedType !== ALL_TYPES;

  const resetDirectory = useCallback(() => {
    setSearch("");
    setDirectoryTab("all");
    changeType(ALL_TYPES);
  }, [changeType]);

  const profileMember = useMemo(
    () => mergeMemberProfile(selectedMember, memberDetail),
    [memberDetail, selectedMember],
  );

  const profileSocialLinks = useMemo(
    () => getMemberSocialLinks(profileMember),
    [profileMember],
  );

  const officialProfileUrl = getOfficialMemberProfileUrl(profileMember);

  return {
    birthdaySync,
    changeType,
    closeMember,
    detailError,
    detailLoading,
    directoryTab,
    emptyStateCopy,
    error,
    filteredMembers,
    hasActiveFilters,
    isFavorite,
    lastUpdated,
    loadMemberDetail,
    loadMembers,
    loading,
    memberDetail,
    members,
    officialProfileUrl,
    openMember,
    profileCloseRef,
    profileMember,
    profileSheetRef,
    profileSocialLinks,
    resetDirectory,
    search,
    selectedMemberBirthdayCacheKey,
    selectedMemberId,
    selectedType,
    selectedTypeLabel,
    setDirectoryTab,
    setSearch,
    teamSummary,
    toggleFavorite,
    typeOptions,
    upcomingBirthdays,
    validFavoriteCount,
  };
}
