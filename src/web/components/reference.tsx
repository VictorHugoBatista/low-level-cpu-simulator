import { createSignal } from "solid-js";
import { MICROPROGRAMS } from "../../cpu/microops.js";
import { opcodeFor } from "../../cpu/opcodes.js";
import type { AddressingMode } from "../../cpu/opcodes.js";

interface ModeCell {
  mode: AddressingMode;
  cycles: number;
}

interface RefInstr {
  mnemonic: string;
  what: string;
  flags: string;
  use: string;
  modes: ModeCell[];
}

/** Os snippets de uso entram com a indentação de arquivo .asm; o <pre> não deve
 * abrir com a linha em branco que a template literal do TS deixa no começo. */
const snippet = (s: string): string => s.replace(/^\n+/, "").replace(/\s+$/, "");

const hex2 = (v: number): string => v.toString(16).toUpperCase().padStart(2, "0");

const MODE_COLS: Array<{ mode: AddressingMode; label: string }> = [
  { mode: "imm", label: "#" },
  { mode: "zp", label: "zp" },
  { mode: "abs", label: "abs" },
  { mode: "absX", label: "abs,X" },
  { mode: "indY", label: "(zp),Y" },
  { mode: "rel", label: "rel" },
  { mode: "impl", label: "sem op" },
];

/** Colunas totais da tabela de instruções: instr, o que faz, flags + os modos. */
const COLS = 3 + MODE_COLS.length;

