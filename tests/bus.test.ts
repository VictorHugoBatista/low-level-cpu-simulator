import { describe, expect, it } from "vitest";
import { SystemBus } from "../src/bus/bus";
import { Ram } from "../src/memory/ram";
import { MemoryMap } from "../src/memory/memoryMap";

describe("barramento e memória", () => {
  it("escrever e ler pela RAM devolve o mesmo byte", () => {
    const ram = new Ram(64);
    ram.write(0x1234, 0xab);
    expect(ram.read(0x1234)).toBe(0xab);
  });

  it("toda transferência fica registrada com endereço, dado, sinal e ciclo", () => {
    const bus = new SystemBus();
    bus.attach(new Ram(64));
    let cycle = 0;
    bus.setCycleProvider(() => cycle);

    bus.writeByte(0x0010, 0x5a);
    cycle = 7;
    const v = bus.readByte(0x0010);

    expect(v).toBe(0x5a);
    expect(bus.address).toBe(0x0010);
    expect(bus.read).toBe(true);
    expect(bus.write).toBe(false);
    expect(bus.transactions.length).toBe(2);
    expect(bus.transactions[0]).toMatchObject({ cycle: 0, address: 0x0010, data: 0x5a, write: true });
    expect(bus.transactions[1]).toMatchObject({ cycle: 7, address: 0x0010, data: 0x5a, write: false });
  });

  it("o mapa de memória roteia cada faixa para o seu dispositivo", () => {
    const map = new MemoryMap();
    const ramBaixa = new Ram(32);
    const ramAlta = new Ram(32);
    map.map(0x0000, 0x7fff, ramBaixa);
    map.map(0x8000, 0xffff, ramAlta);

    map.busWrite(0x0042, 0x11);
    map.busWrite(0x8042, 0x22);
    expect(ramBaixa.read(0x0042)).toBe(0x11);
    expect(ramAlta.read(0x8042)).toBe(0x22);
  });

  it("região mapeada por último vence sobre a anterior", () => {
    const map = new MemoryMap();
    const ram = new Ram(64);
    const espelho = new Ram(1);
    map.map(0x0000, 0xffff, ram);
    map.map(0xe800, 0xe8ff, espelho);

    map.busWrite(0xe800, 0x77);
    expect(espelho.read(0xe800)).toBe(0x77);
    expect(ram.read(0xe800)).toBe(0);
  });
});
