import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchExclusiveEvents, fetchAllQuotaData } from "../../services/quotaApi";
import useFavoriteMembers from "../../hooks/useFavoriteMembers";
import {
  DEFAULT_DATE,
  DEFAULT_SESSION,
  DEFAULT_SORT,
  DEFAULT_STATUS,
  REFRESH_SECONDS,
  compareSlotDates,
  fetchMemberProfiles,
  formatDateTabLabel,
  getItemDate,
  getJakartaTodayTimestamp,
  getStatus,
  hasOnlyPastDatedSlots,
  isPastSlotDate,
  mergeMemberProfiles,
  normalizeMemberName,
  readUrlFilters,
  reconcileQuotaItems,
  statusLabel,
  syncFiltersToUrl,
} from "./quotaModel";
import { EVENT_CATEGORY_CONFIG, detectEventCategory } from "./QuotaFilters";

const PERSISTENT_QUOTA_CATEGORIES = new Set([
  "DIGITAL_PHOTOBOOK",
  "PHOTOCARD",
  "TWO_SHOT",
]);

export default function useQuotaMonitor() {
  const initialFilters = useMemo(() => readUrlFilters(), []);
  const [items, setItems] = useState([]);
  const [exclusiveEvents, setExclusiveEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedCode, setSelectedCode] = useState(initialFilters.event);
  const [search, setSearch] = useState(initialFilters.search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(initialFilters.date);
  const [sessionFilter, setSessionFilter] = useState(initialFilters.session);
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [sort, setSort] = useState(initialFilters.sort);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState("");
  const [apiNotice, setApiNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favoriteCount, isFavorite, toggleFavorite, reconcileFavorites } =
    useFavoriteMembers();

  const requestIdRef = useRef(0);
  const profilesRef = useRef([]);
  const itemsRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (items.length) reconcileFavorites(items);
  }, [items, reconcileFavorites]);

  useEffect(() => {
    syncFiltersToUrl({
      category: selectedCategory,
      event: selectedCode,
      date: dateFilter,
      session: sessionFilter,
      status: statusFilter,
      search,
      sort,
    });
  }, [
    dateFilter,
    search,
    selectedCategory,
    selectedCode,
    sessionFilter,
    sort,
    statusFilter,
  ]);

  useEffect(() => {
    if (selectedCode) localStorage.setItem("cek48:last-event", selectedCode);
  }, [selectedCode]);

  const selectedEvent = useMemo(
    () => exclusiveEvents.find((event) => event.code === selectedCode) || null,
    [exclusiveEvents, selectedCode],
  );

  useEffect(() => {
    if (!exclusiveEvents.length || !selectedCode) return;

    const eventFromUrl = exclusiveEvents.find((event) => event.code === selectedCode);

    if (!eventFromUrl) {
      setSelectedCode("");
      setDateFilter(DEFAULT_DATE);
      setSessionFilter(DEFAULT_SESSION);
      return;
    }

    const actualCategory = detectEventCategory(eventFromUrl);
    if (selectedCategory !== actualCategory) {
      setSelectedCategory(actualCategory);
    }
  }, [exclusiveEvents, selectedCategory, selectedCode]);

  const categoryOptions = useMemo(() => {
    const categoryOrder = ["DIGITAL_PHOTOBOOK", "PHOTOCARD", "TWO_SHOT", "OTHER"];

    return categoryOrder
      .filter(
        (category) =>
          PERSISTENT_QUOTA_CATEGORIES.has(category) ||
          exclusiveEvents.some((event) => detectEventCategory(event) === category),
      )
      .map((category) => {
        const config = EVENT_CATEGORY_CONFIG[category];
        const eventCount = exclusiveEvents.filter(
          (event) => detectEventCategory(event) === category,
        ).length;

        return {
          value: category,
          label: config.label,
          count: eventCount,
          description: eventCount
            ? `${eventCount} event aktif · ${config.description}`
            : `Belum ada event aktif · ${config.description}`,
        };
      });
  }, [exclusiveEvents]);

  const filteredEventOptions = useMemo(() => {
    if (!selectedCategory) return [];

    return exclusiveEvents
      .filter((event) => detectEventCategory(event) === selectedCategory)
      .map((event) => ({
        value: event.code,
        label: event.title,
        description: `${event.code} · ${event.date || "Tanggal belum tersedia"}`,
      }));
  }, [exclusiveEvents, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) return;

    if (filteredEventOptions.length === 1) {
      const onlyEventCode = filteredEventOptions[0].value;

      if (selectedCode !== onlyEventCode) {
        setSelectedCode(onlyEventCode);
      }

      return;
    }

    const selectedCodeStillValid = filteredEventOptions.some(
      (option) => option.value === selectedCode,
    );

    if (selectedCode && !selectedCodeStillValid) {
      setSelectedCode("");
    }
  }, [filteredEventOptions, selectedCategory, selectedCode]);

  const resetResultFilters = useCallback((closeMobile = false) => {
    setSearch("");
    setDateFilter(DEFAULT_DATE);
    setSessionFilter(DEFAULT_SESSION);
    setStatusFilter(DEFAULT_STATUS);
    setSort(DEFAULT_SORT);
    setFavoritesOnly(false);
    if (closeMobile) setMobileFiltersOpen(false);
  }, []);

  const loadInitialData = useCallback(async (showLoader = true) => {
    const requestId = ++requestIdRef.current;

    if (showLoader) setIsRefreshing(true);
    setError("");
    setApiNotice("");

    try {
      const [eventList, profileResult] = await Promise.all([
        fetchExclusiveEvents(),
        fetchMemberProfiles()
          .then((profiles) => ({ profiles, error: "" }))
          .catch((profileError) => ({
            profiles: [],
            error: profileError.message || "Profil member gagal dimuat.",
          })),
      ]);

      if (requestId !== requestIdRef.current) return;

      let visibleEventList = eventList;
      const quotaEvents = eventList.filter((event) =>
        PERSISTENT_QUOTA_CATEGORIES.has(detectEventCategory(event)),
      );

      if (quotaEvents.length) {
        try {
          const stockResult = await fetchAllQuotaData(quotaEvents);
          if (requestId !== requestIdRef.current) return;

          const failedCodes = new Set(
            stockResult.failures.map((failure) => failure.code),
          );
          const todayTimestamp = getJakartaTodayTimestamp();

          visibleEventList = eventList.filter((event) => {
            if (!PERSISTENT_QUOTA_CATEGORIES.has(detectEventCategory(event))) {
              return true;
            }
            if (failedCodes.has(event.code)) return true;

            const eventItems = stockResult.items.filter(
              (item) => item.eventCode === event.code,
            );

            return !hasOnlyPastDatedSlots(eventItems, todayTimestamp);
          });
        } catch (stockError) {
          console.warn(
            "Status tanggal event kuota belum dapat diverifikasi:",
            stockError,
          );
        }
      }

      if (requestId !== requestIdRef.current) return;

      setExclusiveEvents(visibleEventList);
      profilesRef.current = profileResult.profiles;

      if (profileResult.error) {
        console.warn("Foto member belum dimuat:", profileResult.error);
      }
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setExclusiveEvents([]);
      setItems([]);
      setError(loadError.message || "Gagal mengambil daftar event JKT48.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  const loadSelectedEventStock = useCallback(
    async (event, preservePrevious = false) => {
      if (!event?.code) {
        setItems([]);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsRefreshing(true);
      setError("");
      setApiNotice("");

      try {
        const stockResult = await fetchAllQuotaData([event]);
        if (requestId !== requestIdRef.current) return;

        let profiles = profilesRef.current;

        if (!profiles.length) {
          try {
            profiles = await fetchMemberProfiles();
            profilesRef.current = profiles;
          } catch (profileError) {
            console.warn("Foto member belum dimuat:", profileError);
          }
        }

        if (requestId !== requestIdRef.current) return;

        const enrichedItems = mergeMemberProfiles(stockResult.items, profiles);
        setItems((currentItems) => reconcileQuotaItems(currentItems, enrichedItems));
        setLastUpdated(new Date());

        const notices = [];

        if (stockResult.failures.length) {
          notices.push(
            stockResult.failures
              .map(
                (failure) =>
                  `${failure.code}: ${failure.error || "stock gagal dibaca"}`,
              )
              .join(", "),
          );
        }

        if (stockResult.emptyEvents.length) {
          notices.push("Event ini belum mengirim slot stock yang dapat dibaca.");
        }

        if (!stockResult.items.length && !notices.length) {
          notices.push("Tidak ada slot member/sesi pada event ini.");
        }

        setApiNotice(notices.join(" · "));
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return;

        const message = loadError.message || "Gagal mengambil stock event.";
        const canPreserve = preservePrevious && itemsRef.current.length > 0;

        if (canPreserve) {
          setApiNotice(`${message} Data sebelumnya tetap ditampilkan.`);
        } else {
          setItems([]);
          setError(message);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadInitialData(true);
  }, [loadInitialData]);

  useEffect(() => {
    if (!selectedEvent) {
      setItems([]);
      setApiNotice("");
      setError("");
      return;
    }

    loadSelectedEventStock(selectedEvent, false);
  }, [selectedEvent, loadSelectedEventStock]);

  useEffect(() => {
    if (!selectedEvent || isRefreshing || !lastUpdated) return undefined;

    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        loadSelectedEventStock(selectedEvent, true);
      }
    }, REFRESH_SECONDS * 1000);

    return () => window.clearTimeout(timer);
  }, [isRefreshing, lastUpdated, loadSelectedEventStock, selectedEvent]);

  const handleCategoryChange = useCallback(
    (category) => {
      requestIdRef.current += 1;
      setSelectedCategory(category);
      setSelectedCode("");
      setItems([]);
      setError("");
      setApiNotice("");
      resetResultFilters(false);
    },
    [resetResultFilters],
  );

  const handleEventChange = useCallback(
    (code) => {
      requestIdRef.current += 1;
      setSelectedCode(code);
      setItems([]);
      setError("");
      setApiNotice("");
      resetResultFilters(false);
    },
    [resetResultFilters],
  );

  const handleRefresh = useCallback(() => {
    if (selectedEvent) {
      loadSelectedEventStock(selectedEvent, true);
      return;
    }

    loadInitialData(true);
  }, [loadInitialData, loadSelectedEventStock, selectedEvent]);

  const eventScopedItems = useMemo(() => {
    if (!selectedCode) return [];
    return items.filter((item) => item.eventCode === selectedCode);
  }, [items, selectedCode]);

  const selectedEventCategory = useMemo(
    () => detectEventCategory(selectedEvent),
    [selectedEvent],
  );

  const isVideoCallEvent = selectedEventCategory === "DIGITAL_PHOTOBOOK";
  const isDatedQuotaEvent = PERSISTENT_QUOTA_CATEGORIES.has(selectedEventCategory);
  const jakartaTodayTimestamp = getJakartaTodayTimestamp();

  const currentDateEventItems = useMemo(() => {
    if (!isDatedQuotaEvent) return eventScopedItems;

    return eventScopedItems.filter(
      (item) => !isPastSlotDate(getItemDate(item), jakartaTodayTimestamp),
    );
  }, [eventScopedItems, isDatedQuotaEvent, jakartaTodayTimestamp]);

  const rawDateOptions = useMemo(() => {
    if (!isVideoCallEvent) return [];

    return [...new Set(currentDateEventItems.map(getItemDate).filter(Boolean))].sort(
      compareSlotDates,
    );
  }, [currentDateEventItems, isVideoCallEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      if (dateFilter !== DEFAULT_DATE) {
        setDateFilter(DEFAULT_DATE);
      }

      return;
    }

    if (!isVideoCallEvent) {
      if (dateFilter !== DEFAULT_DATE) {
        setDateFilter(DEFAULT_DATE);
      }

      return;
    }

    if (isRefreshing) return;

    if (dateFilter !== DEFAULT_DATE && !rawDateOptions.includes(dateFilter)) {
      setDateFilter(DEFAULT_DATE);
    }
  }, [dateFilter, isRefreshing, isVideoCallEvent, rawDateOptions, selectedEvent]);

  const dateTabOptions = useMemo(() => {
    const dateOptions = rawDateOptions.map((date) => ({
      value: date,
      label: formatDateTabLabel(date),
      title: date,
      count: currentDateEventItems.filter((item) => getItemDate(item) === date).length,
    }));

    return [
      {
        value: DEFAULT_DATE,
        label: "ALL DATE",
        title: "Tampilkan tanggal hari ini dan yang akan datang",
        count: currentDateEventItems.length,
      },
      ...dateOptions,
    ];
  }, [currentDateEventItems, rawDateOptions]);

  const dateScopedItems = useMemo(() => {
    if (!isDatedQuotaEvent) {
      return eventScopedItems;
    }

    if (!isVideoCallEvent || dateFilter === DEFAULT_DATE) {
      return currentDateEventItems;
    }

    return currentDateEventItems.filter((item) => getItemDate(item) === dateFilter);
  }, [
    currentDateEventItems,
    dateFilter,
    eventScopedItems,
    isDatedQuotaEvent,
    isVideoCallEvent,
  ]);

  const rawSessionOptions = useMemo(() => {
    const sessions = [
      ...new Set(dateScopedItems.map((item) => item.session).filter(Boolean)),
    ];

    return sessions.sort((a, b) =>
      a.localeCompare(b, "id", {
        numeric: true,
      }),
    );
  }, [dateScopedItems]);

  const sessionTabOptions = useMemo(() => {
    const options = rawSessionOptions.map((session) => ({
      value: session,
      label: session,
      count: dateScopedItems.filter((item) => item.session === session).length,
    }));

    return [
      {
        value: DEFAULT_SESSION,
        label: "Semua",
        count: dateScopedItems.length,
      },
      ...options,
    ];
  }, [dateScopedItems, rawSessionOptions]);

  const handleDateChange = useCallback((date) => {
    setDateFilter(date);
    setSessionFilter(DEFAULT_SESSION);
  }, []);

  useEffect(() => {
    if (!selectedEvent || isRefreshing || !dateScopedItems.length) return;

    if (
      sessionFilter !== DEFAULT_SESSION &&
      !rawSessionOptions.includes(sessionFilter)
    ) {
      setSessionFilter(DEFAULT_SESSION);
    }
  }, [
    dateScopedItems.length,
    isRefreshing,
    rawSessionOptions,
    selectedEvent,
    sessionFilter,
  ]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = dateScopedItems.filter((item) => {
      const searchable = [
        item.member,
        item.alias,
        item.team,
        item.session,
        item.date,
        item.event,
        item.eventCode,
        item.lane,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesSession =
        sessionFilter === DEFAULT_SESSION || item.session === sessionFilter;
      const matchesStatus =
        statusFilter === DEFAULT_STATUS ||
        statusLabel(getStatus(item)) === statusFilter;
      const matchesFavorite = !favoritesOnly || isFavorite(item);

      return matchesSearch && matchesSession && matchesStatus && matchesFavorite;
    });

    return [...result].sort((a, b) => {
      const favoriteDifference = Number(isFavorite(b)) - Number(isFavorite(a));
      if (favoriteDifference) return favoriteDifference;

      const aQuota = Number.isFinite(a.remaining) ? a.remaining : -1;
      const bQuota = Number.isFinite(b.remaining) ? b.remaining : -1;

      if (sort === "Kuota Tersedikit") {
        return (
          (aQuota < 0 ? Number.MAX_SAFE_INTEGER : aQuota) -
          (bQuota < 0 ? Number.MAX_SAFE_INTEGER : bQuota)
        );
      }

      if (sort === "Nama A–Z") {
        return a.member.localeCompare(b.member, "id");
      }

      return bQuota - aQuota;
    });
  }, [
    dateScopedItems,
    favoritesOnly,
    isFavorite,
    search,
    sessionFilter,
    sort,
    statusFilter,
  ]);

  const favoriteEventCount = useMemo(
    () =>
      new Set(
        eventScopedItems
          .filter((item) => isFavorite(item))
          .map((item) =>
            String(
              item.memberCode || item.memberId || normalizeMemberName(item.member),
            ),
          ),
      ).size,
    [eventScopedItems, isFavorite],
  );

  const summaryItems = useMemo(() => {
    if (sessionFilter === DEFAULT_SESSION) return dateScopedItems;
    return dateScopedItems.filter((item) => item.session === sessionFilter);
  }, [dateScopedItems, sessionFilter]);

  const summary = useMemo(() => {
    return summaryItems.reduce(
      (accumulator, item) => {
        const status = getStatus(item);
        accumulator[status] += 1;

        if (Number.isFinite(item.remaining)) {
          accumulator.remaining += item.remaining;
          accumulator.known += 1;
        }

        if (Number.isFinite(item.total)) {
          accumulator.total += item.total;
        }

        return accumulator;
      },
      {
        total: 0,
        remaining: 0,
        known: 0,
        available: 0,
        low: 0,
        sold: 0,
        unknown: 0,
      },
    );
  }, [summaryItems]);

  const connectionStatus = useMemo(() => {
    const statusMessage = `${error} ${apiNotice}`.toLowerCase();
    const waitingForUpstream = /waiting room|ruang tunggu|antrean|antrian|\b429\b/.test(
      statusMessage,
    );

    if (isRefreshing && !lastUpdated) return "CONNECTING";
    if (waitingForUpstream) return "WAITING";
    if (error) return "OFFLINE";
    if (apiNotice) return "WAITING";
    if (lastUpdated) return "LIVE";
    if (categoryOptions.length) return "WAITING";
    return isRefreshing ? "CONNECTING" : "OFFLINE";
  }, [apiNotice, categoryOptions.length, error, isRefreshing, lastUpdated]);

  const controlsDisabled = !selectedEvent || isRefreshing;

  return {
    apiNotice,
    categoryOptions,
    connectionStatus,
    controlsDisabled,
    dateFilter,
    dateScopedItems,
    dateTabOptions,
    error,
    eventScopedItems,
    exclusiveEvents,
    favoriteCount,
    favoriteEventCount,
    favoritesOnly,
    filteredEventOptions,
    filteredItems,
    handleCategoryChange,
    handleDateChange,
    handleEventChange,
    handleRefresh,
    isFavorite,
    isRefreshing,
    isVideoCallEvent,
    items,
    lastUpdated,
    loadInitialData,
    loadSelectedEventStock,
    mobileFiltersOpen,
    resetResultFilters,
    search,
    selectedCategory,
    selectedCode,
    selectedEvent,
    sessionFilter,
    sessionTabOptions,
    setDateFilter,
    setFavoritesOnly,
    setMobileFiltersOpen,
    setSearch,
    setSessionFilter,
    setSort,
    setStatusFilter,
    sort,
    summary,
    summaryItems,
    statusFilter,
    toggleFavorite,
  };
}
