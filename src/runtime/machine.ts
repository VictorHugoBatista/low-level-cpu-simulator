import { Byte, Word, hiByte, loByte } from "../core/bytes.js";
import { Clock } from "../core/clock.js";
import { RESET_VECTOR } from "../core/constants.js";
import { SystemBus } from "../bus/bus.js";
import type { BusTransaction } from "../bus/bus.js";
import { MemoryMap } from "../memory/memoryMap.js";
import { Ram } from "../memory/ram.js";
import { Terminal } from "../memory/terminal.js";
import { DiskController } from "../memory/diskController.js";
import { DiskImage, SECTOR_SIZE } from "../storage/diskImage.js";
import { Cpu } from "../cpu/cpu.js";

/**
 * A máquina inteira ligada: barramento, memória, terminal, disco e CPU. É o ponto de
 * entrada do simulador — o CLI e o dashboard no navegador falam com a MOS-6502 por aqui.
 */
export class Machine {
  readonly clock = new Clock();
  readonly bus = new SystemBus();
  readonly ram = new Ram(64);
  readonly terminal = new Terminal();
  readonly diskController = new DiskController(new DiskImage(256));
  readonly cpu: Cpu;

  /** O último programa carregado (loadProgram ou boot do disco), para o restartProgram. */
  private loadedProgram?: { bytes: Uint8Array; origin: Word };

  constructor() {
    const map = new MemoryMap();
    map.map(0x0000, 0xdfff, this.ram);
    map.map(0xff00, 0xffff, this.ram); // vetores e topo da memória
    map.map(0xe800, 0xe8ff, this.terminal);
    map.map(0xf000, 0xf0ff, this.diskController);
    this.diskController.attachBus(this.bus);
    this.bus.attach(map);
    this.bus.setCycleProvider(() => this.clock.cycleCount);
    this.cpu = new Cpu(this.bus);
  }

  /** Troca a imagem de disco (o controlador já ligado é mantido). */
  insertDisk(disk: DiskImage): void {
    this.diskController.disk = disk;
  }

  /** Grava bytes crus no início de um setor; o restante do setor volta a $00 — o mesmo
   * preparo que o preset de disco de um exercício faz, aqui na máquina visível. */
  writeDiskSector(lba: number, data: readonly number[]): void {
    const sector = new Uint8Array(SECTOR_SIZE);
    sector.set(Uint8Array.from(data).subarray(0, SECTOR_SIZE));
    this.diskController.disk.writeSector(lba, sector);
  }

  /**
   * O papel da BIOS: copia o setor 0 do disco para a RAM na origem, aponta o vetor de
   * reset para lá e reseta — a partir daí quem roda é o loader gravado no disco.
   */
  bootFromDisk(origin: Word = 0x0200): void {
    const loader = this.diskController.disk.readSector(0);
    this.loadedProgram = { bytes: Uint8Array.from(loader), origin };
    this.ram.load(origin, loader);
    this.ram.write(RESET_VECTOR, loByte(origin));
    this.ram.write(RESET_VECTOR + 1, hiByte(origin));
    this.reset();
  }

  /** Carrega um programa montado na RAM e grava o vetor de reset apontando para a origem —
   * ligar a máquina não "roda o arquivo", ela lê o vetor e desvia. */
  loadProgram(bytes: ArrayLike<number>, origin: Word = 0x0200): void {
    this.loadedProgram = { bytes: Uint8Array.from(bytes), origin };
    this.ram.load(origin, bytes);
    this.ram.write(RESET_VECTOR, loByte(origin));
    this.ram.write(RESET_VECTOR + 1, hiByte(origin));
  }

  /** Voltar ao começo da execução: regrava os bytes do último programa carregado (o que
   * restaura código que a execução tenha modificado), limpa o terminal e reseta — a
   * máquina fica como se o programa tivesse acabado de ser montado. Writes em área de
   * dados permanecem (é o que preserva as entradas de exercício na RAM), e reset() é o
   * recuo ainda mais leve: só registradores, clock e barramento. */
  restartProgram(): void {
    const loaded = this.loadedProgram;
    if (loaded !== undefined) this.loadProgram(loaded.bytes, loaded.origin);
    this.terminal.clear();
    this.reset();
  }

  reset(): void {
    this.clock.reset();
    this.bus.clearHistory();
    this.cpu.reset(this.bus);
  }

  get isHalted(): boolean {
    return this.cpu.halted;
  }

  get cycleCount(): number {
    return this.clock.cycleCount;
  }

  get transactions(): readonly BusTransaction[] {
    return this.bus.transactions;
  }

  /** Avança exatamente um ciclo de clock. */
  tick(): void {
    if (this.cpu.halted) return;
    this.clock.tick();
    this.cpu.tick();
  }

  /** Roda direto até HLT (ou até o teto de ciclos). Devolve os ciclos executados. */
  run(maxCycles = 1_000_000): number {
    let executed = 0;
    while (!this.cpu.halted && executed < maxCycles) {
      this.tick();
      executed++;
    }
    return executed;
  }
}
