import { onCleanup, onMount } from "solid-js";
import { iniciarChuva } from "../crt.js";

/**
 * Tela de boot: o "jack in" curto ao carregar a página — log de BIOS sobre a
 * chuva de opcodes. Dura ~1,1 s, sai também ao clicar, e nem aparece para quem
 * desligou o CRT, já viu o boot nesta sessão ou pede menos animação no sistema
 * (a decisão mora em deveBootar, em app.tsx).
 */
export function BootScreen(props: { onDone: () => void }) {
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    const pararChuva = canvas === undefined ? () => {} : iniciarChuva(canvas);
    onCleanup(pararChuva);
    // Duração casada com o CSS (ver .boot): 5 linhas × 140 ms de log + 250 ms de
    // fade, com o unmount um passo depois do fade terminar.
    const t = setTimeout(props.onDone, 1150);
    onCleanup(() => clearTimeout(t));
  });

  return (
    <div class="boot" onClick={props.onDone} aria-hidden="true">
      <canvas class="boot-rain" ref={canvas} />
      <div class="boot-log">
        <span style="--i: 0">MOS-6502 BIOS 1.0 — 8 bits, barramento de 16</span>
        <span style="--i: 1">memória .......... ok</span>
        <span style="--i: 2">disco ............ ok</span>
        <span style="--i: 3">conectando à matrix</span>
        <span style="--i: 4">
          aguardando programa <span class="boot-cursor">▊</span>
        </span>
      </div>
    </div>
  );
}
