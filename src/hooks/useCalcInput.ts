import { useState, useEffect, useRef } from "react";
import { evaluate } from "mathjs";

export function useCalcInput(
  value: number,
  onChange: (value: number) => void,
) {
  const [display, setDisplay] = useState(String(value));
  const [hasError, setHasError] = useState(false);
  const isFocused = useRef(false);
  const valueRef = useRef(value);

  // Sync display when value changes externally (e.g. +/- buttons, parent load)
  useEffect(() => {
    valueRef.current = value;
    if (!isFocused.current) {
      setDisplay(String(value));
    }
  }, [value]);

  const handleChange = (raw: string) => {
    setDisplay(raw);
    setHasError(false);
  };

  const handleBlur = () => {
    isFocused.current = false;
    const trimmed = display.trim();

    if (trimmed === "") {
      setDisplay(String(valueRef.current));
      return;
    }

    try {
      const result = evaluate(trimmed);
      if (
        typeof result === "number" &&
        isFinite(result) &&
        result >= 0 &&
        result <= 99999
      ) {
        const rounded = Math.round(result * 100) / 100;
        setDisplay(String(rounded));
        onChange(rounded);
      } else {
        setHasError(true);
        setDisplay(String(valueRef.current));
        setTimeout(() => setHasError(false), 1500);
      }
    } catch {
      setHasError(true);
      setDisplay(String(valueRef.current));
      setTimeout(() => setHasError(false), 1500);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = true;
    e.target.select();
  };

  return { display, hasError, handleChange, handleBlur, handleFocus };
}
