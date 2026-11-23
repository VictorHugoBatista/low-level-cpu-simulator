import { Byte, Word, asByte, asWord } from "../core/bytes.js";
import type { BusDevice } from "../bus/bus.js";

/** Memória primária: RAM de acesso em 1 ciclo. */
export class Ram implements BusDevice {
  private readonly cells: Uint8Array;

  constructor(sizeKib = 64) {
    this.cells = new Uint8Array(sizeKib * 1024);
  }

  busRead(address: Word): Byte {
    return this.cells[address % this.cells.length];
  }

  busWrite(address: Word, data: Byte): void {
    this.cells[address % this.cells.length] = asByte(data);
  }

  read(address: Word): Byte {
    return this.busRead(address);
  }

  write(address: Word, data: Byte): void {
    this.busWrite(address, data);
  }

  /** Carrega bytes crus em um endereço (programa montado, setor de disco...). */
  load(origin: Word, bytes: ArrayLike<number>): void {
    for (let i = 0; i < bytes.length; i++) {
      this.busWrite(asWord(origin + i), bytes[i]);
    }
  }
}
