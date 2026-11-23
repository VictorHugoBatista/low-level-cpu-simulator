import { Byte, Word, asByte } from "../core/bytes.js";

/** Um dispositivo que se pendura no barramento: RAM, terminal, controlador de disco... */
export interface BusDevice {
  busRead(address: Word): Byte;
  busWrite(address: Word, data: Byte): void;
}

/** Registro de uma transferência que passou pelo barramento (matéria-prima do tracer). */
export interface BusTransaction {
  readonly cycle: number;
  readonly address: Word;
  readonly data: Byte;
  readonly write: boolean;
}

/**
 * O barramento da AK-8: endereços de 16 bits, dados de 8 bits e sinais de controle.
 * Toda leitura e escrita da CPU passa por aqui e fica registrada — nada é invisível.
 */
export class SystemBus {
  /** Último valor colocado no barramento de endereços. */
  address: Word = 0;
  /** Último valor colocado no barramento de dados. */
  data: Byte = 0;
  /** Sinais de controle da última transferência. */
  read = false;
  write = false;

  private device: BusDevice | null = null;
  private history: BusTransaction[] = [];
  private cycleProvider: () => number = () => 0;

  attach(device: BusDevice): void {
    this.device = device;
  }

  /** O tracer precisa saber em que ciclo cada transferência aconteceu. */
  setCycleProvider(provider: () => number): void {
    this.cycleProvider = provider;
  }

  readByte(address: Word): Byte {
    if (this.device === null) throw new Error("nenhum dispositivo ligado ao barramento");
    this.address = address;
    this.read = true;
    this.write = false;
    this.data = this.device.busRead(address);
    this.record();
    return this.data;
  }

  writeByte(address: Word, data: Byte): void {
    if (this.device === null) throw new Error("nenhum dispositivo ligado ao barramento");
    this.address = address;
    this.read = false;
    this.write = true;
    this.data = asByte(data);
    this.record();
    this.device.busWrite(address, this.data);
  }

  get transactions(): readonly BusTransaction[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  private record(): void {
    this.history.push({
      cycle: this.cycleProvider(),
      address: this.address,
      data: this.data,
      write: this.write,
    });
  }
}
