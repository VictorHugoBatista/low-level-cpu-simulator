import { onCleanup, onMount } from "solid-js";
import { BYTES_TODOS, iniciarChuva } from "../crt.js";

/**
 * A chuva de hexadecimais de fundo da página — a matrix toda atrás do conteúdo,
 * não só nos momentos de boot e celebração. Glifos de "00" a "FF" sorteados a
 * cada tique (puro ruído hex, sem pretensão de ser opcode).
 *
 * Montada só com o CRT ligado e no tema escuro: no modo dia a chuva não tem
 * graça e suja o papel — a decisão de montar fica em app.tsx.
 */
export function FundoChuva() {
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvas === undefined) return;
    const pararChuva = iniciarChuva(canvas, { bytes: BYTES_TODOS });
    onCleanup(pararChuva);
  });

  return <canvas class="fundo-rain" ref={canvas} aria-hidden="true" />;
}
