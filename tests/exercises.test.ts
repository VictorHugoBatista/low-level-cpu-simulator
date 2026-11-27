import { describe, expect, it, vi } from "vitest";
import { assemble, AsmError } from "../src/asm/assembler.js";
import {
  applyCasePresets,
  runExerciseCase,
  runExerciseCases,
} from "../src/runtime/exercise.js";
import { Machine } from "../src/runtime/machine.js";
import { EXERCISES, TRACKS } from "../src/web/exerciseCatalog.js";
import type { ExerciseDef } from "../src/web/exerciseCatalog.js";
import type { Store } from "../src/web/store.js";

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

  it("limpa o terminal: um caso novo começa sem o texto do caso anterior", () => {
    const m = new Machine();
    m.terminal.busWrite(0xe800, 0x41); // "A" impresso pelo caso anterior
    applyCasePresets(m, [{ addr: 0x0300, value: 10 }]);
    expect(m.terminal.text).toBe("");
  });
});

describe("saveDraftActive — só fonte digitado vira rascunho do exercício", () => {
  it("rascunho é sobrescrito por digitação, mas não por programa recém-carregado", async () => {
    // localStorage em memória: o exercícioState lê e grava progresso nele no import.
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      const es = await import("../src/web/exerciseState.js");
      const def = EXERCISES[0] as ExerciseDef;
      const fake = (dirty: boolean, text: string) =>
        ({
          loadAsm: () => {},
          applyPresets: () => {},
          sourceDirty: () => dirty,
          source: () => text,
        }) as unknown as Store;

      es.openExercise(def, fake(false, def.template));
      es.saveDraftActive(fake(true, "lda $0300\nhlt")); // a pessoa digitou
      expect(es.progress().drafts[def.id]).toBe("lda $0300\nhlt");

      es.saveDraftActive(fake(false, "soma.asm inteiro")); // exemplo carregado: não é rascunho
      expect(es.progress().drafts[def.id]).toBe("lda $0300\nhlt");

      es.saveDraftActive(fake(true, "lda $0300\nsta $0302\nhlt")); // digitou de novo
      expect(es.progress().drafts[def.id]).toBe("lda $0300\nsta $0302\nhlt");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("solução de referência — oculta por padrão, e abrir nível esconde de novo", () => {
  it("alternar revela e esconde; openExercise reseta mesmo com a solução aberta", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      const es = await import("../src/web/exerciseState.js");
      const def = EXERCISES[0] as ExerciseDef;
      const fake = {
        loadAsm: () => {},
        applyPresets: () => {},
        sourceDirty: () => false,
        source: () => "",
      } as unknown as Store;

      expect(es.solucaoVisivel()).toBe(false);
      es.alternarSolucao();
      expect(es.solucaoVisivel()).toBe(true);

      // Abrir outro nível (ou reabrir o mesmo) esconde a solução que estava revelada.
      es.openExercise(def, fake);
      expect(es.solucaoVisivel()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("selectTrack — abre o primeiro nível não resolvido da trilha", () => {  it("pula os níveis já resolvidos e alinha a trilha ativa", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      const es = await import("../src/web/exerciseState.js");
      const store = {
        loadAsm: () => {},
        applyPresets: () => {},
        sourceDirty: () => false,
        source: () => "",
      } as unknown as Store;
      const track = TRACKS[0] as (typeof TRACKS)[number];
      es.solveWithHelp(track.exercises[0] as ExerciseDef);

      es.selectTrack(track, store);
      expect(es.activeTrack()).toBe(track);
      expect(es.activeExercise()).toBe(track.exercises[1]);
    } finally {
      vi.unstubAllGlobals();
    }
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
  it("a série tem os 11 níveis, com teoria, enunciado, dicas e ≥ 2 casos", () => {
    expect(EXERCISES.length).toBe(11);
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

describe("trilhas", () => {
  it("ids de trilha são únicos e toda trilha tem exercícios do catálogo", () => {
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
    for (const t of TRACKS) {
      expect(t.exercises.length).toBeGreaterThan(0);
      for (const d of t.exercises) expect(EXERCISES).toContain(d);
    }
  });

  it("a trilha Hello World reúne os sete exercícios da série original, em ordem", () => {
    const hello = TRACKS.find((t) => t.id === "hello-world");
    expect(hello?.exercises.map((d) => d.id)).toEqual([
      "ex1-soma",
      "ex2-paridade",
      "ex3-maior",
      "ex4-multiplica",
      "ex5-dobra",
      "ex6-string",
      "ex7-fib",
    ]);
    expect(hello?.exercises).toHaveLength(7);
  });

  it("a trilha De C para assembly traz os quatro níveis de construções do C, cada um com o trecho em C", () => {
    const c = TRACKS.find((t) => t.id === "c-para-asm");
    expect(c?.exercises.map((d) => d.id)).toEqual([
      "c1-variaveis",
      "c2-se",
      "c3-se-senao",
      "c4-loop",
    ]);
    for (const d of c?.exercises ?? []) {
      expect(d.cCode).toBeDefined();
    }
  });
});

describe("verifyActive — captura a marca do marcador de melhores execuções", () => {
  it("verificação que passa grava os ciclos; fonte que falha não mexe na marca", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      const es = await import("../src/web/exerciseState.js");
      const md = await import("../src/web/marcador.js");
      const def = EXERCISES[0] as ExerciseDef;
      const fake = {
        loadAsm: () => {},
        applyPresets: () => {},
        source: () => def.solution,
        sourceDirty: () => false,
        report: () => {},
      } as unknown as Store;
      es.openExercise(def, fake); // a UI abre o nível antes de submeter
      const resultados = es.verifyActive(fake);
      expect(resultados?.every((r) => r.passed)).toBe(true);
      const marca = md.melhor(def.id);
      expect(marca?.total).toBe(resultados?.reduce((s, r) => s + r.cycles, 0));
      // e o card guarda o detalhe: um caso da verificação por entrada
      expect(marca?.casos.map((c) => c.name)).toEqual(resultados?.map((r) => r.name));
      expect(marca?.casos.map((c) => c.ciclos)).toEqual(resultados?.map((r) => r.cycles));

      // Fonte que falha (o template) não altera a marca já feita.
      es.verifyActive({
        loadAsm: () => {},
        applyPresets: () => {},
        source: () => def.template,
        sourceDirty: () => false,
        report: () => {},
      } as unknown as Store);
      expect(md.melhor(def.id)).toBe(marca);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
