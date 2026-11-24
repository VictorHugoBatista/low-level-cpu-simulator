import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine.js";
import { DiskImage } from "../src/storage/diskImage.js";

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

  it("restartProgram volta ao começo: regrava o programa, limpa o terminal e reseta", () => {
    const m = new Machine();
    // LDA #'A'; STA $E800 (terminal); LDA #$05; STA $0300; HLT
    m.loadProgram([0x10, 0x41, 0x22, 0x00, 0xe8, 0x10, 0x05, 0x22, 0x00, 0x03, 0xff]);
    m.reset();
    m.run();
    expect(m.terminal.text).toBe("A");
    expect(m.ram.read(0x0300)).toBe(0x05);

    m.restartProgram();
    expect(m.terminal.text).toBe("");
    expect(m.ram.read(0x0200)).toBe(0x10); // o programa está de volta, intacto
    expect(m.ram.read(0x0300)).toBe(0x05); // write em área de dados permanece (presets!)
    expect(m.cpu.regs.pc).toBe(0x0200);
    expect(m.cycleCount).toBe(0);
    expect(m.isHalted).toBe(false);
  });

  it("restartProgram restaura código que a execução modificou (self-modifying)", () => {
    const m = new Machine();
    // STA $0200 escreve por cima da própria instrução; HLT depois
    m.loadProgram([0x10, 0x42, 0x22, 0x00, 0x02, 0xff]);
    m.reset();
    m.run();
    expect(m.ram.read(0x0200)).toBe(0x42); // o opcode virou o byte gravado

    m.restartProgram();
    expect(m.ram.read(0x0200)).toBe(0x10); // LDA de volta no lugar
    expect(m.isHalted).toBe(false);
  });

  it("restartProgram depois do boot regrava o loader do setor 0", () => {
    const m = new Machine();
    const disk = new DiskImage(256);
    disk.writeSector(0, Uint8Array.from([0xff])); // o "loader": um HLT
    m.insertDisk(disk);
    m.bootFromDisk();
    m.ram.write(0x0200, 0x00); // a execução escreveu por cima do loader

    m.restartProgram();
    expect(m.ram.read(0x0200)).toBe(0xff);
  });
});
