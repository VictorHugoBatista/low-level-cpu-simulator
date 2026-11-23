import { describe, expect, it } from "vitest";
import { AsmError, assemble } from "../src/asm/assembler.js";
import { Machine } from "../src/runtime/machine.js";

const SOMA = [0x10, 0x02, 0x70, 0x03, 0x22, 0x00, 0x03, 0xff];
const SOMA_ASM = ".org $0200\n lda #$02\n add #$03\n sta $0300\n hlt\n";

describe("assembler — codificação", () => {
  it("soma.asm monta exatamente os bytes da prova do M1", () => {
    const r = assemble(SOMA_ASM);
    expect(r.origin).toBe(0x0200);
    expect(r.bytes).toEqual(SOMA);
  });

  it("fechamento M1 ↔ M2: monta, carrega e roda até o resultado", () => {
    const r = assemble(SOMA_ASM);
    const m = new Machine();
    m.loadProgram(r.bytes, r.origin);
    m.reset();
    m.run();
    expect(m.ram.read(0x0300)).toBe(5);
    expect(m.isHalted).toBe(true);
  });

  it("rótulos resolvem para frente e para trás", () => {
    const frente = assemble(".org $0200\n jz fim\n lda #$01\n sta $0300\nfim: hlt\n");
    expect(frente.bytes).toEqual([0xf2, 0x05, 0x10, 0x01, 0x22, 0x00, 0x03, 0xff]);

    const tras = assemble("volta: jz volta\n");
    expect(tras.bytes).toEqual([0xf2, 0xfe]);
  });

  it("literal que cabe em um byte usa zero page; rótulo usa absoluto", () => {
    expect(assemble("lda $10").bytes).toEqual([0x11, 0x10]);
    expect(assemble("lda $0300").bytes).toEqual([0x12, 0x00, 0x03]);
    expect(assemble(".equ tam, $10\n lda tam").bytes).toEqual([0x11, 0x10]);
    expect(assemble(".org $0200\nnada: hlt\n lda nada").bytes).toEqual([
      0xff, 0x12, 0x00, 0x02,
    ]);
  });

  it("diretivas .db, .dw e .ascii emitem os bytes esperados", () => {
    const r = assemble('.org $0200\n .db 1, $ff, \'A\'\n .dw $1234\n .ascii "Oi\\n"');
    expect(r.bytes).toEqual([0x01, 0xff, 0x41, 0x34, 0x12, 0x4f, 0x69, 0x0a]);
  });

  it("imediato aceita negativo e vira complemento de dois", () => {
    expect(assemble("lda #-1").bytes).toEqual([0x10, 0xff]);
  });

  it("#<rótulo e #>rótulo devolvem byte baixo e alto", () => {
    const src = 'msg: .ascii "AB"\n lda #<msg\n lda #>msg\n';
    const r = assemble(src);
    // msg em $0200 (2 bytes da string), lda em $0202 e $0204
    expect(r.bytes).toEqual([0x41, 0x42, 0x10, 0x00, 0x10, 0x02]);
  });

  it("codificação das instruções novas do M5", () => {
    expect(assemble("nop").bytes).toEqual([0x00]);
    expect(assemble("pha").bytes).toEqual([0x05]);
    expect(assemble("sta ($20),y").bytes).toEqual([0x24, 0x20]);
    expect(assemble("inc $10").bytes).toEqual([0xd1, 0x10]);
    expect(assemble("jsr $0300").bytes).toEqual([0xf1, 0x00, 0x03]);
    expect(assemble("ldx #$10").bytes).toEqual([0x30, 0x10]);
  });

  it("listing traz endereço, bytes e fonte", () => {
    const r = assemble(".org $0200\n lda #$02\n hlt\n");
    expect(r.listing).toContain("0200  10 02");
    expect(r.listing).toContain("0202  FF");
  });
});

describe("assembler — erros", () => {
  it("instrução desconhecida aponta arquivo e linha", () => {
    try {
      assemble("lda #$01\n xpto #$02\n", "teste.asm");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AsmError);
      expect((e as Error).message).toContain("teste.asm:2");
      expect((e as Error).message).toContain("instrução desconhecida: xpto");
    }
  });

  it("rótulo duplicado e símbolo inexistente", () => {
    expect(() => assemble("a: hlt\n a: hlt")).toThrow(/símbolo já definido: a/);
    expect(() => assemble("lda faltando")).toThrow(/símbolo não definido: faltando/);
  });

  it("sta e desvios não aceitam imediato", () => {
    expect(() => assemble("sta #$05")).toThrow(/não aceita imediato/);
    expect(() => assemble("jz #$05")).toThrow(/não aceita imediato/);
  });

  it("desvio fora de alcance é erro com a distância na mensagem", () => {
    const zeros = Array(200).fill("0").join(", ");
    expect(() => assemble(`.org $0200\n jz longe\n .db ${zeros}\nlonge: hlt\n`)).toThrow(
      /desvio fora de alcance: 200/,
    );
  });

  it("endereço negativo em modo absoluto é erro", () => {
    expect(() => assemble("lda -5")).toThrow(/endereço negativo/);
  });
});

describe("assembler — integração com o M1", () => {
  it("programa com desvios roda e grava o valor do caminho tomado", () => {
    const r = assemble(`.org $0200
      lda #$05
      sub #$05
      jz igual
      lda #$00
      sta $0300
      jmp fim
igual: lda #$01
      sta $0300
fim:  hlt
`);
    const m = new Machine();
    m.loadProgram(r.bytes, r.origin);
    m.reset();
    m.run();
    expect(m.ram.read(0x0300)).toBe(1);
    expect(m.isHalted).toBe(true);
  });
});
