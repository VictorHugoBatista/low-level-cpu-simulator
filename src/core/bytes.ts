/** Tipos e ajudantes numéricos da AK-8: bytes de 8 bits, words de 16 bits. */

export type Byte = number; // 0x00..0xFF
export type Word = number; // 0x0000..0xFFFF

export const asByte = (v: number): Byte => v & 0xFF;
export const asWord = (v: number): Word => v & 0xFFFF;
export const loByte = (v: Word): Byte => v & 0xFF;
export const hiByte = (v: Word): Byte => (v >>> 8) & 0xFF;
export const makeWord = (hi: Byte, lo: Byte): Word => asWord((hi << 8) | lo);

/** Interpreta um byte como inteiro com sinal (complemento de dois), para desvios relativos. */
export const toSigned = (v: Byte): number => ((v & 0x80) !== 0 ? v - 0x100 : v);

export const hex2 = (v: number): string => v.toString(16).toUpperCase().padStart(2, "0");
export const hex4 = (v: number): string => v.toString(16).toUpperCase().padStart(4, "0");
