# ISA MOS-6508 — tabela congelada de opcodes (v1)

Este arquivo é o **contrato** entre o assembler (M2) e a CPU (M1–M5). A tabela de opcodes
está espelhada em `src/cpu/opcodes.ts`; as duas fontes não podem divergir. Qualquer mudança
a partir daqui exige nota na seção "Revisões", no fim do arquivo.

## Convenções

- little-endian em toda word: byte baixo primeiro, inclusive nos vetores e no stack.
- Modos de endereçamento e sintaxe do assembler: `#nn` imediato, `nn` zero page, `$hhhh`
  absoluto, `$hhhh,X` indexado, `($nn),Y` indireto pós-indexado, `rel` relativo.
- `M[...]` é uma leitura ou escrita que passa pelo barramento; toda transferência fica no
  trace com endereço, dado e sinal.
- Flags: `Z` (zero), `N` (negativo — bit 7 do resultado), `C` (carry), `V` (overflow com sinal).
- "Ciclos" = número de micro-operações = clocks gastos. O fetch do opcode conta como ciclo
  e vale para todas as instruções.

## Mapa geral dos 8 bits de opcode

| Faixa | Uso |
|---|---|
| 0x00–0x0A | instruções sem operando (1 byte) |
| 0x10–0xE3 | nibble alto = instrução, nibble baixo = modo de endereçamento |
| 0xF0–0xFF | fluxo de controle |
| resto | inválido — executar é erro, nunca NOP silencioso |

## Instruções sem operando (0x00–0x0A)

| Opcode | Mnemônico | Efeito | Ciclos | Flags |
|---|---|---|---|---|
| 00 | NOP | nada | 2 | — |
| 01 | TAX | X←A | 2 | Z N |
| 02 | TXA | A←X | 2 | Z N |
| 03 | TAY | Y←A | 2 | Z N |
| 04 | TYA | A←Y | 2 | Z N |
| 05 | PHA | M[0x0100+SP]←A; SP−− | 2 | — |
| 06 | PLA | SP++; A←M[0x0100+SP] | 3 | Z N |
| 07 | RTS | PC←retorno da stack | 4 | — |
| 08 | SHL | A←A<<1 (bit 7 vai para C) | 2 | C Z N |
| 09 | SHR | A←A>>1 (bit 0 vai para C) | 2 | C Z N |
| 0A | NOT | A←~A | 2 | Z N |

## Instruções com modo (0x10–0xE3)

Nibble alto = instrução, nibble baixo = modo: **0** imediato, **1** zero page, **2**
absoluto, **3** absoluto,X, **4** (zp),Y. Modos sem sentido para a instrução ficam fora da
tabela (ex.: STA não tem imediato).

| Nibble | Instr. | Efeito | Flags |
|---|---|---|---|
| 1 | LDA | A←M[efetivo] | Z N |
| 2 | STA | M[efetivo]←A | — |
| 3 | LDX | X←M[efetivo] | Z N |
| 4 | STX | M[efetivo]←X | — |
| 5 | LDY | Y←M[efetivo] | Z N |
| 6 | STY | M[efetivo]←Y | — |
| 7 | ADD | A←A+M[efetivo] | Z N C V |
| 8 | SUB | A←A−M[efetivo] | Z N C V |
| 9 | AND | A←A&M[efetivo] | Z N |
| A | ORA | A←A\|M[efetivo] | Z N |
| B | XOR | A←A^M[efetivo] | Z N |
| C | CMP | A−M[efetivo], só flags | Z N C |
| D | INC | M[efetivo]←M[efetivo]+1 | Z N |
| E | DEC | M[efetivo]←M[efetivo]−1 | Z N |

### Opcodes e custo em ciclos, por modo

