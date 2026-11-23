import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine.js";

// LDA #$02; ADD #$03; STA $0300; HLT — montado à mão segundo docs/ISA.md
const SOMA = [0x10, 0x02, 0x70, 0x03, 0x22, 0x00, 0x03, 0xff];

describe("M1 — prova: soma 2+3 em binário cru", () => {
  it("roda direto e deixa 5 em $0300", () => {
    const m = new Machine();
    m.loadProgram(SOMA, 0x0200);
    m.reset();
    const cycles = m.run();

    expect(m.cpu.regs.a).toBe(5);
    expect(m.ram.read(0x0300)).toBe(5);
    expect(m.isHalted).toBe(true);
    expect(m.cpu.regs.pc).toBe(0x0208);
    expect(cycles).toBe(12); // LDA 3 + ADD 3 + STA 4 + HLT 2
  });

  it("roda clock a clock e chega no mesmo resultado", () => {
    const m = new Machine();
    m.loadProgram(SOMA, 0x0200);
    m.reset();

    for (let i = 0; i < 11; i++) m.tick();
    expect(m.isHalted).toBe(false);

    m.tick(); // o 12º clock executa o HALT
    expect(m.isHalted).toBe(true);
    expect(m.ram.read(0x0300)).toBe(5);
    expect(m.cycleCount).toBe(12);
  });

  it("toda transferência fica registrada no barramento", () => {
    const m = new Machine();
    m.loadProgram(SOMA, 0x0200);
    m.reset();
    m.run();

    const reads = m.transactions.filter((t) => !t.write);
    // as duas primeiras leituras são o vetor de reset
    expect(reads[0].address).toBe(0xfffc);
    expect(reads[1].address).toBe(0xfffd);

    const write = m.transactions.find((t) => t.write);
    expect(write?.address).toBe(0x0300);
    expect(write?.data).toBe(5);
  });
});
