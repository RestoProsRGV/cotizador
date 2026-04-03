import { useTranslation } from "react-i18next";

interface ChipItem {
  value: string;
  label: string;
}

interface MaterialChipGroupProps {
  groupLabel: string;
  chips: ChipItem[];
  selected: string[];
  onToggle: (value: string) => void;
}

function MaterialChipGroup({ groupLabel, chips, selected, onToggle }: MaterialChipGroupProps) {
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {chips.map(({ value, label }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              style={{
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
              }}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface MaterialsValue {
  floor: string[];
  walls: string[];
  ceiling: string[];
}

interface MaterialChipsProps {
  value: MaterialsValue;
  onChange: (value: MaterialsValue) => void;
}

export function MaterialChips({ value, onChange }: MaterialChipsProps) {
  const { t } = useTranslation();

  const floorChips: ChipItem[] = [
    { value: "Carpet", label: t("materials.carpet") },
    { value: "Carpet Pad", label: t("materials.carpetPad") },
    { value: "Tile", label: t("materials.tile") },
    { value: "Wood", label: t("materials.wood") },
    { value: "Laminate", label: t("materials.laminate") },
    { value: "Vinyl/LVP", label: t("materials.vinylLvp") },
  ];

  const wallChips: ChipItem[] = [
    { value: "Drywall", label: t("materials.drywall") },
    { value: "Paneling", label: t("materials.paneling") },
    { value: "Insulation", label: t("materials.insulation") },
  ];

  const ceilingChips: ChipItem[] = [
    { value: "Drywall", label: t("materials.drywall") },
    { value: "Acoustic Tile", label: t("materials.acousticTile") },
    { value: "Insulation", label: t("materials.insulation") },
  ];

  function toggleFloor(v: string) {
    const floor = value.floor.includes(v)
      ? value.floor.filter((x) => x !== v)
      : [...value.floor, v];
    onChange({ ...value, floor });
  }

  function toggleWalls(v: string) {
    const walls = value.walls.includes(v)
      ? value.walls.filter((x) => x !== v)
      : [...value.walls, v];
    onChange({ ...value, walls });
  }

  function toggleCeiling(v: string) {
    const ceiling = value.ceiling.includes(v)
      ? value.ceiling.filter((x) => x !== v)
      : [...value.ceiling, v];
    onChange({ ...value, ceiling });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <MaterialChipGroup
        groupLabel={t("materials.floor")}
        chips={floorChips}
        selected={value.floor}
        onToggle={toggleFloor}
      />
      <MaterialChipGroup
        groupLabel={t("materials.walls")}
        chips={wallChips}
        selected={value.walls}
        onToggle={toggleWalls}
      />
      <MaterialChipGroup
        groupLabel={t("materials.ceiling")}
        chips={ceilingChips}
        selected={value.ceiling}
        onToggle={toggleCeiling}
      />
    </div>
  );
}
