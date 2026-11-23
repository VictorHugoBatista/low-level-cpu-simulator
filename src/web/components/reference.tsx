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
  modes: ModeCell[];
}

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

// Ciclos e flags por instrução, conforme docs/ISA.md; os opcodes NÃO estão aqui —
// vêm de opcodeFor(), a tabela congelada, para o de-para nunca divergir do núcleo.
const INSTRS: RefInstr[] = [
  { mnemonic: "LDA", what: "carrega um byte da memória em A", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "STA", what: "guarda A na memória", flags: "—", modes: [{ mode: "zp", cycles: 3 }, { mode: "abs", cycles: 4 }, { mode: "absX", cycles: 5 }, { mode: "indY", cycles: 6 }] },
  { mnemonic: "LDX", what: "carrega um byte da memória em X", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }] },
  { mnemonic: "STX", what: "guarda X na memória", flags: "—", modes: [{ mode: "zp", cycles: 3 }, { mode: "abs", cycles: 4 }] },
  { mnemonic: "LDY", what: "carrega um byte da memória em Y", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }] },
  { mnemonic: "STY", what: "guarda Y na memória", flags: "—", modes: [{ mode: "zp", cycles: 3 }, { mode: "abs", cycles: 4 }] },
  { mnemonic: "ADD", what: "A ← A + M (soma, com flags completas)", flags: "Z N C V", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "SUB", what: "A ← A − M (C=1 significa 'não houve borrow')", flags: "Z N C V", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "AND", what: "A ← A & M (e bit a bit)", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "ORA", what: "A ← A | M (ou bit a bit)", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "XOR", what: "A ← A ⊕ M (ou exclusivo)", flags: "Z N", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "CMP", what: "A − M só para as flags (A não muda)", flags: "Z N C", modes: [{ mode: "imm", cycles: 3 }, { mode: "zp", cycles: 4 }, { mode: "abs", cycles: 5 }, { mode: "absX", cycles: 6 }, { mode: "indY", cycles: 7 }] },
  { mnemonic: "INC", what: "M ← M + 1 direto na memória", flags: "Z N", modes: [{ mode: "zp", cycles: 5 }, { mode: "abs", cycles: 6 }, { mode: "absX", cycles: 7 }] },
  { mnemonic: "DEC", what: "M ← M − 1 direto na memória", flags: "Z N", modes: [{ mode: "zp", cycles: 5 }, { mode: "abs", cycles: 6 }, { mode: "absX", cycles: 7 }] },
  { mnemonic: "TAX", what: "X ← A (transferência)", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "TXA", what: "A ← X", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "TAY", what: "Y ← A", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "TYA", what: "A ← Y", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "PHA", what: "empilha A na stack ($0100+SP, depois SP−−)", flags: "—", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "PLA", what: "desempilha para A (SP++, depois lê)", flags: "Z N", modes: [{ mode: "impl", cycles: 3 }] },
  { mnemonic: "RTS", what: "retorna de JSR: PC ← retorno da stack", flags: "—", modes: [{ mode: "impl", cycles: 4 }] },
  { mnemonic: "SHL", what: "A ← A << 1; o bit 7 vai para C", flags: "C Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "SHR", what: "A ← A >> 1; o bit 0 vai para C", flags: "C Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "NOT", what: "A ← ~A (inverte todos os bits)", flags: "Z N", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "NOP", what: "não faz nada (1 byte de folga)", flags: "—", modes: [{ mode: "impl", cycles: 2 }] },
  { mnemonic: "JMP", what: "PC ← endereço (desvio incondicional)", flags: "—", modes: [{ mode: "abs", cycles: 4 }] },
  { mnemonic: "JSR", what: "chama sub-rotina: empilha o retorno e desvia", flags: "—", modes: [{ mode: "abs", cycles: 6 }] },
  { mnemonic: "JZ", what: "desvia se Z = 1 (resultado zero)", flags: "—", modes: [{ mode: "rel", cycles: 3 }] },
  { mnemonic: "JNZ", what: "desvia se Z = 0", flags: "—", modes: [{ mode: "rel", cycles: 3 }] },
  { mnemonic: "JC", what: "desvia se C = 1 (carry / sem borrow)", flags: "—", modes: [{ mode: "rel", cycles: 3 }] },
  { mnemonic: "JNC", what: "desvia se C = 0", flags: "—", modes: [{ mode: "rel", cycles: 3 }] },
  { mnemonic: "JN", what: "desvia se N = 1 (negativo)", flags: "—", modes: [{ mode: "rel", cycles: 3 }] },
  { mnemonic: "HLT", what: "para a máquina", flags: "—", modes: [{ mode: "impl", cycles: 2 }] },
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
          assembly. A arquitetura da AK-8 segue o mesmo percurso da aula: barramentos que registram
          cada byte, micro-operações uma por clock, boot por vetor de reset e disco em setores
          carregado por um loader. A{" "}
          <a href={AKITA_TRANSCRIPT} target="_blank" rel="noreferrer">
            transcrição da aula no site do Akita
          </a>{" "}
          acompanha o vídeo e vale como material de estudo.
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
        <h2>instruções → opcodes</h2>
        <div class="hint">
          cada célula: opcode em hexa · ciclos. células apagadas estão congeladas na ISA mas o
          núcleo ainda não as executa (M5). fonte da verdade: docs/ISA.md, espelhada em
          src/cpu/opcodes.ts — esta página gera os hexas de lá.
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
              <tr>
                <td class="reg">{instr.mnemonic}</td>
                <td class="what">{instr.what}</td>
                <td class="flags">{instr.flags}</td>
                {MODE_COLS.map((c) => (
                  <OpcodeCell instr={instr} mode={c.mode} />
                ))}
              </tr>
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
