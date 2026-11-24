import { onCleanup, onMount } from "solid-js";
import { BYTES_TODOS, iniciarChuva } from "../crt.js";

/**
 * A chuva de hexadecimais de fundo da página — a matrix toda atrás do conteúdo,
 * não só nos momentos de boot e celebração. Glifos de "00" a "FF" sorteados a
 * cada tique (puro ruído hex, sem pretensão de ser opcode).
 *
 * Segue o tema: fósforo no escuro, verde de acento sobre papel no claro — as
 * paletas mudam por quadro (a troca de tema limpa o rastro acumulado). Montada
 * só com o CRT ligado; a decisão fica em app.tsx.
 */
export function FundoChuva() {
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvas === undefined) return;
    const pararChuva = iniciarChuva(canvas, {
      bytes: BYTES_TODOS,
      escura: { glifo: "#4aff7f", rastro: "rgba(6, 10, 8, 0.18)" },
      clara: { glifo: "#087a35", rastro: "rgba(242, 245, 241, 0.18)" },
    });
    onCleanup(pararChuva);
  });

  return <canvas class="fundo-rain" ref={canvas} aria-hidden="true" />;
}
