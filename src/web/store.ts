import { createSignal, onCleanup } from "solid-js";
import { Machine } from "../runtime/machine.js";
import type { BusTransaction } from "../bus/bus.js";
import { AsmError, assemble } from "../asm/assembler.js";
import { DiskImage, SECTOR_SIZE } from "../storage/diskImage.js";
import { applyCasePresets } from "../runtime/exercise.js";
import type { MemExpect } from "../runtime/exercise.js";
import type { ListingLine } from "../asm/emitter.js";

export interface LoadedProgram {
  name: string;
  kind: "asm" | "bin";
  origin: number;
  bytes: number[];
  entries: ListingLine[];
}

export interface RegSnapshot {
  pc: number;
  a: number;
  x: number;
  y: number;
  sp: number;
  p: number;
  ir: number;
  mar: number;
  mdr: number;
  t: number;
  c: boolean;
  z: boolean;
  n: boolean;
  v: boolean;
}

function snapshot(m: Machine): RegSnapshot {
  const r = m.cpu.regs;
  return {
    pc: r.pc,
    a: r.a,
    x: r.x,
    y: r.y,
    sp: r.sp,
    p: r.p,
    ir: r.ir,
    mar: r.mar,
    mdr: r.mdr,
    t: r.t,
    c: r.c,
    z: r.z,
    n: r.n,
    v: r.v,
  };
}

const HISTORY_VISIBLE = 512;

/**
 * A ponte entre o núcleo e a UI: envolve a Machine em signals do Solid. O núcleo continua
 * isomórfico — nada aqui vaza para dentro dele.
 */
