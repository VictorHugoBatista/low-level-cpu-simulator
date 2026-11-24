import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine.js";
import { assemble } from "../src/asm/assembler.js";
import { OPCODES } from "../src/cpu/opcodes.js";
import { MICROPROGRAMS } from "../src/cpu/microops.js";
import { hex2 } from "../src/core/bytes.js";

/** Monta, carrega, reseta e roda até HLT — e devolve a máquina para inspeção. */
function runProgram(source: string): Machine {
  const r = assemble(source);
  const m = new Machine();
  m.loadProgram(r.bytes, r.origin);
  m.reset();
  m.run();
  return m;
}

describe("M5 — sem operando", () => {
  it("NOP não faz nada (mas custa o fetch)", () => {
    const m = runProgram("nop\n hlt\n");
    expect(m.isHalted).toBe(true);
    expect(m.cycleCount).toBe(4); // NOP 2 + HLT 2
    expect(m.cpu.regs.a).toBe(0);
  });

  it("transferências entre A, X e Y com flags ZN", () => {
    const m = runProgram("lda #$7f\n tax\n txa\n hlt\n");
    expect(m.cpu.regs.a).toBe(0x7f);
    expect(m.cpu.regs.x).toBe(0x7f);

    const zero = runProgram("lda #$00\n tay\n hlt\n");
    expect(zero.cpu.regs.y).toBe(0);
    expect(zero.cpu.regs.z).toBe(true);

    const neg = runProgram("lda #$ff\n tay\n hlt\n");
    expect(neg.cpu.regs.n).toBe(true);
  });

  it("SHL/SHR mandam o bit para o carry e atualizam ZN", () => {
    const shl = runProgram("lda #$80\n shl\n hlt\n");
    expect(shl.cpu.regs.a).toBe(0x00);
    expect(shl.cpu.regs.c).toBe(true);
    expect(shl.cpu.regs.z).toBe(true);

    const shr = runProgram("lda #$ff\n shr\n hlt\n");
    expect(shr.cpu.regs.a).toBe(0x7f);
    expect(shr.cpu.regs.c).toBe(true);
    expect(shr.cpu.regs.n).toBe(false); // 0x7f é positivo: N reflete o RESULTADO
  });

  it("NOT inverte todos os bits", () => {
    const m = runProgram("lda #$00\n not\n hlt\n");
    expect(m.cpu.regs.a).toBe(0xff);
    expect(m.cpu.regs.n).toBe(true);
  });
});

describe("M5 — stack", () => {
  it("PHA empilha e PLA desempilha com flags", () => {
    const m = runProgram("lda #$42\n pha\n lda #$00\n pla\n hlt\n");
    expect(m.cpu.regs.a).toBe(0x42);
    expect(m.cpu.regs.sp).toBe(0xff);
    expect(m.cpu.regs.z).toBe(false);
    expect(m.ram.read(0x01ff)).toBe(0x42); // o byte fica na stack
  });

  it("JSR empilha o retorno e RTS devolve ao ponto certo", () => {
    const m = runProgram(`.org $0200
      jsr sub
      lda #$01
      sta $0300
      hlt
sub:  lda #$42
      rts
`);
    expect(m.ram.read(0x0300)).toBe(1); // o fluxo passou pelo sub e voltou
    expect(m.cpu.regs.sp).toBe(0xff);
    expect(m.isHalted).toBe(true);
  });

  it("JSR/RTS aninham (duas chamadas seguidas)", () => {
    const m = runProgram(`.org $0200
      jsr sub
      jsr sub
      hlt
sub:  rts
`);
    expect(m.cpu.regs.sp).toBe(0xff);
    expect(m.isHalted).toBe(true);
  });
});

describe("M5 — ULA completa", () => {
  it("AND, ORA e XOR bit a bit", () => {
    expect(runProgram("lda #$f0\n and #$8c\n hlt\n").cpu.regs.a).toBe(0x80);
    expect(runProgram("lda #$f0\n ora #$0c\n hlt\n").cpu.regs.a).toBe(0xfc);
    expect(runProgram("lda #$ff\n xor #$0f\n hlt\n").cpu.regs.a).toBe(0xf0);
    const zero = runProgram("lda #$55\n xor #$55\n hlt\n");
    expect(zero.cpu.regs.a).toBe(0x00);
    expect(zero.cpu.regs.z).toBe(true);
  });

  it("CMP deixa A intacto, seta ZNC e NÃO toca o V", () => {
    const igual = runProgram("lda #$05\n cmp #$05\n hlt\n");
    expect(igual.cpu.regs.a).toBe(5);
    expect(igual.cpu.regs.z).toBe(true);
    expect(igual.cpu.regs.c).toBe(true);

    const menor = runProgram("lda #$05\n cmp #$06\n hlt\n");
    expect(menor.cpu.regs.c).toBe(false);
    expect(menor.cpu.regs.n).toBe(true);

    // 0x80 − 0x01 teria overflow em SUB; CMP não pode ligar o V
    const semV = runProgram("lda #$80\n cmp #$01\n hlt\n");
    expect(semV.cpu.regs.n).toBe(false); // o resultado 0x7f é positivo
    expect(semV.cpu.regs.c).toBe(true);
    expect(semV.cpu.regs.v).toBe(false);
  });
});

