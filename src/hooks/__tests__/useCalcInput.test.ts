import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useCalcInput } from "@/hooks/useCalcInput";

function setup(initialValue = 0) {
  const onChange = vi.fn();
  const { result } = renderHook(() => useCalcInput(initialValue, onChange));
  return { result, onChange };
}

describe("useCalcInput", () => {
  it("initializes display with the initial value", () => {
    const { result } = setup(5);
    expect(result.current.display).toBe("5");
  });

  it('"16*2" evaluates to 32 on blur', () => {
    const { result, onChange } = setup(0);
    act(() => result.current.handleChange("16*2"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("32");
    expect(onChange).toHaveBeenCalledWith(32);
  });

  it('"10+5" evaluates to 15', () => {
    const { result, onChange } = setup(0);
    act(() => result.current.handleChange("10+5"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("15");
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('"(10+5)*2" evaluates to 30', () => {
    const { result, onChange } = setup(0);
    act(() => result.current.handleChange("(10+5)*2"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("30");
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("rounds result to 2 decimal places", () => {
    const { result, onChange } = setup(0);
    act(() => result.current.handleChange("10/3"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("3.33");
    expect(onChange).toHaveBeenCalledWith(3.33);
  });

  it("invalid expression 'abc' reverts display and sets hasError", () => {
    const { result, onChange } = setup(5);
    act(() => result.current.handleChange("abc"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("5");
    expect(result.current.hasError).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("negative result sets hasError and reverts", () => {
    const { result, onChange } = setup(5);
    act(() => result.current.handleChange("-3"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("5");
    expect(result.current.hasError).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("division by zero sets hasError and reverts", () => {
    const { result, onChange } = setup(5);
    act(() => result.current.handleChange("1/0"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("5");
    expect(result.current.hasError).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("empty string on blur keeps previous value without error", () => {
    const { result, onChange } = setup(7);
    act(() => result.current.handleChange(""));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("7");
    expect(result.current.hasError).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("result > 99999 sets hasError", () => {
    const { result, onChange } = setup(0);
    act(() => result.current.handleChange("999999"));
    act(() => result.current.handleBlur());
    expect(result.current.hasError).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handleChange clears hasError", () => {
    const { result } = setup(5);
    act(() => result.current.handleChange("abc"));
    act(() => result.current.handleBlur());
    expect(result.current.hasError).toBe(true);
    act(() => result.current.handleChange("10"));
    expect(result.current.hasError).toBe(false);
  });

  it("plain numbers pass through unchanged", () => {
    const { result, onChange } = setup(0);
    act(() => result.current.handleChange("42"));
    act(() => result.current.handleBlur());
    expect(result.current.display).toBe("42");
    expect(onChange).toHaveBeenCalledWith(42);
  });
});
