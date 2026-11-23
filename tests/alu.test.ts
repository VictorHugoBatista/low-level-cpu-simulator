import { describe, expect, it } from "vitest";
import {
  aluAdd,
  aluAnd,
  aluNot,
  aluOra,
  aluShl,
  aluShr,
  aluSub,
  aluXor,
} from "../src/cpu/alu";

describe("ULA", () => {
  it("ADD soma e aponta carry", () => {
    expect(aluAdd(0x02, 0x03)).toMatchObject({ value: 0x05, c: false, v: false });
    expect(aluAdd(0xff, 0x01)).toMatchObject({ value: 0x00, c: true, v: false });
    expect(aluAdd(0x7f, 0x01)).toMatchObject({ value: 0x80, c: false, v: true });
    expect(aluAdd(0x80, 0xff)).toMatchObject({ value: 0x7f, c: true, v: true });
  });

  it("SUB subtrai; C=1 significa ausência de borrow", () => {
    expect(aluSub(0x05, 0x03)).toMatchObject({ value: 0x02, c: true, v: false });
    expect(aluSub(0x03, 0x05)).toMatchObject({ value: 0xfe, c: false, v: false });
    expect(aluSub(0x80, 0x01)).toMatchObject({ value: 0x7f, c: true, v: true });
  });

  it("lógicas operam bit a bit", () => {
    expect(aluAnd(0xf0, 0x8c)).toBe(0x80);
    expect(aluOra(0xf0, 0x0c)).toBe(0xfc);
    expect(aluXor(0xff, 0x0f)).toBe(0xf0);
    expect(aluNot(0x00)).toBe(0xff);
  });

  it("deslocamentos mandam o bit para o carry", () => {
    expect(aluShl(0x80)).toMatchObject({ value: 0x00, c: true });
    expect(aluShl(0x40)).toMatchObject({ value: 0x80, c: false });
    expect(aluShr(0x01)).toMatchObject({ value: 0x00, c: true });
    expect(aluShr(0xfe)).toMatchObject({ value: 0x7f, c: false });
  });
});
