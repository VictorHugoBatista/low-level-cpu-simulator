import { describe, expect, it } from "vitest";
import { Machine } from "../src/runtime/machine.js";
import { DiskImage, SECTOR_SIZE } from "../src/storage/diskImage.js";
import { assemble } from "../src/asm/assembler.js";

// O loader (setor 0) e o programa (setor 1) — mesmos fontes de examples/
const BOOT_ASM = `.org $0200
  lda #$01
  sta $f001
  lda #$00
  sta $f002
  lda #$03
  sta $f003
  lda #$01
  sta $f000
  jmp $0300
`;

const HELLO_ASM = `.org $0300
  .equ ptr, $30
  lda #<msg
  sta ptr
  lda #>msg
  sta $31
  ldy #$00
loop:
  lda (ptr),y
  jz fim
  sta $e800
  inc ptr
  jmp loop
fim:
  hlt
msg:
  .ascii "Ola, MOS-6508!\\n"
  .db 0
`;

describe("terminal ($E800)", () => {
  it("escrever um byte no barramento imprime o caractere", () => {
    const m = new Machine();
    m.bus.writeByte(0xe800, 0x41); // 'A'
    m.bus.writeByte(0xe800, 0x0a); // '\n'
    m.bus.writeByte(0xe800, 0x42); // 'B'
    expect(m.terminal.text).toBe("A\nB");
  });

  it("leitura no terminal devolve 0 (sem registradores ainda)", () => {
    const m = new Machine();
    expect(m.bus.readByte(0xe800)).toBe(0);
  });
});

describe("imagem de disco", () => {
  it("fromBytes completa o último setor com $00", () => {
    const img = DiskImage.fromBytes(new Uint8Array([1, 2, 3]));
    expect(img.sectorCount).toBe(1);
    const sector = img.readSector(0);
    expect(sector[0]).toBe(1);
    expect(sector[2]).toBe(3);
    expect(sector[SECTOR_SIZE - 1]).toBe(0);
  });

  it("setor inexistente é erro claro", () => {
    const img = new DiskImage(2);
    expect(() => img.readSector(2)).toThrow(/setor inexistente: 2/);
  });
});

describe("controlador de disco (0xF000)", () => {
  it("ler setor copia 256 bytes para a RAM via barramento", () => {
    const m = new Machine();
    const img = new DiskImage(2);
    const data = new Uint8Array(SECTOR_SIZE);
    data[0] = 0xab;
    data[255] = 0xcd;
    img.writeSector(1, data);
    m.insertDisk(img);

    m.bus.writeByte(0xf001, 1); // LBA = 1
    m.bus.writeByte(0xf002, 0x00); // ADDR_LO
    m.bus.writeByte(0xf003, 0x04); // ADDR_HI → destino $0400
    m.bus.writeByte(0xf000, 1); // CMD = ler

    expect(m.ram.read(0x0400)).toBe(0xab);
    expect(m.ram.read(0x04ff)).toBe(0xcd);
    // cada byte copiado passou pelo barramento e ficou no trace
    expect(m.transactions.length).toBeGreaterThan(256);
  });

  it("gravar setor copia da RAM para o disco e marca o disco como alterado", () => {
    const m = new Machine();
    m.insertDisk(new DiskImage(2));
    m.ram.write(0x0500, 0x99);

    m.bus.writeByte(0xf001, 1);
    m.bus.writeByte(0xf002, 0x00);
    m.bus.writeByte(0xf003, 0x05);
    m.bus.writeByte(0xf000, 2); // CMD = gravar

    expect(m.diskController.disk.readSector(1)[0]).toBe(0x99);
    expect(m.diskController.disk.dirty).toBe(true);
    expect(m.diskController.lastCommand).toBe(0); // CMD volta a ocioso
  });

  it("comando desconhecido e setor inexistente são erros claros", () => {
    const m = new Machine();
    m.insertDisk(new DiskImage(2));
    m.bus.writeByte(0xf001, 5);
    expect(() => m.bus.writeByte(0xf000, 1)).toThrow(/setor inexistente: 5/);
    expect(() => m.bus.writeByte(0xf000, 9)).toThrow(/comando de disco desconhecido: 9/);
  });

  it("endereço sem dispositivo é erro, nunca leitura silenciosa", () => {
    const m = new Machine();
    expect(() => m.bus.readByte(0xf100)).toThrow(/nenhum dispositivo responde em 0xF100/);
  });
});

describe("M4 — prova: boot pelo disco e saída no terminal", () => {
  it("loader do setor 0 carrega o programa do setor 1, que imprime e para", () => {
    const loader = assemble(BOOT_ASM, "boot.asm");
    const hello = assemble(HELLO_ASM, "hello.asm");
    expect(loader.bytes.length).toBeLessThanOrEqual(SECTOR_SIZE);
    expect(hello.origin).toBe(0x0300);

    const disk = new DiskImage(256);
    disk.writeSector(0, Uint8Array.from(loader.bytes));
    disk.writeSector(1, Uint8Array.from(hello.bytes));

    const m = new Machine();
    m.insertDisk(disk);
    m.bootFromDisk();

    expect(m.cpu.regs.pc).toBe(0x0200); // o boot aponta o vetor para o loader

    m.run();

    expect(m.terminal.text).toBe("Ola, MOS-6508!\n");
    expect(m.isHalted).toBe(true);
  });

  it("boot com setor 0 vazio marcha pelos zeros e morre em endereço sem dispositivo", () => {
    const m = new Machine();
    m.insertDisk(new DiskImage(4));
    m.bootFromDisk();
    // $00 é NOP (implementado no M5): a execução atravessa a RAM zerada
    // até o primeiro endereço sem dispositivo — e o erro é claro
    expect(() => m.run()).toThrow(/nenhum dispositivo responde em 0xE000/);
  });
});
