import { useEffect, useRef, useState } from "react";

export function ScheduleSelect({ label, value, options, onChange }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || options[0];

  function focusOption(target) {
    window.requestAnimationFrame(() => {
      const buttons = rootRef.current?.querySelectorAll(
        '.schedule-select-menu [role="option"]',
      );
      if (!buttons?.length) return;

      if (target === "first") buttons[0].focus();
      else if (target === "last") buttons[buttons.length - 1].focus();
      else {
        const activeIndex = options.findIndex(
          (option) => String(option.value) === String(value),
        );
        buttons[Math.max(0, activeIndex)].focus();
      }
    });
  }

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleTriggerKeyDown(event) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      focusOption(event.key === "End" || event.key === "ArrowUp" ? "last" : "active");
    }
  }

  function handleMenuKeyDown(event) {
    const buttons = [
      ...(rootRef.current?.querySelectorAll('.schedule-select-menu [role="option"]') ||
        []),
    ];
    const currentIndex = buttons.indexOf(document.activeElement);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + offset + buttons.length) % buttons.length;
      buttons[nextIndex]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      buttons[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`schedule-select ${open ? "is-open" : ""}`}>
      <span className="schedule-select-label">{label}</span>

      <button
        ref={triggerRef}
        className="schedule-select-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label || "Pilih"}</span>

        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 9 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <div
          className="schedule-select-menu"
          role="listbox"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
        >
          {options.map((option) => {
            const active = String(option.value) === String(value);

            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                key={option.value}
                className={active ? "is-active" : ""}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span>{option.label}</span>

                {active ? <i aria-hidden="true">✓</i> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function ScheduleIcon({ type }) {
  if (type === "SHOW") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="M8 3v3M16 3v3M8 18v3M16 18v3" />
        <path d="m10 10 4 2-4 2z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 12h3M13 12h3M8 16h3M13 16h3" />
    </svg>
  );
}