describe("M5 — modos de endereçamento", () => {
  it("zero page e absoluto,X em carga e armazenamento", () => {
    const m = runProgram(`.org $0200
      lda #$99
      sta $45         ; zero page: M[$0045] = $99
      ldx #$01
      lda $0044,x     ; absoluto,X: $0044+1 → A = $99
      sta $0300
      ldx #$02
      sta $0300,x     ; M[$0302] = $99
      hlt
`);
    expect(m.ram.read(0x0045)).toBe(0x99);
    expect(m.ram.read(0x0300)).toBe(0x99);
    expect(m.ram.read(0x0302)).toBe(0x99);
  });

  it("indireto pós-indexado lê e grava pelo ponteiro na página zero", () => {
    const m = runProgram(`.org $0200
      lda #$60
      sta $0040       ; ptr lo
      lda #$06
      sta $0041       ; ptr hi → aponta para $0634
      lda #$bb
      ldy #$00
      sta ($40),y     ; M[$0634] = $bb
      lda #$aa
      ldy #$01
      sta ($40),y     ; M[$0635] = $aa (base+Y em 16 bits, sem page-cross penalty)
      ldy #$00
      lda ($40),y     ; lê de volta
      sta $0400
      ldy #$01
      lda ($40),y
      sta $0401
      hlt
`);
    expect(m.ram.read(0x0400)).toBe(0xbb);
    expect(m.ram.read(0x0401)).toBe(0xaa);
  });

  it("ADD/SUB lendo da memória (zp e abs)", () => {
    const m = runProgram(`.org $0200
      lda #$14
      sta $30
      lda #$08
      sta $31
      lda #$06
      add $30         ; A = 6 + 20 = 26
      sub $31         ; A = 26 − 8 = 18
      hlt
`);
    expect(m.cpu.regs.a).toBe(18);
  });
});

describe("M5 — INC/DEC direto na memória", () => {
  it("INC e DEC com wrap e flags ZN", () => {
    const m = runProgram(`.org $0200
      lda #$ff
      sta $0050
      inc $0050       ; $ff → $00, Z=1
      inc $0050       ; → $01
      dec $0050       ; → $00, Z=1
      hlt
`);
    expect(m.ram.read(0x0050)).toBe(0);
    expect(m.cpu.regs.z).toBe(true);
  });

  it("INC com absoluto,X", () => {
    const m = runProgram(`.org $0200
      ldx #$02
      lda #$0f
      sta $0302
      inc $0300,x     ; M[$0302] = $10
      hlt
`);
    expect(m.ram.read(0x0302)).toBe(0x10);
  });
});

describe("M5 — desvios por carry e negativo", () => {
  it("JC toma o desvio quando o ADD gera carry", () => {
    const m = runProgram(`.org $0200
      lda #$ff
      add #$01        ; A = 0, C = 1
      jc caminhoc
      lda #$00
      sta $0300
      jmp fim
caminhoc:
      lda #$11
      sta $0300
fim:  hlt
`);
    expect(m.ram.read(0x0300)).toBe(0x11);
  });

  it("JNC toma o desvio quando não há carry (houve borrow)", () => {
    const m = runProgram(`.org $0200
      lda #$05
      sub #$06        ; A = $ff, C = 0, N = 1
      jnc caminhonc
      lda #$00
      sta $0300
      jmp fim
caminhonc:
      lda #$22
      sta $0300
fim:  hlt
`);
    expect(m.ram.read(0x0300)).toBe(0x22);
  });

  it("JN toma o desvio com resultado negativo", () => {
    const m = runProgram(`.org $0200
      lda #$05
      sub #$06        ; A = $ff, N = 1
      jn negativo
      lda #$00
      sta $0300
      jmp fim
negativo:
      lda #$33
      sta $0300
fim:  hlt
`);
    expect(m.ram.read(0x0300)).toBe(0x33);
  });
});

describe("M5 — cobertura da tabela congelada", () => {
  it("todo opcode congelado tem microprograma — a referência não volta a ficar apagada", () => {
    for (const key of Object.keys(OPCODES)) {
      const opcode = Number(key);
      const info = OPCODES[opcode];
      expect(MICROPROGRAMS[opcode], `0x${hex2(opcode)} (${info.mnemonic}) sem microprograma`).toBeDefined();
    }
  });

  it("todo microprograma corresponde a um opcode congelado — nada fora do contrato", () => {
    for (const key of Object.keys(MICROPROGRAMS)) {
      const opcode = Number(key);
      expect(OPCODES[opcode], `microprograma órfão em 0x${hex2(opcode)}`).toBeDefined();
    }
  });
});

describe("M5 — provas dos exemplos", () => {
  it("fib.asm: 8 iterações deixam fib(9) = 34 em $0301", () => {
    const m = runProgram(`.org $0200
      lda #$00
      sta $0300
      lda #$01
      sta $0301
      lda #$08
      sta $10
loop: lda $0300
      add $0301
      tay
      lda $0301
      sta $0300
      tya
      sta $0301
      dec $10
      jnz loop
      hlt
`);
    expect(m.ram.read(0x0300)).toBe(21); // fib(8)
    expect(m.ram.read(0x0301)).toBe(34); // fib(9)
  });

  it("hello.asm com loop imprime a string inteira no terminal", () => {
    const m = runProgram(`.org $0300
      .equ ptr, $30
      lda #<msg
      sta ptr
      lda #>msg
      sta $31
      ldy #$00
loop: lda (ptr),y
      jz fim
      sta $e800
      inc ptr
      jmp loop
fim:  hlt
msg:  .ascii "Ola, MOS-6508!\\n"
      .db 0
`);
    expect(m.terminal.text).toBe("Ola, MOS-6508!\n");
    expect(m.isHalted).toBe(true);
  });
});
