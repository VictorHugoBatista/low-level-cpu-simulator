import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine.js";
import { DiskImage, SECTOR_SIZE } from "../src/storage/diskImage.js";
import { assemble } from "../src/asm/assembler.js";
import somaAsm from "../examples/soma.asm?raw";
import desvioAsm from "../examples/desvio.asm?raw";
import bootAsm from "../examples/boot.asm?raw";
import helloAsm from "../examples/hello.asm?raw";
import {
  EXEMPLOS_MARCADOR,
  registrarExecucao,
  ranking,
} from "../src/web/marcador.js";
import type { MarcadorState } from "../src/web/marcador.js";

const conferente = (nome: string) => {
  const ex = EXEMPLOS_MARCADOR.find((e) => e.name === nome);
  if (ex === undefined) throw new Error(`exemplo ${nome} não tem conferente`);
  return ex.conferir;
};

const vazio = (): MarcadorState => ({ jogador: "", marcas: {} });

describe("marcador — registrarExecucao", () => {
  it("grava a primeira marca e guarda a menor (a marca só recua, nunca sobe)", () => {
    let s = registrarExecucao(vazio(), "ana", "soma", 12);
    expect(s.marcas.ana.soma).toBe(12);

    s = registrarExecucao(s, "ana", "soma", 11);
    expect(s.marcas.ana.soma).toBe(11);

    s = registrarExecucao(s, "ana", "soma", 13);
    expect(s.marcas.ana.soma).toBe(11);
  });

  it("não mistura as marcas de pessoas diferentes", () => {
    let s = registrarExecucao(vazio(), "ana", "soma", 12);
    s = registrarExecucao(s, "bia", "soma", 10);
    expect(s.marcas.ana.soma).toBe(12);
    expect(s.marcas.bia.soma).toBe(10);
  });

  it("não toca no estado original: devolve um novo", () => {
    const antes = vazio();
    registrarExecucao(antes, "ana", "soma", 12);
    expect(antes.marcas).toEqual({});
  });
});

describe("marcador — ranking", () => {
  const EXEMPLOS = ["soma", "desvio", "hello-disk"];

  it("ordena pelos menores ciclos totais das pessoas completas", () => {
    let s = vazio();
    // ana: 12 + 18 + 40 = 70; bia: 10 + 18 + 40 = 68
    for (const [pessoa, marcas] of [
      ["ana", [12, 18, 40]],
      ["bia", [10, 18, 40]],
    ] as const) {
      for (const [i, ciclos] of marcas.entries()) {
        s = registrarExecucao(s, pessoa, EXEMPLOS[i], ciclos);
      }
    }
    const linhas = ranking(s, EXEMPLOS);
    expect(linhas.map((l) => l.jogador)).toEqual(["bia", "ana"]);
    expect(linhas[0].parcial).toBe(68);
    expect(linhas[0].completa).toBe(true);
  });

  it("pessoa incompleta fica depois das completas, mesmo com soma parcial menor", () => {
    let s = registrarExecucao(vazio(), "carla", "soma", 2);
    s = registrarExecucao(s, "ana", "soma", 12);
    s = registrarExecucao(s, "ana", "desvio", 18);
    s = registrarExecucao(s, "ana", "hello-disk", 40);
    const linhas = ranking(s, EXEMPLOS);
    expect(linhas.map((l) => l.jogador)).toEqual(["ana", "carla"]);
    expect(linhas[1].completa).toBe(false);
    expect(linhas[1].parcial).toBe(2);
  });

  it("entre incompletas, vem primeiro quem rodou mais exemplos", () => {
    let s = registrarExecucao(vazio(), "um-exemplo", "soma", 12);
    s = registrarExecucao(s, "dois-exemplos", "soma", 12);
    s = registrarExecucao(s, "dois-exemplos", "desvio", 18);
    const linhas = ranking(s, EXEMPLOS);
    expect(linhas.map((l) => l.jogador)).toEqual(["dois-exemplos", "um-exemplo"]);
  });

  it("ignora registro sem nome e mostra undefined no exemplo que falta", () => {
    const s: MarcadorState = {
      jogador: "",
      marcas: { "": { soma: 1 }, ana: { soma: 12 } },
    };
    const linhas = ranking(s, EXEMPLOS);
    expect(linhas.map((l) => l.jogador)).toEqual(["ana"]);
    expect(linhas[0].marcas["desvio"]).toBeUndefined();
  });
});

describe("marcador — conferentes dos exemplos", () => {
  it("soma vale quando o run grava 5 em $0300 — e não vale sem o write deste run", () => {
    const m = new Machine();
    m.loadProgram(assemble(somaAsm).bytes, 0x0200);
    m.reset();
    m.run();
    expect(conferente("soma")(m)).toBe(true);
    expect(m.cycleCount).toBe(12);

    // HLT seco: nenhuma transação de escrita — o $0300 que sobrou de outro run
    // não pode virar marca.
    const seca = new Machine();
    seca.loadProgram(new Uint8Array([0xff]), 0x0200);
    seca.ram.write(0x0300, 5);
    seca.reset();
    seca.run();
    expect(conferente("soma")(seca)).toBe(false);
  });

  it("desvio vale quando o caminho tomado grava 1 em $0300", () => {
    const m = new Machine();
    m.loadProgram(assemble(desvioAsm).bytes, 0x0200);
    m.reset();
    m.run();
    expect(conferente("desvio")(m)).toBe(true);
  });

  it("hello-disk vale no fluxo completo de boot (loader do setor 0 → programa do setor 1)", () => {
    const boot = assemble(bootAsm).bytes;
    const hello = assemble(helloAsm).bytes;
    expect(boot.length).toBeLessThanOrEqual(SECTOR_SIZE);
    expect(hello.length).toBeLessThanOrEqual(SECTOR_SIZE);
    const m = new Machine();
    const img = new DiskImage(256);
    img.writeSector(0, Uint8Array.from(boot));
    img.writeSector(1, Uint8Array.from(hello));
    m.insertDisk(img);
    m.bootFromDisk();
    m.run();
    expect(conferente("hello-disk")(m)).toBe(true);
    expect(m.terminal.text).toContain("Ola, MOS-6502!");
  });
});
