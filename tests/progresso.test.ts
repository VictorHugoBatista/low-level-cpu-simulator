import { describe, expect, it, vi } from "vitest";
import {
  ProgressoInvalidoError,
  parseProgresso,
  serializarProgresso,
  nomeArquivoProgresso,
} from "../src/web/progressoArquivo.js";
import type { ProgressoSalvo } from "../src/web/progressoArquivo.js";
import type { Store } from "../src/web/store.js";

const arquivo = (extras: Partial<ProgressoSalvo> = {}): ProgressoSalvo => ({
  app: "mos6502-simulador",
  version: 1,
  savedAt: "2026-11-27T12:00:00.000Z",
  exercises: {
    solved: { "ex1-soma": "full" },
    drafts: { "ex1-soma": "LDA #$02" },
    hints: { "ex1-soma": 1 },
    last: "ex1-soma",
  },
  marcador: { marcas: { "ex1-soma": { total: 62, casos: [{ name: "caso 1", ciclos: 62 }] } } },
  ...extras,
});

describe("arquivo de progresso — parseProgresso", () => {
  it("serializar e parsear voltam ao mesmo arquivo (round-trip)", () => {
    const p = arquivo();
    expect(parseProgresso(serializarProgresso(p))).toEqual(p);
  });

  it("conteúdo que não é JSON é rejeitado com erro claro", () => {
    expect(() => parseProgresso("isto não é json")).toThrow(ProgressoInvalidoError);
    expect(() => parseProgresso("")).toThrow(ProgressoInvalidoError);
  });

  it("conteúdo que não é objeto (número, array) é rejeitado", () => {
    expect(() => parseProgresso("42")).toThrow(ProgressoInvalidoError);
    expect(() => parseProgresso("[1, 2]")).toThrow(ProgressoInvalidoError);
  });

  it("arquivo de outro app é rejeitado, com o motivo no aviso", () => {
    const p = JSON.stringify(arquivo({ app: "outro-jogo" }));
    try {
      parseProgresso(p);
      expect.unreachable("deveria ter rejeitado");
    } catch (e) {
      expect(e).toBeInstanceOf(ProgressoInvalidoError);
      expect((e as Error).message).toContain("não é um progresso deste simulador");
    }
  });

  it("versão futura é rejeitada com a versão que a página lê no aviso", () => {
    const p = JSON.stringify(arquivo({ version: 99 as ProgressoSalvo["version"] }));
    expect(() => parseProgresso(p)).toThrow("versão 99 não suportada");
  });

  it("campos internos estranhos são normalizados campo a campo, sem derrubar", () => {
    const p = parseProgresso(
      JSON.stringify({
        app: "mos6502-simulador",
        version: 1,
        savedAt: 42,
        exercises: {
          solved: { "ex1-soma": "full", "ex2-paridade": "cheated", "ex3-maior": 7 },
          drafts: { "ex1-soma": "LDA #$02", "ex2-paridade": { hack: true } },
          hints: { "ex1-soma": 2, "ex2-paridade": -1, "ex3-maior": "muitas" },
          last: 99,
        },
        marcador: { marcas: "tudo" },
      }),
    );
    expect(p.savedAt).toBe("");
    // só o "full" (status real) sobrevive em solved
    expect(p.exercises.solved).toEqual({ "ex1-soma": "full" });
    // só o rascunho que é texto sobrevive
    expect(p.exercises.drafts).toEqual({ "ex1-soma": "LDA #$02" });
    // só a contagem de dicas válida sobrevive (negativa e não-número caem)
    expect(p.exercises.hints).toEqual({ "ex1-soma": 2 });
    expect(p.exercises.last).toBeUndefined();
    expect(p.marcador).toEqual({ marcas: {} });
  });

  it("arquivo sem os campos de progresso vira estado vazio válido", () => {
    const p = parseProgresso(JSON.stringify({ app: "mos6502-simulador", version: 1 }));
    expect(p.exercises).toEqual({ solved: {}, drafts: {}, hints: {}, last: undefined });
    expect(p.marcador).toEqual({ marcas: {} });
  });
});

describe("nomeArquivoProgresso", () => {
  it("leva a data do dia no nome", () => {
    expect(nomeArquivoProgresso(new Date("2026-11-27T09:30:00Z"))).toBe("ak8-progresso-2026-11-27.json");
  });
});

describe("aplicarProgresso", () => {
  it("substitui níveis, rascunhos e marcas, reabre o último exercício e grava no localStorage", async () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    });
    try {
      vi.resetModules();
      const { aplicarProgresso } = await import("../src/web/progressoArquivo.js");
      const { progress, activeExercise } = await import("../src/web/exerciseState.js");
      const { melhor } = await import("../src/web/marcador.js");
      const p = parseProgresso(
        JSON.stringify(
          arquivo({
            exercises: {
              solved: { "ex1-soma": "full", "ex2-paridade": "help" },
              drafts: { "ex1-soma": "; rascunho do aluno\nLDA #$01" },
              hints: {},
              last: "ex1-soma",
            },
          }),
        ),
      );
      const carregado: { fonte?: string; nome?: string } = {};
      const fakeStore = {
        loadAsm: (fonte: string, nome: string) => {
          carregado.fonte = fonte;
          carregado.nome = nome;
        },
        applyPresets: () => {},
        report: () => {},
      } as unknown as Store;

      aplicarProgresso(p, fakeStore);

      expect(progress().solved).toEqual({ "ex1-soma": "full", "ex2-paridade": "help" });
      expect(progress().drafts["ex1-soma"]).toContain("rascunho do aluno");
      expect(melhor("ex1-soma")?.total).toBe(62);
      // o último exercício do arquivo reabre no editor, com o rascunho dele
      expect(activeExercise()?.id).toBe("ex1-soma");
      expect(carregado.nome).toBe("ex1-soma.asm");
      expect(carregado.fonte).toContain("rascunho do aluno");
      // e ficou gravado nas mesmas chaves do localStorage
      expect(JSON.parse(mem.get("ak8-exercises") as string).last).toBe("ex1-soma");
      expect(JSON.parse(mem.get("ak8-marcador") as string).marcas["ex1-soma"].total).toBe(62);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