| Instr. | imm | zp | abs | abs,X | (zp),Y |
|---|---|---|---|---|---|
| LDA | 10 (3) | 11 (4) | 12 (5) | 13 (6) | 14 (7) |
| STA | — | 21 (3) | 22 (4) | 23 (5) | 24 (6) |
| LDX | 30 (3) | 31 (4) | 32 (5) | — | — |
| STX | — | 41 (3) | 42 (4) | — | — |
| LDY | 50 (3) | 51 (4) | 52 (5) | — | — |
| STY | — | 61 (3) | 62 (4) | — | — |
| ADD | 70 (3) | 71 (4) | 72 (5) | 73 (6) | 74 (7) |
| SUB | 80 (3) | 81 (4) | 82 (5) | 83 (6) | 84 (7) |
| AND | 90 (3) | 91 (4) | 92 (5) | 93 (6) | 94 (7) |
| ORA | A0 (3) | A1 (4) | A2 (5) | A3 (6) | A4 (7) |
| XOR | B0 (3) | B1 (4) | B2 (5) | B3 (6) | B4 (7) |
| CMP | C0 (3) | C1 (4) | C2 (5) | C3 (6) | C4 (7) |
| INC | — | D1 (5) | D2 (6) | D3 (7) | — |
| DEC | — | E1 (5) | E2 (6) | E3 (7) | — |

Padrão por trás dos custos: cargas e operações em A gastam os ciclos dos operandos mais
leitura e write-back; stores terminam na própria escrita; INC/DEC na memória precisam ler,
calcular na ULA e escrever de volta.

## Fluxo de controle (0xF0–0xFF)

| Opcode | Mnemônico | Operando | Ciclos | Desvia quando |
|---|---|---|---|---|
| F0 | JMP | $hhhh | 4 | sempre |
| F1 | JSR | $hhhh | 6 | sempre (empilha o retorno) |
| F2 | JZ | rel | 3 | Z=1 |
| F3 | JNZ | rel | 3 | Z=0 |
| F4 | JC | rel | 3 | C=1 |
| F5 | JNC | rel | 3 | C=0 |
| F6 | JN | rel | 3 | N=1 |
| FF | HLT | — | 2 | — (para a máquina) |

Desvio relativo: byte em complemento de dois somado ao PC já avançado, que aponta para a
instrução seguinte.

## Semântica fixada

- **Vetores**: reset em 0xFFFC/FD (little-endian), lido pelo barramento ao ligar a máquina;
  0xFFFE/F reservado para interrupção. Carregar programa é escrever na RAM e apontar o
  vetor — a máquina nunca "recebe um PC de presente".
- **Stack**: página 0x0100, SP de 8 bits com wrap. PHA escreve em M[0x0100+SP] e depois
  decrementa; PLA incrementa e depois lê. JSR empilha o endereço de retorno completo (sem o
  "−1" do 6502), byte alto antes do baixo.
- **SUB**: C=1 significa "não houve borrow" (A ≥ operando), convenção herdada do SBC do 6502.
- **Modos indexados**: endereço efetivo = base + índice em 16 bits, sem page-cross penalty —
  modelo didático, deliberadamente simples.
- **Micro-operações de referência** (a notação do trace do simulador segue este formato):

```
LDA #$02      T0  MAR←PC; MDR←M[PC]; PC++; IR←MDR        (fetch)
              T1  MDR←M[PC] (imediato); PC++
              T2  A←MDR; ZN                               (3 ciclos)

LDA $0300     T0  fetch → T1 TMP←M[PC] (lo) → T2 TMP.hi←M[PC]
              T3  MAR←TMP; MDR←M[TMP] → T4 A←MDR; ZN      (5 ciclos)

STA $0300     T0  fetch → T1 TMP←M[PC] (lo) → T2 TMP.hi←M[PC]
              T3  M[TMP]←A                                (4 ciclos)
```

## Status de implementação

- ✅ **Tabela inteira implementada no núcleo (M5)**: todos os opcodes desta tabela têm
  microprograma em `src/cpu/microops.ts`.
- **M2**: assembler que gera exatamente estes bytes (com `#<`/`#>` para byte baixo/alto).

## Revisões

- 2026-11-23 — v1 congelada junto com o M1.
- 2026-11-23 — M5: microprogramas para toda a tabela; nenhuma mudança de opcode ou de
  semântica.
