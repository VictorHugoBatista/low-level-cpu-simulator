export const SECTOR_SIZE = 256;

/**
 * A memória secundária: imagem de disco bruta em setores de 256 B, setor 0 primeiro,
 * sem cabeçalho — o arquivo .disk é exatamente estes bytes.
 */
export class DiskImage {
  private readonly data: Uint8Array;
  /** Marcado quando algo gravou no disco (o CLI usa para salvar de volta). */
  dirty = false;

  constructor(sectors: number) {
    if (sectors < 1) throw new Error("o disco precisa de ao menos 1 setor");
    this.data = new Uint8Array(sectors * SECTOR_SIZE);
  }

  get sectorCount(): number {
    return this.data.length / SECTOR_SIZE;
  }

  /** Cria uma imagem a partir de bytes crus; completa o último setor com $00. */
  static fromBytes(bytes: Uint8Array): DiskImage {
    const sectors = Math.max(1, Math.ceil(bytes.length / SECTOR_SIZE));
    const img = new DiskImage(sectors);
    img.data.set(bytes.subarray(0, img.data.length));
    return img;
  }

  readSector(lba: number): Uint8Array {
    this.check(lba);
    return this.data.subarray(lba * SECTOR_SIZE, (lba + 1) * SECTOR_SIZE);
  }

  writeSector(lba: number, bytes: Uint8Array): void {
    this.check(lba);
    this.data.set(bytes.subarray(0, SECTOR_SIZE), lba * SECTOR_SIZE);
    this.dirty = true;
  }

  toBytes(): Uint8Array {
    return this.data.slice();
  }

  private check(lba: number): void {
    if (lba < 0 || lba >= this.sectorCount) {
      throw new Error(`setor inexistente: ${lba} (o disco tem ${this.sectorCount} setores)`);
    }
  }
}
