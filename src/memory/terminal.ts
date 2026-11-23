import { Byte, Word } from "../core/bytes.js";
import type { BusDevice } from "../bus/bus.js";

const MAX_CHARS = 65536;

/** Terminal memory-mapped em 0xE800: escrever um byte imprime o caractere. */
export class Terminal implements BusDevice {
  private chars: string[] = [];

  busRead(_address: Word): Byte {
    return 0; // por ora o terminal não tem registradores de leitura
  }

  busWrite(_address: Word, data: Byte): void {
    this.chars.push(String.fromCharCode(data & 0xff));
    if (this.chars.length > MAX_CHARS) this.chars.splice(0, this.chars.length - MAX_CHARS);
  }

  get text(): string {
    return this.chars.join("");
  }

  clear(): void {
    this.chars = [];
  }
}
