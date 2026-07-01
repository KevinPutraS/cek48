import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "../../components/Icons";

export const EVENT_CATEGORY_CONFIG = {
  DIGITAL_PHOTOBOOK: {
    value: "DIGITAL_PHOTOBOOK",
    label: "Video Call",
    description: "Digital Photobook + bonus Video Call",
  },
  PHOTOCARD: {
    value: "PHOTOCARD",
    label: "Meet & Greet",
    description: "Personal Meet & Greet",
  },
  TWO_SHOT: {
    value: "TWO_SHOT",
    label: "2-Shot",
    description: "Personal 2-Shot",
  },
  OTHER: {
    value: "OTHER",
    label: "Event Lainnya",
    description: "Kategori lain dari API JKT48",
  },
};

export const EVENT_CATEGORY_ALIASES = {
  DIGITALPHOTOBOOK: "DIGITAL_PHOTOBOOK",
  DIGITAL_PHOTO_BOOK: "DIGITAL_PHOTOBOOK",
  PHOTOBOOK: "DIGITAL_PHOTOBOOK",
  PHOTO_CARD: "PHOTOCARD",
  TWOSHOT: "TWO_SHOT",
  "2SHOT": "TWO_SHOT",
  "2_SHOT": "TWO_SHOT",
};

export function normalizeEventCategory(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return EVENT_CATEGORY_ALIASES[normalized] || normalized;
}

export function detectEventCategory(event) {
  const category = normalizeEventCategory(event?.category);
  return EVENT_CATEGORY_CONFIG[category] ? category : "OTHER";
}

export function getEventCategoryLabel(eventOrCategory) {
  const category =
    typeof eventOrCategory === "string"
      ? eventOrCategory
      : detectEventCategory(eventOrCategory);

  return EVENT_CATEGORY_CONFIG[category]?.label || EVENT_CATEGORY_CONFIG.OTHER.label;
}

export function CustomDropdown({
  label,
  value,
  placeholder,
  options = [],
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const optionSignature = options.map((option) => String(option.value)).join("\u0000");

  useEffect(() => {
    optionRefs.current = [];
    setActiveIndex(selectedIndex);

    if (!options.length) setOpen(false);
  }, [optionSignature, selectedIndex, options.length]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;

    function handleOutsidePointer(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function openDropdown(preferredIndex = selectedIndex) {
    if (disabled || !options.length) return;
    setActiveIndex(preferredIndex >= 0 ? preferredIndex : 0);
    setOpen(true);
  }

  function handleTriggerKeyDown(event) {
    if (disabled || !options.length) return;

    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();

      if (!open) {
        const fallbackIndex =
          event.key === "ArrowUp" || event.key === "End"
            ? options.length - 1
            : selectedIndex;
        openDropdown(fallbackIndex);
        return;
      }

      setActiveIndex((current) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return options.length - 1;
        if (event.key === "ArrowUp") {
          return current <= 0 ? options.length - 1 : current - 1;
        }
        return current >= options.length - 1 ? 0 : current + 1;
      });
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) {
        setOpen(false);
        onChange(option.value);
      }
    }
  }

  return (
    <div
      className={`custom-field ${open ? "is-open" : ""} ${
        disabled ? "custom-field-disabled" : ""
      }`}
      ref={dropdownRef}
    >
      <span className="custom-field-label">{label}</span>

      <button
        type="button"
        className={`custom-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => {
          if (open) setOpen(false);
          else openDropdown();
        }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={selectedOption?.label || placeholder}
      >
        <span className={selectedOption ? "" : "custom-placeholder"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronIcon />
      </button>

      {open && !disabled ? (
        <div className="custom-select-menu" role="listbox" aria-label={label}>
          {options.length ? (
            options.map((option, index) => (
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                className={`custom-select-option ${
                  option.value === value ? "is-selected" : ""
                } ${activeIndex === index ? "is-active" : ""}`}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => {
                  setOpen(false);
                  onChange(option.value);
                }}
              >
                <span>
                  <strong>{option.label}</strong>
                  {option.description ? <small>{option.description}</small> : null}
                </span>

                {option.value === value ? <i className="custom-selected-dot" /> : null}
              </button>
            ))
          ) : (
            <div className="custom-select-empty">Belum ada pilihan tersedia.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
