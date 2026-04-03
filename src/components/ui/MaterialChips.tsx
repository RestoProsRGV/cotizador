import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ChipItem {
  value: string;
  label: string;
}

export interface MaterialsValue {
  floor: string[];
  walls: string[];
  ceiling: string[];
}

interface ChipGroupProps {
  groupLabel: string;
  commonChips: ChipItem[];
  moreChips: ChipItem[];
  selected: string[];
  onToggle: (v: string) => void;
}

function ChipGroupWithMore({ groupLabel, commonChips, moreChips, selected, onToggle }: ChipGroupProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  // Selected items that came from the "More" list — show them alongside common chips
  const selectedMore = moreChips.filter((c) => selected.includes(c.value));

  const chipStyle = (isSelected: boolean): React.CSSProperties => ({
    height: "32px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid",
    cursor: "pointer",
    backgroundColor: isSelected ? "var(--color-primary)" : "var(--color-background)",
    color: isSelected ? "var(--color-text-on-primary)" : "var(--color-text-primary)",
    borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
    transition: "all 150ms ease",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {groupLabel}
      </span>

      {/* Chip row: common + selected-from-More */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {commonChips.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            style={chipStyle(selected.includes(value))}
            aria-pressed={selected.includes(value)}
          >
            {label}
          </button>
        ))}

        {/* Selected "More" items appear here as chips */}
        {selectedMore.map(({ value, label }) => (
          <button
            key={`more-sel-${value}`}
            type="button"
            onClick={() => onToggle(value)}
            style={{
              ...chipStyle(true),
              borderStyle: "dashed",
            }}
            aria-pressed={true}
          >
            {label}
          </button>
        ))}

        {/* More toggle button */}
        {moreChips.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            style={{
              height: "32px",
              paddingLeft: "10px",
              paddingRight: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flexShrink: 0,
            }}
            aria-expanded={moreOpen}
          >
            More
            {moreOpen
              ? <ChevronUp size={14} aria-hidden />
              : <ChevronDown size={14} aria-hidden />}
          </button>
        )}
      </div>

      {/* Expanded More panel */}
      {moreOpen && (
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "var(--color-background)",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {moreChips.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              style={chipStyle(selected.includes(value))}
              aria-pressed={selected.includes(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MaterialChipsProps {
  value: MaterialsValue;
  onChange: (value: MaterialsValue) => void;
}

export function MaterialChips({ value, onChange }: MaterialChipsProps) {
  const { t } = useTranslation();

  const FLOOR_COMMON: ChipItem[] = [
    { value: "Carpet", label: t("materials.carpet") },
    { value: "Tile", label: t("materials.tile") },
    { value: "Wood", label: t("materials.wood") },
    { value: "Vinyl/LVP", label: t("materials.vinylLvp") },
  ];
  const FLOOR_MORE: ChipItem[] = [
    { value: "Carpet Pad", label: t("materials.carpetPad") },
    { value: "Laminate", label: t("materials.laminate") },
    { value: "Hardwood", label: t("materials.hardwood") },
    { value: "Concrete Slab", label: t("materials.concreteSlab") },
  ];

  const WALLS_COMMON: ChipItem[] = [
    { value: "Drywall", label: t("materials.drywall") },
    { value: "Paneling", label: t("materials.paneling") },
  ];
  const WALLS_MORE: ChipItem[] = [
    { value: "Insulation", label: t("materials.insulation") },
    { value: "Plaster", label: t("materials.plaster") },
    { value: "Brick/Block", label: t("materials.brickBlock") },
  ];

  const CEIL_COMMON: ChipItem[] = [
    { value: "Drywall", label: t("materials.drywall") },
    { value: "Acoustic Tile", label: t("materials.acousticTile") },
  ];
  const CEIL_MORE: ChipItem[] = [
    { value: "Insulation", label: t("materials.insulation") },
    { value: "Plaster", label: t("materials.plaster") },
    { value: "Drop Ceiling", label: t("materials.dropCeiling") },
  ];

  function toggleFloor(v: string) {
    const floor = value.floor.includes(v) ? value.floor.filter((x) => x !== v) : [...value.floor, v];
    onChange({ ...value, floor });
  }
  function toggleWalls(v: string) {
    const walls = value.walls.includes(v) ? value.walls.filter((x) => x !== v) : [...value.walls, v];
    onChange({ ...value, walls });
  }
  function toggleCeiling(v: string) {
    const ceiling = value.ceiling.includes(v) ? value.ceiling.filter((x) => x !== v) : [...value.ceiling, v];
    onChange({ ...value, ceiling });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <ChipGroupWithMore
        groupLabel={t("materials.floor")}
        commonChips={FLOOR_COMMON}
        moreChips={FLOOR_MORE}
        selected={value.floor}
        onToggle={toggleFloor}
      />
      <ChipGroupWithMore
        groupLabel={t("materials.walls")}
        commonChips={WALLS_COMMON}
        moreChips={WALLS_MORE}
        selected={value.walls}
        onToggle={toggleWalls}
      />
      <ChipGroupWithMore
        groupLabel={t("materials.ceiling")}
        commonChips={CEIL_COMMON}
        moreChips={CEIL_MORE}
        selected={value.ceiling}
        onToggle={toggleCeiling}
      />
    </div>
  );
}
