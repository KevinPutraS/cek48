import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useFavoriteMembers from "../../hooks/useFavoriteMembers";
import { isExpiredExclusive } from "../../services/scheduleVisibility";
import {
  dedupeSchedules,
  getJakartaNowParts,
  getSetlistPoster,
  isScheduleUpcoming,
  matchesFilter,
  normalizeSchedule,
  normalizeTheaterDetail,
} from "./scheduleModel";

export default function useSchedulePage() {
  const [jakartaNow, setJakartaNow] = useState(getJakartaNowParts);

  const [month, setMonth] = useState(jakartaNow.month);
  const [year, setYear] = useState(jakartaNow.year);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [posterFailed, setPosterFailed] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteMembers();

  const scheduleRequestRef = useRef({ id: 0, controller: null });
  const detailRequestRef = useRef({ id: 0, controller: null });
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const detailTriggerRef = useRef(null);
  const detailOpenFocusFrameRef = useRef(null);
  const detailRestoreFocusFrameRef = useRef(null);

  useEffect(() => {
    function refreshJakartaNow() {
      setJakartaNow(getJakartaNowParts());
    }

    const timer = window.setInterval(refreshJakartaNow, 60 * 1000);
    document.addEventListener("visibilitychange", refreshJakartaNow);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshJakartaNow);
    };
  }, []);

  const loadSchedules = useCallback(async () => {
    scheduleRequestRef.current.controller?.abort();

    const requestId = scheduleRequestRef.current.id + 1;
    const controller = new AbortController();
    scheduleRequestRef.current = { id: requestId, controller };

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/jkt48-schedules?month=${month}&year=${year}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      let payload;

      try {
        payload = await response.json();
      } catch {
        throw new Error("Respons jadwal bukan JSON.");
      }

      if (!response.ok || payload?.status === false) {
        throw new Error(payload?.message || "Jadwal gagal dimuat.");
      }

      if (!Array.isArray(payload?.data)) {
        throw new Error("Format data jadwal tidak dikenali.");
      }

      const normalized = dedupeSchedules(
        payload.data.map(normalizeSchedule).filter((item) => item.dateKey),
      ).sort((a, b) => {
        const dateCompare = a.dateKey.localeCompare(b.dateKey);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      if (scheduleRequestRef.current.id === requestId) {
        setSchedules(normalized);
      }
    } catch (loadError) {
      if (loadError?.name === "AbortError") return;

      if (scheduleRequestRef.current.id === requestId) {
        setSchedules([]);
        setError(
          loadError instanceof Error ? loadError.message : "Jadwal gagal dimuat.",
        );
      }
    } finally {
      if (scheduleRequestRef.current.id === requestId) {
        setLoading(false);
      }
    }
  }, [month, year]);

  useEffect(() => {
    loadSchedules();

    return () => {
      scheduleRequestRef.current.controller?.abort();
    };
  }, [loadSchedules]);

  useEffect(() => {
    if (!selectedSchedule) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    detailOpenFocusFrameRef.current = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      detailOpenFocusFrameRef.current = null;
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeScheduleDetail();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [
        ...dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hasAttribute("hidden"));

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (detailOpenFocusFrameRef.current) {
        window.cancelAnimationFrame(detailOpenFocusFrameRef.current);
        detailOpenFocusFrameRef.current = null;
      }
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSchedule]);

  const availableSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        // Jadwal OFC yang tanggal acaranya masih akan datang harus tetap tampil,
        // meskipun status penjualannya belum aktif atau sudah berubah.
        // Ini mencegah event 5 Juli hilang sebelum hari acaranya.
        if (schedule.dateKey >= jakartaNow.key) return true;
        return !isExpiredExclusive(schedule, jakartaNow);
      }),
    [jakartaNow, schedules],
  );

  const scheduleCounts = useMemo(
    () => ({
      ALL: availableSchedules.length,
      SHOW: availableSchedules.filter((schedule) => schedule.type === "SHOW").length,
      EVENT: availableSchedules.filter((schedule) => schedule.type === "EVENT").length,
    }),
    [availableSchedules],
  );

  const visibleSchedules = useMemo(
    () => availableSchedules.filter((schedule) => matchesFilter(schedule, typeFilter)),
    [availableSchedules, typeFilter],
  );

  const groupedSchedules = useMemo(() => {
    return visibleSchedules.reduce((groups, schedule) => {
      if (!groups[schedule.dateKey]) {
        groups[schedule.dateKey] = [];
      }

      groups[schedule.dateKey].push(schedule);
      return groups;
    }, {});
  }, [visibleSchedules]);

  const nearestSchedule = useMemo(
    () =>
      visibleSchedules.find((schedule) => isScheduleUpcoming(schedule, jakartaNow)) ||
      null,
    [visibleSchedules, jakartaNow],
  );

  const currentMonthSelected = month === jakartaNow.month && year === jakartaNow.year;

  const yearOptions = useMemo(() => {
    const start = jakartaNow.year - 2;
    const options = Array.from({ length: 6 }, (_, index) => start + index);
    if (!options.includes(year)) options.push(year);
    return options.sort((a, b) => a - b);
  }, [jakartaNow.year, year]);

  const favoriteLineup = useMemo(
    () => (detailData?.lineup || []).filter((member) => isFavorite(member)),
    [detailData, isFavorite],
  );

  const selectedPoster = useMemo(() => {
    if (selectedSchedule?.type !== "SHOW") return null;

    // set_list dari detail API adalah sumber utama. Judul schedule hanya fallback.
    return getSetlistPoster(
      detailData?.setList,
      detailData?.title,
      selectedSchedule?.title,
    );
  }, [detailData, selectedSchedule]);

  useEffect(() => {
    setPosterFailed(false);
  }, [selectedPoster?.src, selectedSchedule]);

  const visiblePoster = selectedPoster && !posterFailed ? selectedPoster : null;

  async function openScheduleDetail(schedule) {
    if (!selectedSchedule && document.activeElement instanceof HTMLElement) {
      detailTriggerRef.current = document.activeElement;
    }

    detailRequestRef.current.controller?.abort();

    const requestId = detailRequestRef.current.id + 1;
    detailRequestRef.current = { id: requestId, controller: null };

    setSelectedSchedule(schedule);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(false);

    if (schedule.type !== "SHOW" || !schedule.referenceCode) {
      return;
    }

    const controller = new AbortController();
    detailRequestRef.current = { id: requestId, controller };
    setDetailLoading(true);

    try {
      const response = await fetch(
        `/api/jkt48-theater-show?code=${encodeURIComponent(schedule.referenceCode)}`,
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
        throw new Error("Respons detail show bukan JSON.");
      }

      if (!response.ok || payload?.status === false) {
        throw new Error(payload?.message || "Detail show gagal dimuat.");
      }

      if (!payload?.data || typeof payload.data !== "object") {
        throw new Error("Format detail show tidak dikenali.");
      }

      if (detailRequestRef.current.id === requestId) {
        setDetailData(normalizeTheaterDetail(payload.data));
      }
    } catch (loadError) {
      if (loadError?.name === "AbortError") return;

      if (detailRequestRef.current.id === requestId) {
        setDetailError(
          loadError instanceof Error ? loadError.message : "Detail show gagal dimuat.",
        );
      }
    } finally {
      if (detailRequestRef.current.id === requestId) {
        setDetailLoading(false);
      }
    }
  }

  function closeScheduleDetail() {
    detailRequestRef.current.controller?.abort();
    detailRequestRef.current = {
      id: detailRequestRef.current.id + 1,
      controller: null,
    };
    setSelectedSchedule(null);
    setDetailData(null);
    setDetailError("");
    setDetailLoading(false);

    if (detailRestoreFocusFrameRef.current) {
      window.cancelAnimationFrame(detailRestoreFocusFrameRef.current);
    }
    detailRestoreFocusFrameRef.current = window.requestAnimationFrame(() => {
      if (detailTriggerRef.current?.isConnected) {
        detailTriggerRef.current.focus();
      }
      detailTriggerRef.current = null;
      detailRestoreFocusFrameRef.current = null;
    });
  }

  useEffect(() => {
    return () => {
      detailRequestRef.current.controller?.abort();
      if (detailOpenFocusFrameRef.current) {
        window.cancelAnimationFrame(detailOpenFocusFrameRef.current);
      }
      if (detailRestoreFocusFrameRef.current) {
        window.cancelAnimationFrame(detailRestoreFocusFrameRef.current);
      }
    };
  }, []);

  function handleMonthChange(value) {
    if (selectedSchedule) closeScheduleDetail();
    setMonth(Number(value));
  }

  function handleYearChange(value) {
    if (selectedSchedule) closeScheduleDetail();
    setYear(Number(value));
  }

  function changeMonth(offset) {
    if (selectedSchedule) closeScheduleDetail();
    let nextMonth = month + offset;
    let nextYear = year;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    setMonth(nextMonth);
    setYear(nextYear);
  }

  function goToCurrentMonth() {
    if (selectedSchedule) closeScheduleDetail();
    setMonth(jakartaNow.month);
    setYear(jakartaNow.year);
  }

  return {
    availableSchedules,
    changeMonth,
    closeButtonRef,
    closeScheduleDetail,
    currentMonthSelected,
    detailData,
    detailError,
    detailLoading,
    dialogRef,
    error,
    favoriteLineup,
    goToCurrentMonth,
    groupedSchedules,
    handleMonthChange,
    handleYearChange,
    isFavorite,
    jakartaNow,
    loadSchedules,
    loading,
    month,
    nearestSchedule,
    openScheduleDetail,
    scheduleCounts,
    schedules,
    selectedPoster,
    selectedSchedule,
    setPosterFailed,
    setTypeFilter,
    toggleFavorite,
    typeFilter,
    visiblePoster,
    visibleSchedules,
    year,
    yearOptions,
  };
}
