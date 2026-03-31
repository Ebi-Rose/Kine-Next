"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import { ALL_EQUIPMENT, EQUIP_LABELS } from "@/data/constants";
import { StepLabel } from "../helpers";

export default function EquipmentStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { equip, setEquip } = useKineStore();

  // Initialize with all equipment if empty (first visit)
  useEffect(() => {
    if (equip.length === 0) {
      setEquip([...ALL_EQUIPMENT]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inverted logic: excluded stores what user DOESN'T have
  const [excluded, setExcluded] = useState<string[]>(() => {
    if (equip.length === 0) return []; // all available
    return ALL_EQUIPMENT.filter((e) => !equip.includes(e));
  });

  function toggleExclude(val: string) {
    let newExcluded: string[];
    if (excluded.includes(val)) {
      newExcluded = excluded.filter((e) => e !== val);
    } else {
      newExcluded = [...excluded, val];
    }
    setExcluded(newExcluded);
    // equip = everything NOT excluded
    setEquip(ALL_EQUIPMENT.filter((e) => !newExcluded.includes(e)));
  }

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        What equipment do you have?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Everything is selected. Tap to remove what you don&apos;t have access to.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 stagger-fade-up">
        {ALL_EQUIPMENT.map((val) => (
          <Tile
            key={val}
            selected={!excluded.includes(val)}
            onClick={() => toggleExclude(val)}
          >
            {EQUIP_LABELS[val]}
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={equip.length === 0} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