// Ciclos e flags por instrução, conforme docs/ISA.md; os opcodes NÃO estão aqui —
// vêm de opcodeFor(), a tabela congelada, para o de-para nunca divergir do núcleo.
// Exportado para o teste que garante que todo exemplo de uso monta sem erro.
export const INSTRS: RefInstr[] = [
  { mnemonic: "LDA", what: "carrega um byte da memória em A", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$05        ; imediato: A = $05
        lda $0300       ; absoluto: A = M[$0300]
`) },
  { mnemonic: "STA", what: "guarda A na memória", flags: "—", modes: [{ mode: "zp", cycles: 3 }, { mode: "abs", cycles: 4 }, { mode: "absX", cycles: 5 }, { mode: "indY", cycles: 6 }],
    use: snippet(`
        sta $0300       ; M[$0300] = A (A não muda)
        sta $0300,x     ; indexado: M[$0300 + X] = A
`) },
  { mnemonic: "LDX", what: "carrega um byte da memória em X", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }],
    use: snippet(`
        ldx #$03        ; imediato: X = $03
        ldx $0300       ; absoluto: X = M[$0300]
`) },
  { mnemonic: "STX", what: "guarda X na memória", flags: "—", modes: [{ mode: "zp", cycles: 3 }, { mode: "abs", cycles: 4 }],
    use: snippet(`
        stx $0300       ; M[$0300] = X
`) },
  { mnemonic: "LDY", what: "carrega um byte da memória em Y", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }],
    use: snippet(`
        ldy #$03        ; imediato: Y = $03
        ldy $0300       ; absoluto: Y = M[$0300]
`) },
  { mnemonic: "STY", what: "guarda Y na memória", flags: "—", modes: [{ mode: "zp", cycles: 3 }, { mode: "abs", cycles: 4 }],
    use: snippet(`
        sty $0300       ; M[$0300] = Y
`) },
  { mnemonic: "ADD", what: "A ← A + M (soma, com flags completas)", flags: "Z N C V", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$02
        add #$03        ; A = $05; Z = 0, N = 0, C = 0, V = 0
`) },
  { mnemonic: "SUB", what: "A ← A − M (C=1 significa 'não houve borrow')", flags: "Z N C V", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$05
        sub #$02        ; A = $03; C = 1 significa "não houve borrow"
        sub #$07        ; A = $FC; C = 0 (houve borrow) e N = 1
`) },
  { mnemonic: "AND", what: "A ← A & M (e bit a bit)", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$E3
        and #$0F        ; A = $03: zera o nibble alto, mantém o baixo
`) },
  { mnemonic: "ORA", what: "A ← A | M (ou bit a bit)", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$41        ; 'A'
        ora #$20        ; A = $61: liga o bit 5 e vira minúscula 'a'
`) },
  { mnemonic: "XOR", what: "A ← A ⊕ M (ou exclusivo)", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$AA
        xor #$FF        ; A = $55: inverte todos os bits
`) },
  { mnemonic: "CMP", what: "A − M só para as flags (A não muda)", flags: "Z N C", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }],
    use: snippet(`
        lda #$0A
        cmp #$0A        ; Z = 1 e C = 1 (iguais); A continua $0A
        cmp #$0B        ; Z = 0, C = 0, N = 1 ($0A < $0B); A continua $0A
`) },
  { mnemonic: "INC", what: "M ← M + 1 direto na memória", flags: "Z N", modes: [{ mode: "zp", cycles: 5 }, { mode: "abs", cycles: 6 }, { mode: "absX", cycles: 7 }],
    use: snippet(`
        inc $0300       ; M[$0300] = M[$0300] + 1; flags leem o novo valor
`) },
  { mnemonic: "DEC", what: "M ← M − 1 direto na memória", flags: "Z N", modes: [{ mode: "zp", cycles: 5 }, { mode: "abs", cycles: 6 }, { mode: "absX", cycles: 7 }],
    use: snippet(`
        dec $0300       ; M[$0300] = M[$0300] - 1; flags leem o novo valor
`) },
  { mnemonic: "TAX", what: "X ← A (transferência)", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        lda #$2A
        tax             ; X = $2A; Z e N leem o $2A
`) },
  { mnemonic: "TXA", what: "A ← X", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        ldx #$2A
        txa             ; A = $2A; Z e N leem o $2A
`) },
  { mnemonic: "TAY", what: "Y ← A", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        lda #$2A
        tay             ; Y = $2A; Z e N leem o $2A
`) },
  { mnemonic: "TYA", what: "A ← Y", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        ldy #$2A
        tya             ; A = $2A; Z e N leem o $2A
`) },
  { mnemonic: "PHA", what: "empilha A na stack ($0100+SP, depois SP−−)", flags: "—", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        lda #$2A
        pha             ; empilha $2A em $0100 + SP e depois SP--
`) },
  { mnemonic: "PLA", what: "desempilha para A (SP++, depois lê)", flags: "Z N", modes: [{ mode: "impl", cycles: 3 }],
    use: snippet(`
        pla             ; SP++ e depois A = M[$0100 + SP]; Z e N leem o valor
`) },
  { mnemonic: "RTS", what: "retorna de JSR: PC ← retorno da stack", flags: "—", modes: [{ mode: "impl", cycles: 4 }],
    use: snippet(`
        jsr imprime     ; o RTS volta para cá
        hlt
imprime:
        rts             ; PC = retorno que o JSR empilhou
`) },
  { mnemonic: "SHL", what: "A ← A << 1; o bit 7 vai para C", flags: "C Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        lda #%00000101  ; $05
        shl             ; A = %00001010 ($0A); C = 0 (o bit 7 era 0)
`) },
  { mnemonic: "SHR", what: "A ← A >> 1; o bit 0 vai para C", flags: "C Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        lda #$05        ; %00000101
        shr             ; A = %00000010; C = 1 (o bit 0 era 1)
`) },
  { mnemonic: "NOT", what: "A ← ~A (inverte todos os bits)", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        lda #$00
        not             ; A = $FF; Z = 0, N = 1
`) },
  { mnemonic: "NOP", what: "não faz nada (1 byte de folga)", flags: "—", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        nop             ; nada acontece: 1 byte, 2 ciclos
`) },
  { mnemonic: "JMP", what: "PC ← endereço (desvio incondicional)", flags: "—", modes: [{ mode: "abs", cycles: 4 }],
    use: snippet(`
        jmp rotina      ; PC = endereço do rótulo; sem condição
rotina:
        hlt
`) },
  { mnemonic: "JSR", what: "chama sub-rotina: empilha o retorno e desvia", flags: "—", modes: [{ mode: "abs", cycles: 6 }],
    use: snippet(`
        jsr imprime     ; empilha o retorno e desvia
        hlt             ; roda depois do RTS
imprime:
        rts
`) },
  { mnemonic: "JZ", what: "desvia se Z = 1 (resultado zero)", flags: "—", modes: [{ mode: "rel", cycles: 3 }],
    use: snippet(`
        lda #$00
        jz igual        ; Z = 1: desvia
        sta $0300       ; (nunca executa)
igual:  hlt
`) },
  { mnemonic: "JNZ", what: "desvia se Z = 0", flags: "—", modes: [{ mode: "rel", cycles: 3 }],
    use: snippet(`
        lda #$03
        sta $0300       ; contador
loop:   dec $0300
        jnz loop        ; desvia enquanto o contador não chega a 0
        hlt
`) },
  { mnemonic: "JC", what: "desvia se C = 1 (carry / sem borrow)", flags: "—", modes: [{ mode: "rel", cycles: 3 }],
    use: snippet(`
        lda #$0A
        cmp #$05        ; C = 1: $0A - $05 sem borrow
        jc maior        ; desvia se C = 1
maior:  hlt
`) },
  { mnemonic: "JNC", what: "desvia se C = 0", flags: "—", modes: [{ mode: "rel", cycles: 3 }],
    use: snippet(`
        lda #$03
        cmp #$05        ; C = 0: houve borrow ($03 < $05)
        jnc menor       ; desvia se C = 0
menor:  hlt
`) },
  { mnemonic: "JN", what: "desvia se N = 1 (negativo)", flags: "—", modes: [{ mode: "rel", cycles: 3 }],
    use: snippet(`
        lda #$03
        sub #$05        ; A = $FE; N = 1
        jn negativo     ; desvia se N = 1
negativo:
        hlt
`) },
  { mnemonic: "HLT", what: "para a máquina", flags: "—", modes: [{ mode: "impl", cycles: 2 }],
    use: snippet(`
        hlt             ; para a máquina: o clock para de girar
`) },
];

const MEMORY_MAP: Array<[string, string]> = [
  ["$0000–$00FF", "página zero (endereçamento curto)"],
  ["$0100–$01FF", "stack"],
  ["$0200–$DFFF", "RAM do usuário (programa e dados)"],
  ["$E800–$E8FF", "terminal de saída (escrever um byte imprime o caractere)"],
  ["$F000–$F0FF", "controlador de disco: CMD, LBA, ADDR_LO, ADDR_HI"],
  ["$FF00–$FFFF", "RAM do topo — vetores: reset $FFFC/FD, interrupção $FFFE/FF"],
];

const ADDRESSING: Array<[string, string, string]> = [
  ["imediato", "#$nn", "o próprio valor constante"],
  ["zero page", "$nn", "byte na página 0 — a instrução fica um byte menor"],
  ["absoluto", "$hhhh", "endereço completo de 16 bits"],
  ["indexado", "$hhhh,X", "endereço absoluto deslocado por X"],
  ["indireto pós-indexado", "($nn),Y", "ponteiro de 2 bytes na página 0, deslocado por Y"],
  ["relativo", "rótulo", "offset com sinal (−128..127) contado do fim da instrução"],
];

const MACHINE_NOTES = [
  "Barramentos: endereços de 16 bits (64 KiB), dados de 8 bits, controle com READ/WRITE/CLK — toda transferência fica no histórico, nada é invisível.",
  "Registradores visíveis: A, X, Y, SP (stack na página $0100), PC de 16 bits e P de flags (C, Z, N, V).",
  "Registradores internos: IR (instrução), MAR (endereço), MDR (dado), TMP e T — é neles que o fetch fica visível no painel.",
  "Cada instrução é um microprograma: uma micro-operação por clock, e T0 é sempre o fetch do opcode.",
  "Assembler escolhe o modo sozinho: literal ou constante .equ ≤ $FF usa zero page; rótulo usa absoluto (ou relativo, nos desvios).",
  "Reset lê o vetor em $FFFC/FD; o boot pelo disco copia o setor 0 para $0200 e desvia — o setor 0 é o loader, como um MBR.",
];

const AKITA_VIDEO = "https://www.youtube.com/watch?v=8G80nuEyDN4";
const AKITA_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLdsnXVqbHDUcQIuiH9b-i9A85H3A2ZW5W";
const AKITA_TRANSCRIPT =
  "https://akitaonrails.com/2020/06/04/akitando-80-o-guia-hardcore-de-introducao-a-computacao";

function OpcodeCell(props: { instr: RefInstr; mode: AddressingMode }) {
  const spec = props.instr.modes.find((m) => m.mode === props.mode);
  if (spec === undefined) return <td class="nomode" />;
  const opcode = opcodeFor(props.instr.mnemonic, props.mode);
  if (opcode === undefined) return <td class="nomode" title="falta na tabela congelada? bug" />;
  const done = MICROPROGRAMS[opcode] !== undefined;
  return (
    <td
      classList={{ opc: true, todo: !done }}
      title={done ? undefined : "congelada na ISA, implementada no M5"}
    >
      {hex2(opcode)} · {spec.cycles}c
    </td>
  );
}

export function ReferencePage(props: {
  examples: Array<{ name: string; source: string; note: string }>;
}) {
  /** Mnemônicos cujo exemplo de uso está exposto na tabela de instruções. O
   * LDA começa aberto: mostra que a linha é expansível sem ler o hint. */
  const [abertas, setAbertas] = createSignal<Set<string>>(
    new Set<string>([INSTRS[0].mnemonic]),
  );

  /** Expande/fecha o exemplo de uso de uma instrução. */
  const alternar = (mnemonic: string) => {
    setAbertas((atual) => {
      const proximas = new Set(atual);
      if (proximas.has(mnemonic)) proximas.delete(mnemonic);
      else proximas.add(mnemonic);
      return proximas;
    });
  };

  /** Teclado: Enter e Espaço fazem o mesmo que o clique na linha. */
  const teclou = (e: KeyboardEvent, mnemonic: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      alternar(mnemonic);
    }
  };

  return (
    <div class="ref">
      <section class="panel credit">
        <h2>base didática</h2>
        <p>
          Esta aplicação é um simulador construído a partir da aula{" "}
          <strong>"O Guia +Hardcore de Introdução à COMPUTAÇÃO"</strong>, do Fabio Akita (
          <a href={AKITA_VIDEO} target="_blank" rel="noreferrer">
            [Akitando] #80 — assista aqui
          </a>
          ), parte da playlist{" "}
          <a href={AKITA_PLAYLIST} target="_blank" rel="noreferrer">
            "Como Computadores Funcionam?"
          </a>{" "}
          — a série que constrói a computação de baixo para cima: transistor, porta lógica,
          flip-flop, registrador, ULA, barramentos, memória, ciclo de busca e execução e, por fim,
          assembly. A arquitetura da MOS-6502 segue o mesmo percurso da aula: barramentos que registram
          cada byte, micro-operações uma por clock, boot por vetor de reset e disco em setores
          carregado por um loader. A{" "}
          <a href={AKITA_TRANSCRIPT} target="_blank" rel="noreferrer">
            transcrição da aula no site do Akita
          </a>{" "}
          acompanha o vídeo e vale como material de estudo.
        </p>
        <p>
          O nome é emprestado do 6502 de verdade — a máquina é uma homenagem a ele, não um
          clone. Em 1975, o time de Chuck Peddle e Bill Mensch — que havia deixado a Motorola
          depois do 6800 — anunciou o processador da MOS Technology por US$ 25, num mercado em
          que o Intel 8080 e o próprio 6800 custavam centenas de dólares, e o preço mudou a
          indústria. Uma família de primos de 8 bits da MOS rodou o Apple II, o Commodore PET,
          o BBC Micro, o Atari 2600 e o NES — o videogame que o Akita usa para ensinar o 6502 no
          vídeo seguinte da playlist. Este MOS-6502 é uma versão de estudo, não o chip
          completo: registradores, flags, stack e o ciclo de busca e execução seguem o espírito
          do original, mas a ISA é própria e enxuta (~30 instruções) para caber na cabeça.
        </p>
      </section>

      <section class="panel">
        <h2>a máquina em uma página</h2>
        <ul class="reflist">
          {MACHINE_NOTES.map((n) => (
            <li>{n}</li>
          ))}
        </ul>
      </section>

      <section class="panel">
        <h2>mapa de memória</h2>
        <table class="ref">
          <tbody>
            {MEMORY_MAP.map(([range, use]) => (
              <tr>
                <td class="rng">{range}</td>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div class="hint">fora dessas faixas, nenhum dispositivo responde e o acesso é erro.</div>
      </section>

      <section class="panel">
        <h2>modos de endereçamento</h2>
        <table class="ref">
          <tbody>
            {ADDRESSING.map(([name, syntax, what]) => (
              <tr>
                <td class="rng">{name}</td>
                <td class="opc">{syntax}</td>
                <td>{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section class="panel">
        <h2>instruções → opcodes e exemplos de uso</h2>
        <div class="hint">
          cada célula: opcode em hexa · ciclos. células apagadas estão congeladas na ISA mas o
          núcleo ainda não as executa (M5). fonte da verdade: docs/ISA.md, espelhada em
          src/cpu/opcodes.ts — esta página gera os hexas de lá. cada linha é expansível: clique
          (ou Enter/Espaço) para ver um exemplo de uso.
        </div>
        <table class="ref opcodes">
          <thead>
            <tr>
              <th>instr</th>
              <th>o que faz</th>
              <th>flags</th>
              {MODE_COLS.map((c) => (
                <th>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSTRS.map((instr) => (
              <>
                <tr
                  class="instr"
                  classList={{ aberta: abertas().has(instr.mnemonic) }}
                  tabIndex={0}
                  title={abertas().has(instr.mnemonic)
                    ? "fechar exemplo de uso"
                    : "ver exemplo de uso"}
                  onClick={() => alternar(instr.mnemonic)}
                  onKeyDown={(e: KeyboardEvent) => teclou(e, instr.mnemonic)}
                >
                  <td class="reg">
                    {instr.mnemonic}
                    <span class="tw">{abertas().has(instr.mnemonic) ? "▾" : "▸"}</span>
                  </td>
                  <td class="what">{instr.what}</td>
                  <td class="flags">{instr.flags}</td>
                  {MODE_COLS.map((c) => (
                    <OpcodeCell instr={instr} mode={c.mode} />
                  ))}
                </tr>
                {abertas().has(instr.mnemonic) && (
                  <tr class="uso">
                    <td colSpan={COLS}>
                      <pre>{instr.use}</pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </section>

      <section class="panel">
        <h2>os exemplos, explicados</h2>
        {props.examples.map((ex) => (
          <div class="example">
            <h3>{ex.name}</h3>
            <p>{ex.note}</p>
            <details>
              <summary>fonte</summary>
              <pre>{ex.source}</pre>
            </details>
          </div>
        ))}
      </section>
    </div>
  );
}
