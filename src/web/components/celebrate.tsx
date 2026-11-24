import { onCleanup, onMount } from "solid-js";
import { iniciarChuva } from "../crt.js";

/**
 * A celebração de nível concluído: a mensagem dentro de um terminal de fósforo
 * embutido — faixa escura nos dois temas (é um tubo ligando dentro da página),
 * com a chuva de opcodes por trás. Usada pela aba exercícios e pelo banner na
 * aba máquina.
 */
export function Celebrate(props: { texto: string }) {
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvas === undefined) return;
    const pararChuva = iniciarChuva(canvas);
    onCleanup(pararChuva);
  });

  return (
    <div class="ex-celebrate-box" role="status">
      <canvas ref={canvas} aria-hidden="true" />
      <p class="ex-celebrate">🏆 {props.texto}</p>
    </div>
  );
}
