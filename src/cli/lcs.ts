#!/usr/bin/env node
// CLI da MOS-6508 (low-level cpu simulator). Único lugar do projeto que fala com o Node.
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { AsmError, assemble } from "../asm/assembler.js";
import { Machine } from "../runtime/machine.js";
import { DiskImage } from "../storage/diskImage.js";
import { hex2, hex4 } from "../core/bytes.js";

interface ParsedArgs {
  positional: string[];
  flags: Map<string, string | true>;
}

function parseArgs(argv: string[], valued: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("-") && a.length > 1) {
      const name = a.replace(/^--?/, "");
      if (valued.includes(name)) {
        flags.set(name, argv[i + 1] ?? "");
        i++;
      } else {
        flags.set(name, true);
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

const flagValue = (flags: ParsedArgs["flags"], name: string, fallback: string): string => {
  const v = flags.get(name);
  return typeof v === "string" && v !== "" ? v : fallback;
};

const hasFlag = (flags: ParsedArgs["flags"], name: string): boolean => flags.has(name);

function usage(): never {
  console.error(`uso:
  lcs assemble <arquivo.asm> [-o saida.bin] [--lst saida.lst]
  lcs mkdisk <saida.disk> <payload.bin> [--lba 1] [--setores 256]
  lcs run [arquivo.bin] [--disk x.disk] [--origin 0x0200] [--trace] [--step] [--max 1000000]

Com --disk e sem arquivo.bin, a máquina boota do setor 0 do disco.`);
  process.exit(1);
}

function printState(m: Machine): void {
  const r = m.cpu.regs;
  const flags = ([["C", r.c], ["Z", r.z], ["N", r.n], ["V", r.v]] as const)
    .filter(([, on]) => on)
    .map(([f]) => f)
    .join("");
  console.log(
    `PC=$${hex4(r.pc)}  A=$${hex2(r.a)}  X=$${hex2(r.x)}  Y=$${hex2(r.y)}  SP=$${hex2(r.sp)}  ` +
      `P=${flags || "--"}  IR=$${hex2(r.ir)}  MAR=$${hex4(r.mar)}  MDR=$${hex2(r.mdr)}  T=${r.t}  ciclos=${m.cycleCount}`,
  );
}

function printTransaction(t: { cycle: number; address: number; data: number; write: boolean }): void {
  console.log(
    `  ciclo ${String(t.cycle).padStart(4)}  ${t.write ? "WRITE" : "READ "}  ${hex4(t.address)}  ${hex2(t.data)}`,
  );
}

function cmdAssemble(argv: string[]): void {
  const { positional, flags } = parseArgs(argv, ["o", "lst"]);
  const file = positional[0];
  if (file === undefined) usage();

  let result;
  try {
    result = assemble(readFileSync(file, "utf8"), file);
  } catch (e) {
    if (e instanceof AsmError) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }

  const out = flagValue(flags, "o", file.replace(/\.asm$/i, "") + ".bin");
  const lst = flagValue(flags, "lst", file.replace(/\.asm$/i, "") + ".lst");
  writeFileSync(out, Buffer.from(result.bytes));
  writeFileSync(lst, result.listing, "utf8");
  console.log(
    `${result.bytes.length} bytes, origem $${hex4(result.origin)} → ${out} (listing: ${lst})`,
  );
}

function cmdMkdisk(argv: string[]): void {
  const { positional, flags } = parseArgs(argv, ["lba", "setores"]);
  const out = positional[0];
  const payload = positional[1];
  if (out === undefined || payload === undefined) usage();

  const lba = Number(flagValue(flags, "lba", "1"));
  const sectors = Number(flagValue(flags, "setores", "256"));
  const img = new DiskImage(sectors);
  const bytes = readFileSync(payload);
  if (bytes.length > 256) {
    console.error(`aviso: ${payload} tem ${bytes.length} bytes (mais que um setor)`);
  }
  img.writeSector(lba, bytes);
  writeFileSync(out, Buffer.from(img.toBytes()));
  console.log(`disco ${out}: ${sectors} setores, payload de ${bytes.length} bytes no setor ${lba}`);
}

async function cmdRun(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, ["origin", "max", "disk"]);
  const binPath = positional[0];
  const diskPath = flagValue(flags, "disk", "") || undefined;
  if (binPath === undefined && diskPath === undefined) usage();

  const origin = Number(flagValue(flags, "origin", "0x0200"));
  const max = Number(flagValue(flags, "max", "1000000"));
  const trace = hasFlag(flags, "trace");
  const step = hasFlag(flags, "step");

  const m = new Machine();
  if (diskPath !== undefined) {
    m.insertDisk(DiskImage.fromBytes(readFileSync(diskPath)));
  }
  if (binPath !== undefined) {
    m.loadProgram(Array.from(readFileSync(binPath)), origin);
    m.reset();
  } else {
    m.bootFromDisk(origin);
  }

  const rl = step ? createInterface({ input: process.stdin }) : null;
  let printed = 0;
  let executed = 0;

  while (!m.isHalted && executed < max) {
    m.tick();
    executed++;
    if (trace || step) {
      for (; printed < m.transactions.length; printed++) {
        printTransaction(m.transactions[printed]);
      }
    }
    if (step && rl !== null) {
      printState(m);
      await new Promise<void>((res) => rl.once("line", () => res()));
    }
  }
  rl?.close();

  printState(m);

  const text = m.terminal.text;
  if (text.length > 0) {
    console.log(`--- terminal ($E800) ---\n${text}------------------------`);
  }

  if (diskPath !== undefined && m.diskController.disk.dirty) {
    writeFileSync(diskPath, Buffer.from(m.diskController.disk.toBytes()));
    console.log(`disco alterado durante a execução, gravado de volta em ${diskPath}`);
  }

  console.log(
    m.isHalted
      ? `parou em HLT após ${executed} ciclos`
      : `teto de ${max} ciclos atingido sem HLT`,
  );
}

const argv = process.argv.slice(2);
const cmd = argv.shift();
if (cmd === "assemble") cmdAssemble(argv);
else if (cmd === "mkdisk") cmdMkdisk(argv);
else if (cmd === "run") cmdRun(argv).catch((e) => { console.error(e); process.exit(1); });
else usage();
