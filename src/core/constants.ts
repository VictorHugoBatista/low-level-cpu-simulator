/** Constantes do mapa de memória da MOS-6508 (ver PLAN.md e docs/ISA.md). */

export const STACK_PAGE = 0x0100;
export const TERMINAL_BASE = 0xe800;
export const DISK_BASE = 0xf000;
export const RESET_VECTOR = 0xfffc;
export const IRQ_VECTOR = 0xfffe;
