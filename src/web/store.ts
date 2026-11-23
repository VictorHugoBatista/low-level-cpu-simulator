import { createSignal, onCleanup } from "solid-js";
import { Machine } from "../runtime/machine.js";
import type { BusTransaction } from "../bus/bus.js";
import { AsmError, assemble } from "../asm/assembler.js";
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
export function createStore() {
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
  const [asmError, setAsmError] = createSignal<string | null>(null);

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

  const report = (message: string | null): void => {
    setAsmError(message);
  };

  const loadAsm = (source: string, name: string): void => {
    try {
      const r = assemble(source, name);
      setAsmError(null);
      machine.loadProgram(r.bytes, r.origin);
      machine.reset();
      setProgram({ name, kind: "asm", origin: r.origin, bytes: r.bytes, entries: r.entries });
    } catch (e) {
      setAsmError(e instanceof AsmError ? e.message : String(e));
      return;
    }
    sync();
  };

  const loadBin = (bytes: Uint8Array, name: string, origin = 0x0200): void => {
    setAsmError(null);
    machine.loadProgram(Array.from(bytes), origin);
    machine.reset();
    setProgram({ name, kind: "bin", origin, bytes: Array.from(bytes), entries: [] });
    sync();
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
    asmError,
    toggleRun,
    stepClock,
    stepInstruction,
    reset,
    report,
    loadAsm,
    loadBin,
    toggleBreakpoint,
  };
}

export type Store = ReturnType<typeof createStore>;