export function createStore(initial?: { source: string; name: string }) {
  const machine = new Machine();
  const [regs, setRegs] = createSignal<RegSnapshot>(snapshot(machine));
  const [transactions, setTransactions] = createSignal<BusTransaction[]>([]);
  const [cycles, setCycles] = createSignal(0);
  const [halted, setHalted] = createSignal(true);
  const [running, setRunning] = createSignal(false);
  /** velocidade do Run em Hz; 0 = máximo */
  const [speed, setSpeed] = createSignal(0);
  const [program, setProgram] = createSignal<LoadedProgram | null>(null);
  const [breakpoints, setBreakpoints] = createSignal<ReadonlySet<number>>(new Set());
  const [memVersion, setMemVersion] = createSignal(0);
  const [lastAccess, setLastAccess] = createSignal<number | null>(null);
  /** Endereço inicial do dump de memória: no store para sobreviver a trocas de painel. */
  const [memStart, setMemStart] = createSignal(0x0200);
  const [terminalText, setTerminal] = createSignal(machine.terminal.text);
  const [notice, setNotice] = createSignal<string | null>(null);
  /** O fonte em edição no painel "fonte" — o que o botão montar usa. */
  const [source, setSource] = createSignal(initial?.source ?? "");

  let raf = 0;

  onCleanup(() => {
    setRunning(false);
    cancelAnimationFrame(raf);
  });

  const sync = (): void => {
    setRegs(snapshot(machine));
    setTransactions(machine.transactions.slice(-HISTORY_VISIBLE));
    const last = machine.transactions.at(-1);
    setLastAccess(last === undefined ? null : last.address);
    setCycles(machine.cycleCount);
    setHalted(machine.isHalted);
    setTerminal(machine.terminal.text);
    setMemVersion((v) => v + 1);
  };

  const rawTick = (): boolean => {
    if (machine.isHalted) return false;
    machine.tick();
    return true;
  };

  const stepClock = (): void => {
    setRunning(false);
    rawTick();
    sync();
  };

  const stepInstruction = (): void => {
    setRunning(false);
    if (rawTick()) {
      while (machine.cpu.regs.t > 0 && !machine.isHalted) machine.tick();
    }
    sync();
  };

  const loop = (): void => {
    if (!running()) return;
    const hz = speed();
    const budget = hz === 0 ? 20000 : Math.max(1, Math.round((hz * 1000) / 60));
    let ticks = 0;
    while (ticks < budget) {
      if (!rawTick()) {
        setRunning(false);
        break;
      }
      ticks++;
      if (breakpoints().has(machine.cpu.regs.pc)) {
        setRunning(false);
        break;
      }
    }
    if (ticks > 0) sync();
    raf = requestAnimationFrame(loop);
  };

  const toggleRun = (): void => {
    if (running()) {
      setRunning(false);
      return;
    }
    if (machine.isHalted) return;
    setRunning(true);
    raf = requestAnimationFrame(loop);
  };

  const reset = (): void => {
    setRunning(false);
    machine.reset();
    sync();
  };

  /** Voltar ao começo da execução: regrava os bytes do programa na RAM, limpa o terminal
   * e reseta. Writes em área de dados permanecem (é o que preserva as entradas de
   * exercício); o Reset é o recuo leve: só registradores, clock e barramento. */
  const restart = (): void => {
    setRunning(false);
    machine.restartProgram();
    sync();
  };

  const report = (message: string | null): void => {
    setNotice(message);
  };

  const loadAsm = (newSource: string, name: string): void => {
    setSource(newSource); // o editor passa a mostrar o que foi carregado
    try {
      const r = assemble(newSource, name);
      setNotice(null);
      machine.terminal.clear();
      machine.loadProgram(r.bytes, r.origin);
      machine.reset();
      setProgram({ name, kind: "asm", origin: r.origin, bytes: r.bytes, entries: r.entries });
    } catch (e) {
      setNotice(e instanceof AsmError ? e.message : String(e));
      return;
    }
    sync();
  };

  /** Grava os valores de entrada de um caso de exercício na RAM e reseta — as entradas
   * ficam na máquina visível para o caso ser desenvolvido e rodado à mão. */
  const applyPresets = (preset: readonly MemExpect[]): void => {
    setRunning(false);
    applyCasePresets(machine, preset);
    sync();
  };

  const loadBin = (bytes: Uint8Array, name: string, origin = 0x0200): void => {
    setNotice(null);
    setSource(""); // binário cru não tem fonte para editar
    machine.terminal.clear();
    machine.loadProgram(bytes, origin);
    machine.reset();
    setProgram({ name, kind: "bin", origin, bytes: Array.from(bytes), entries: [] });
    sync();
  };

  const loadDisk = (bytes: Uint8Array, name: string): void => {
    const img = DiskImage.fromBytes(bytes);
    machine.insertDisk(img);
    report(`disco carregado: ${name} (${img.sectorCount} setores)`);
  };

  /** Monta um .asm e grava os bytes como setor de um disco novo (para os exemplos). */
  const loadDiskFromAsm = (source: string, name: string, lba: number): void => {
    try {
      const r = assemble(source, name);
      if (r.bytes.length > SECTOR_SIZE) {
        setNotice(`${name}: programa com ${r.bytes.length} bytes não cabe em um setor`);
        return;
      }
      const img = new DiskImage(256);
      img.writeSector(lba, Uint8Array.from(r.bytes));
      machine.insertDisk(img);
      setNotice(null);
    } catch (e) {
      setNotice(e instanceof AsmError ? e.message : String(e));
    }
  };

  /** O papel da BIOS: setor 0 → RAM, vetor apontando para lá, reset. */
  const bootFromDisk = (): void => {
    setRunning(false);
    if (machine.diskController.disk.readSector(0).every((b) => b === 0x00)) {
      report("o setor 0 do disco está vazio — carregue um loader antes de bootar");
      return;
    }
    machine.terminal.clear();
    machine.bootFromDisk();
    sync();
  };

  /** Monta e carrega o que está no editor de fonte. */
  const assembleCurrent = (): void => {
    const p = program();
    const name = p !== null && p.kind === "asm" ? p.name : "editor.asm";
    loadAsm(source(), name);
  };

  const toggleBreakpoint = (addr: number): void => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(addr)) next.delete(addr);
      else next.add(addr);
      return next;
    });
  };

  return {
    machine,
    regs,
    transactions,
    cycles,
    halted,
    running,
    speed,
    setSpeed,
    program,
    breakpoints,
    memVersion,
    lastAccess,
    memStart,
    setMemStart,
    terminalText,
    notice,
    source,
    setSource,
    assembleCurrent,
    toggleRun,
    stepClock,
    stepInstruction,
    reset,
    restart,
    report,
    loadAsm,
    applyPresets,
    loadBin,
    loadDisk,
    loadDiskFromAsm,
    bootFromDisk,
    toggleBreakpoint,
  };
}

export type Store = ReturnType<typeof createStore>;
