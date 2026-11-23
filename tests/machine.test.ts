import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine";

describe("máquina", () => {
  it("liga pela lógica do vetor de reset, não 'rodando o arquivo'", () => {
    const m = new Machine();
    m.loadProgram([0xff], 0x0200);
    m.reset();

    expect(m.cpu.regs.pc).toBe(0x0200);
    const reads = m.transactions.filter((t) => !t.write);
    expect(reads[0].address).toBe(0xfffc);
    expect(reads[1].address).toBe(0xfffd);
  });

  it("loadProgram grava o vetor de reset apontando para a origem", () => {
    const m = new Machine();
    m.loadProgram([0xff], 0x0400);
    expect(m.ram.read(0xfffc)).toBe(0x00);
    expect(m.ram.read(0xfffd)).toBe(0x04);
  });

  it("HLT trava a execução; rodar de novo não gasta ciclo", () => {
    const m = new Machine();
    m.loadProgram([0xff]);
    m.reset();

    const first = m.run();
    expect(m.isHalted).toBe(true);
    expect(m.run()).toBe(0);
    expect(m.cycleCount).toBe(first);
  });

  it("run respeita o teto de ciclos em um laço infinito", () => {
    const m = new Machine();
    // LDA #$00 (Z=1); JZ -2 — laço que nunca sai
    m.loadProgram([0x10, 0x00, 0xf2, 0xfe]);
    m.reset();

    expect(m.run(50)).toBe(50);
    expect(m.isHalted).toBe(false);
  });
});
