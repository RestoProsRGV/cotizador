import React from "react";
import { useCalcInput } from "@/hooks/useCalcInput";

interface CalcInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "onBlur" | "onFocus"
  > {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Drop-in replacement for <input type="number"> that accepts math
 * expressions (+, -, *, /, parentheses). Evaluates on blur and calls
 * onChange with the numeric result. Flashes red border on invalid input
 * and reverts to the previous valid value.
 */
export function CalcInput({ value, onChange, style, ...rest }: CalcInputProps) {
  const calc = useCalcInput(value, onChange);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={calc.display}
      onChange={(e) => calc.handleChange(e.target.value)}
      onBlur={calc.handleBlur}
      onFocus={calc.handleFocus}
      style={{
        ...style,
        ...(calc.hasError
          ? { borderColor: "#f87171", outline: "1px solid #f87171" }
          : {}),
      }}
      {...rest}
    />
  );
}
