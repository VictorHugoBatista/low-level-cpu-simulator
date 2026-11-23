import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine.js";

describe("CPU M1", () => {
  it("LDA absoluto carrega da memória e atualiza Z e N", () => {
    const m = new Machine();
    m.loadProgram([0x12, 0x00, 0x03, 0xff]);
    m.ram.write(0x0300, 0x2a);
    m.reset();
    m.run();

    expect(m.cpu.regs.a).toBe(0x2a);
    expect(m.cpu.regs.z).toBe(false);
    expect(m.cpu.regs.n).toBe(false);
  });

  it("JZ tomado pula a instrução seguinte", () => {
    const m = new Machine();
    // LDA #$00 (Z=1); JZ +3; STA $0300; HLT
    m.loadProgram([0x10, 0x00, 0xf2, 0x03, 0x22, 0x00, 0x03, 0xff]);
    m.reset();
    m.run();

    expect(m.ram.read(0x0300)).toBe(0); // a STA foi pulada
    expect(m.cpu.regs.pc).toBe(0x0208);
  });

  it("JZ não tomado quando Z=0 segue o fluxo", () => {
    const m = new Machine();
    // LDA #$07 (Z=0); JZ +3; STA $0300; HLT
    m.loadProgram([0x10, 0x07, 0xf2, 0x03, 0x22, 0x00, 0x03, 0xff]);
    m.reset();
    m.run();

    expect(m.ram.read(0x0300)).toBe(7);
  });

  it("JNZ tomado pula a instrução seguinte", () => {
    const m = new Machine();
    // LDA #$05 (Z=0); JNZ +3; STA $0300; HLT
    m.loadProgram([0x10, 0x05, 0xf3, 0x03, 0x22, 0x00, 0x03, 0xff]);
    m.reset();
    m.run();

    expect(m.ram.read(0x0300)).toBe(0); // a STA foi pulada
    expect(m.cpu.regs.a).toBe(5);
  });

  it("desvio relativo funciona para trás", () => {
    const m = new Machine();
    // LDA #$00 (Z=1); JZ -2 — volta para o próprio JZ: laço infinito
    m.loadProgram([0x10, 0x00, 0xf2, 0xfe]);
    m.reset();

    expect(m.run(100)).toBe(100);
    expect(m.isHalted).toBe(false);
  });

  it("JMP desvia para o endereço absoluto", () => {
    const m = new Machine();
    m.loadProgram([0xf0, 0x00, 0x03]);
    m.ram.write(0x0300, 0xff); // HLT longe do programa
    m.reset();
    const cycles = m.run();

    expect(m.isHalted).toBe(true);
    expect(m.cpu.regs.pc).toBe(0x0301);
    expect(cycles).toBe(6); // JMP 4 + HLT 2
  });

  it("opcode fora da tabela é erro claro, nunca NOP silencioso", () => {
    const m = new Machine();
    m.loadProgram([0x69]);
    m.reset();
    expect(() => m.run()).toThrow(/opcode inválido 0x69 em 0x0200/);
  });

  it("opcode que era congelado-não-implementado agora executa (STX zp, M5)", () => {
    const m = new Machine();
    m.loadProgram([0x30, 0x12, 0x41, 0x40, 0xff]); // LDX #$12; STX $40; HLT
    m.reset();
    m.run();
    expect(m.ram.read(0x40)).toBe(0x12);
  });
});
