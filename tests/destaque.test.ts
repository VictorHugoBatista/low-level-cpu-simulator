import { describe, expect, it } from "vitest";
import { destacar, type Trecho } from "../src/web/destaque.js";

const classes = (linha: Trecho[]): (string | undefined)[] =>
  linha.map((t) => t.classe);

const textos = (linha: Trecho[]): string[] => linha.map((t) => t.texto);

describe("destaque de sintaxe do editor", () => {
  it("classifica a linha clássica do dialeto: mnemônico, número e comentário", () => {
    const linha = destacar("        lda $0301       ; A = primeiro valor")[0];
    expect(classes(linha)).toEqual([undefined, "mne", "num", "com"]);
    // o span do token vai até onde o próximo começa: o vão de espaço entre
    // eles viaja junto (e é invisível na renderização, pois é espaço em branco)
    expect(textos(linha)[1]).toBe("lda ");
    expect(textos(linha)[2].trim()).toBe("$0301");
    expect(textos(linha)[3]).toBe("; A = primeiro valor");
  });

  it("distingue label de mnemônico de símbolo comum", () => {
    const [label] = destacar("loopmul:")[0];
    expect(label.classe).toBe("lab");

    const [mne, sim] = destacar("jnz loopmul")[0];
    expect([mne.classe, sim.classe]).toEqual(["mne", "sim"]);
  });

  it("acende diretiva, imediato e operadores de modo de endereçamento", () => {
    const linha = destacar("        lda #$05        ; imediato")[0];
    expect(classes(linha)).toEqual([undefined, "mne", "op", "num", "com"]);
    expect(textos(linha)[2]).toBe("#");
    expect(textos(linha)[3].trim()).toBe("$05");
  });

  it("trata literal de caractere e string com ; dentro como um token só", () => {
    const [literal] = destacar(".byte 'A'")[0].slice(-1);
    expect(literal).toEqual({ texto: "'A'", classe: "num" });

    const linha = destacar('.byte "a;b"; resto')[0];
    expect(linha.find((t) => t.classe === "str")?.texto).toBe('"a;b"');
    expect(linha.at(-1)).toEqual({ texto: "; resto", classe: "com" });
  });

  it("acende a linha inteira quando o comentário começa na primeira coluna", () => {
    expect(destacar("; só um comentário")[0]).toEqual([
      { texto: "; só um comentário", classe: "com" },
    ]);
    expect(destacar("   ")[0]).toEqual([]);
  });

  it("reconstrói o fonte exato: a junção dos trechos devolve a entrada, byte a byte", () => {
    const fonte = [
      "; ex1 — soma (solução de referência)",
      "",
      "        .org $0200",
      "",
      "        lda $0300       ; A = primeiro valor",
      "        add $0301       ; A = A + segundo valor",
      "        sta $0302       ; grava o resultado",
      "loopmul:",
      "        add $301 ; adiciona o valor a si mesmo",
      "        hlt",
      "",
    ].join("\n");
    const reconstruido = destacar(fonte)
      .map((linha) => linha.map((t) => t.texto).join(""))
      .join("\n");
    expect(reconstruido).toBe(fonte);
  });
});
