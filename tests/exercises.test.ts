import { describe, expect, it } from "vitest";
import { assemble, AsmError } from "../src/asm/assembler.js";
import {
  applyCasePresets,
  runExerciseCase,
  runExerciseCases,
} from "../src/runtime/exercise.js";
import { Machine } from "../src/runtime/machine.js";
import { EXERCISES } from "../src/web/exerciseCatalog.js";
import type { ExerciseDef } from "../src/web/exerciseCatalog.js";

function mounted(def: ExerciseDef, source: string) {
  const r = assemble(source, `${def.id}.asm`);
  return { origin: r.origin, bytes: r.bytes };
}

describe("verificador de exercícios — mecanismo", () => {
  const PROG = {
    origin: 0x0200,
    bytes: [0x10, 0x02, 0x70, 0x03, 0x22, 0x00, 0x03, 0xff], // LDA #2; ADD #3; STA $0300; HLT
  };

  it("preset pre-coloca valores e expect confere o destino", () => {
    const r = runExerciseCase(PROG, {
      name: "soma",
      preset: [{ addr: 0x0301, value: 3 }],
      expect: [{ addr: 0x0300, value: 5 }],
    });
    expect(r.passed).toBe(true);
    expect(r.halted).toBe(true);
  });

  it("esperado divergente vira falha legível com endereço e valores", () => {
    const r = runExerciseCase(PROG, {
      name: "soma errada",
      preset: [],
      expect: [{ addr: 0x0300, value: 7 }],
    });
    expect(r.passed).toBe(false);
    expect(r.failures[0]).toContain("$0300");
    expect(r.failures[0]).toContain("esperado 0x07");
  });

  it("programa sem HLT dentro do teto de ciclos é falha, não loop eterno", () => {
    // JMP $0200 (loop infinito): JMP abs é $F0, endereço little-endian
    const r = runExerciseCase({ origin: 0x0200, bytes: [0xf0, 0x00, 0x02] }, {
      name: "sem fim",
      preset: [],
      expect: [],
    }, 500);
    expect(r.halted).toBe(false);
    expect(r.passed).toBe(false);
    expect(r.failures[0]).toContain("não parou");
  });

  it("terminador do terminal é conferido quando o caso pede", () => {
    // LDA #'A'; STA $E800; LDA #'B'; STA $E800; HLT (endereços little-endian)
    const prog = {
      origin: 0x0200,
      bytes: [
        0x10, 0x41, 0x22, 0x00, 0xe8, // STA $E800
        0x10, 0x42, 0x22, 0x00, 0xe8,
        0xff,
      ],
    };
    const ok = runExerciseCase(prog, {
      name: "ab",
      preset: [],
      expect: [],
      expectTerminal: "AB",
    });
    expect(ok.passed).toBe(true);
    const errado = runExerciseCase(prog, {
      name: "ab errado",
      preset: [],
      expect: [],
      expectTerminal: "BA",
    });
    expect(errado.passed).toBe(false);
    expect(errado.failures[0]).toContain("terminal");
  });

  it("cada caso roda numa máquina fresca: presets de um não vazam para o outro", () => {
    const results = runExerciseCases(PROG, [
      { name: "a", preset: [{ addr: 0x0301, value: 3 }], expect: [{ addr: 0x0300, value: 5 }] },
      { name: "b", preset: [], expect: [{ addr: 0x0300, value: 5 }] },
    ]);
    expect(results.map((r) => r.passed)).toEqual([true, true]);
  });
});

describe("applyCasePresets — o caso desenvolvido na máquina visível do dashboard", () => {
  it("grava as entradas na RAM e reseta: o caso roda à mão e o resultado sai igual", () => {
    const m = new Machine();
    const r = assemble("lda $0300\nadd $0301\nsta $0302\nhlt", "dev.asm");
    m.loadProgram(r.bytes, r.origin);
    applyCasePresets(m, [
      { addr: 0x0300, value: 10 },
      { addr: 0x0301, value: 32 },
    ]);
    m.run();
    expect(m.isHalted).toBe(true);
    expect(m.ram.read(0x0302)).toBe(42);
  });

  it("remontar o programa depois do preset preserva as entradas: a RAM não é zerada", () => {
    const m = new Machine();
    applyCasePresets(m, [
      { addr: 0x0300, value: 200 },
      { addr: 0x0301, value: 55 },
    ]);
    const r = assemble("lda $0300\nadd $0301\nsta $0302\nhlt", "dev.asm");
    m.loadProgram(r.bytes, r.origin);
    m.run();
    expect(m.ram.read(0x0302)).toBe(255);
  });
});

describe("catálogo — toda solução passa nos próprios casos", () => {
  for (const def of EXERCISES) {
    it(`${def.id}: solução de referência passa em ${def.cases.length} casos`, () => {
      const results = runExerciseCases(mounted(def, def.solution), def.cases);
      for (const r of results) {
        if (!r.passed) expect(r.failures).toEqual([]);
      }
      expect(results.every((r) => r.passed)).toBe(true);
    });
  }
});

describe("catálogo — nenhum template passa sem trabalho", () => {
  for (const def of EXERCISES) {
    it(`${def.id}: template falha em pelo menos um caso`, () => {
      const results = runExerciseCases(mounted(def, def.template), def.cases);
      expect(results.some((r) => !r.passed)).toBe(true);
    });
  }
});

describe("catálogo — integridade dos dados", () => {
  it("a série tem os 7 níveis em ordem, com teoria, enunciado, dicas e ≥ 2 casos", () => {
    expect(EXERCISES.length).toBe(7);
    for (const def of EXERCISES) {
      expect(def.theory.length).toBeGreaterThan(40);
      expect(def.statement.length).toBeGreaterThan(40);
      expect(def.hints.length).toBeGreaterThanOrEqual(3);
      expect(def.cases.length).toBeGreaterThanOrEqual(2);
      expect(def.template).not.toContain("TODO TODO");
    }
  });

  it("todo template e toda solução montam sem erro", () => {
    for (const def of EXERCISES) {
      expect(() => assemble(def.template, `${def.id}.template.asm`)).not.toThrow();
      expect(() => assemble(def.solution, `${def.id}.solucao.asm`)).not.toThrow();
    }
  });

  it("erros de montagem do aluno chegam como AsmError, não como crash", () => {
    expect(() => assemble("lda #$zz", "aluno.asm")).toThrow(AsmError);
  });
});
