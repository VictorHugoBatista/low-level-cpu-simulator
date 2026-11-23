import { Byte, Word, hex4 } from "../core/bytes.js";
import type { BusDevice } from "../bus/bus.js";

/**
 * Roteia endereços para dispositivos. Região mapeada por cima de outra (ex.: o controlador
 * de disco dentro do espaço endereçável) vale por ter sido mapeada por último.
 */
export class MemoryMap implements BusDevice {
  private regions: Array<{ start: Word; end: Word; device: BusDevice }> = [];

  map(start: Word, end: Word, device: BusDevice): void {
    if (end < start) throw new Error(`região inválida: ${hex4(start)}–${hex4(end)}`);
    this.regions.push({ start, end, device });
  }

  busRead(address: Word): Byte {
    return this.find(address).busRead(address);
  }

  busWrite(address: Word, data: Byte): void {
    this.find(address).busWrite(address, data);
  }

  private find(address: Word): BusDevice {
    // de trás para frente: a região mapeada por último ganha
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (address >= r.start && address <= r.end) return r.device;
    }
    throw new Error(`nenhum dispositivo responde em 0x${hex4(address)}`);
  }
}
