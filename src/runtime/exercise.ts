import { Machine } from "./machine.js";

/**
 * Verificador de exercícios: roda o programa do aluno numa máquina fresca para cada
 * caso de teste, com valores pre-colocados na RAM, e compara os endereços de destino
 * (e o terminal, quando o caso pede) com os valores esperados. Verifica comportamento,
 * nunca texto de fonte — soluções diferentes do gabarito passam do mesmo jeito.
 *
 * Isomórfico: nada daqui conhece DOM nem Node, então o mesmo código serve ao
 * dashboard, ao CLI e aos testes do vitest.
 */

export interface MemExpect {
  /** Endereço da RAM em que o valor é pre-colocado (preset) ou esperado (expect). */
  addr: number;
  value: number;
}

export interface ExerciseCase {
  /** Nome do caso, exibido no painel de resultado — descreve os valores de entrada. */
  name: string;
  /** Bytes gravados na RAM antes do reset: os valores de origem do problema. */
  preset?: MemExpect[];
  /** Bytes que os endereços de destino devem ter depois de HLT. */
  expect?: MemExpect[];
  /** Quando definido, o texto acumulado no terminal deve ser exatamente este. */
  expectTerminal?: string;
}

export interface ExerciseProgram {
  /** Origem do programa (a do .org montado). */
  origin: number;
  bytes: ArrayLike<number>;
}

export interface CaseResult {
  name: string;
  passed: boolean;
  /** false quando o programa não chegou a HLT dentro do teto de ciclos. */
  halted: boolean;
  cycles: number;
  /** Falhas legíveis, uma por endereço esperado divergente (ou pelo não-parar). */
  failures: string[];
}

const hex = (v: number): string => "0x" + v.toString(16).toUpperCase().padStart(2, "0");
const hex4 = (v: number): string => "$" + v.toString(16).toUpperCase().padStart(4, "0");

/** Roda um caso: máquina fresca, programa carregado, presets gravados, reset, run até HLT. */
export function runExerciseCase(
  program: ExerciseProgram,
  testCase: ExerciseCase,
  maxCycles = 200_000,
): CaseResult {
  const machine = new Machine();
  machine.loadProgram(program.bytes, program.origin);
  for (const p of testCase.preset ?? []) machine.ram.write(p.addr, p.value);
  machine.reset();
  machine.run(maxCycles);

  const failures: string[] = [];
  if (!machine.isHalted) {
    failures.push(
      `não parou (HLT) dentro de ${maxCycles} ciclos — loop infinito ou falta de HLT?`,
    );
  }
  for (const e of testCase.expect ?? []) {
    const got = machine.ram.read(e.addr);
    if (got !== e.value) {
      failures.push(
        `${hex4(e.addr)}: esperado ${hex(e.value)} (${e.value}), encontrado ${hex(got)} (${got})`,
      );
    }
  }
  if (testCase.expectTerminal !== undefined && machine.terminal.text !== testCase.expectTerminal) {
    failures.push(
      `terminal: esperado ${JSON.stringify(testCase.expectTerminal)}, ` +
        `encontrado ${JSON.stringify(machine.terminal.text)}`,
    );
  }

  return {
    name: testCase.name,
    passed: failures.length === 0,
    halted: machine.isHalted,
    cycles: machine.cycleCount,
    failures,
  };
}

/** Roda a sequência inteira de casos do exercício — cada um numa máquina fresca. */
export function runExerciseCases(
  program: ExerciseProgram,
  cases: readonly ExerciseCase[],
  maxCycles = 200_000,
): CaseResult[] {
  return cases.map((c) => runExerciseCase(program, c, maxCycles));
}
