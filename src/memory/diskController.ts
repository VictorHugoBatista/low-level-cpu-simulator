import { Byte, Word } from "../core/bytes.js";
import type { SystemBus } from "../bus/bus.js";
import type { BusDevice } from "../bus/bus.js";
import { SECTOR_SIZE } from "../storage/diskImage.js";
import type { DiskImage } from "../storage/diskImage.js";

export const DISK_CMD = 0xf000;
export const DISK_LBA = 0xf001;
export const DISK_ADDR_LO = 0xf002;
export const DISK_ADDR_HI = 0xf003;

const CMD_IDLE = 0;
const CMD_READ = 1;
const CMD_WRITE = 2;

/**
 * Controlador de disco mapeado em 0xF000 (I/O programado por bloco, sem DMA):
 * escrever 1 em CMD copia o setor LBA inteiro para a RAM, e 2 copia da RAM para o disco.
 * Cada byte copiado passa pelo barramento e fica registrado no trace.
 */
export class DiskController implements BusDevice {
  /** A imagem inserida; a máquina troca com insertDisk. */
  disk: DiskImage;

  private cmd: Byte = 0;
  private lba: Byte = 0;
  private addrLo: Byte = 0;
  private addrHi: Byte = 0;
  private bus: SystemBus | null = null;
  private inCommand = false;

  constructor(disk: DiskImage) {
    this.disk = disk;
  }

  attachBus(bus: SystemBus): void {
    this.bus = bus;
  }

  get lastCommand(): Byte {
    return this.cmd;
  }

  busRead(address: Word): Byte {
    switch (address & 0xff) {
      case 0x00:
        return this.cmd;
      case 0x01:
        return this.lba;
      case 0x02:
        return this.addrLo;
      case 0x03:
        return this.addrHi;
      default:
        return 0;
    }
  }

  busWrite(address: Word, data: Byte): void {
    switch (address & 0xff) {
      case 0x00:
        this.cmd = data;
        if (data !== CMD_IDLE) this.execute(data);
        break;
      case 0x01:
        this.lba = data;
        break;
      case 0x02:
        this.addrLo = data;
        break;
      case 0x03:
        this.addrHi = data;
        break;
    }
  }

  private execute(cmd: Byte): void {
    if (this.bus === null) throw new Error("controlador de disco sem barramento conectado");
    if (this.inCommand) {
      throw new Error(
        "comando de disco dentro de outro comando (o endereço aponta para o próprio controlador?)",
      );
    }
    if (cmd !== CMD_READ && cmd !== CMD_WRITE) {
      throw new Error(`comando de disco desconhecido: ${cmd}`);
    }
    if (this.lba >= this.disk.sectorCount) {
      throw new Error(
        `setor inexistente: ${this.lba} (o disco tem ${this.disk.sectorCount} setores)`,
      );
    }

    this.inCommand = true;
    try {
      const base = ((this.addrHi << 8) | this.addrLo) & 0xffff;
      if (cmd === CMD_READ) {
        const sector = this.disk.readSector(this.lba);
        for (let i = 0; i < SECTOR_SIZE; i++) {
          this.bus.writeByte((base + i) & 0xffff, sector[i]);
        }
      } else {
        const sector = new Uint8Array(SECTOR_SIZE);
        for (let i = 0; i < SECTOR_SIZE; i++) {
          sector[i] = this.bus.readByte((base + i) & 0xffff);
        }
        this.disk.writeSector(this.lba, sector);
      }
    } finally {
      this.inCommand = false;
      this.cmd = CMD_IDLE;
    }
  }
}
