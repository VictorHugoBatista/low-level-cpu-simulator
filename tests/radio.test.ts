import { describe, expect, it } from "vitest";
import {
  ESTACOES,
  RADIO_PADRAO,
  normalizarRadio,
  streamDaEstacao,
} from "../src/web/radio.js";

describe("preferência da rádio", () => {
  it("dado estranho de localStorage volta ao padrão, sem derrubar a página", () => {
    for (const lixo of [null, "sim", 42, [], { ligado: "sim" }]) {
      expect(normalizarRadio(lixo)).toEqual(RADIO_PADRAO);
    }
  });

  it("volume fora de 0..1 é clampado, e não rejeitado", () => {
    expect(normalizarRadio({ ligado: true, volume: 7, estacao: "vaporwaves" })).toEqual({
      ligado: true,
      volume: 1,
      estacao: "vaporwaves",
    });
    expect(normalizarRadio({ volume: -3 }).volume).toBe(0);
    expect(normalizarRadio({ volume: "alto" }).volume).toBe(RADIO_PADRAO.volume);
  });

  it("estação desconhecida (ou removida da lista) volta ao padrão; conhecida passa", () => {
    expect(normalizarRadio({ estacao: "fim-do-mundo" }).estacao).toBe(RADIO_PADRAO.estacao);
    expect(normalizarRadio({ estacao: "nightride" }).estacao).toBe("nightride");
  });

  it("ligado exige boolean de verdade — 'true' em string não liga a rádio", () => {
    expect(normalizarRadio({ ligado: "true" }).ligado).toBe(false);
    expect(normalizarRadio({ ligado: true }).ligado).toBe(true);
  });
});

describe("streams e fallback das estações", () => {
  it("a lista traz a ordem do plano: SomaFM primeiro (25 anos no ar), Nightride por último", () => {
    expect(ESTACOES.map((e) => e.id)).toEqual(["u80s", "vaporwaves", "nightride"]);
  });

  it("tentativa 0 é a primária; as seguintes são os espelhos de fallback", () => {
    const primaria = streamDaEstacao("u80s", 0);
    expect(primaria).toContain("ice1.somafm.com");
    const espelho = streamDaEstacao("u80s", 1);
    expect(espelho).toContain("ice2.somafm.com");
    expect(espelho).not.toBe(primaria);
  });

  it("acabaram os espelhos: undefined, que o player entende como offline", () => {
    expect(streamDaEstacao("nightride", 1)).toBeUndefined();
    expect(streamDaEstacao("u80s", 5)).toBeUndefined();
  });

  it("estação inexistente não tem stream nenhum", () => {
    expect(streamDaEstacao("fantasma", 0)).toBeUndefined();
  });
});
