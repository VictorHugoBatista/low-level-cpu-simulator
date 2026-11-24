import { OPCODES } from "../cpu/opcodes.js";

/**
 * Chuva de bytes — a referência Matrix no idioma da máquina: as colunas que caem
 * são os opcodes reais da ISA, derivados de src/cpu/opcodes.ts (fonte única dos
 * hexas). Vive em src/web porque desenha em canvas; o núcleo não sabe que render
 * existe.
 *
 * O efeito nasce discreto (opacidade baixa, ~15 fps) e se nega a desenhar quando
 * o CRT está desligado ou o sistema pede menos animação.
 */

/** Os hexas que a máquina realmente executa: "00", "EA", "A9"… */
export const BYTES_OPCODES: string[] = Object.keys(OPCODES).map((decimal) =>
  Number(decimal).toString(16).padStart(2, "0").toUpperCase(),
);

/** A faixa completa de um byte, "00" a "FF" — puro ruído hexadecimal, para a
 * chuva de fundo da página, que não precisa ser opcode de verdade. */
export const BYTES_TODOS: string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, "0").toUpperCase(),
);

/** Opções da chuva: por padrão caem os opcodes da ISA; o fundo da página pede
 * os 256 bytes possíveis. */
export type ChuvaOpcoes = { bytes?: string[] };

/** Passo vertical da coluna em px — também é o tamanho do glifo. */
const PASSO = 14;

/** Largura de cada coluna em px. */
const COLUNA = 22;

/**
 * Inicia a animação no canvas e devolve a função de limpeza (cancela o loop e
 * os observadores). Não retorna nada visível se o movimento deve ser reduzido.
 */
export function iniciarChuva(
  canvas: HTMLCanvasElement,
  opcoes: ChuvaOpcoes = {},
): () => void {
  const bytes = opcoes.bytes ?? BYTES_OPCODES;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return () => {};

  /** y (em linhas) da cabeça de cada coluna. */
  let colunas: number[] = [];

  const ajustar = (): void => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    colunas = Array.from({ length: Math.ceil(canvas.width / COLUNA) }, () =>
      Math.floor((Math.random() * canvas.height) / PASSO),
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  ajustar();
  const observador = new ResizeObserver(ajustar);
  observador.observe(canvas);

  let raf = 0;
  let ultimo = 0;

  const quadro = (agora: number): void => {
    raf = requestAnimationFrame(quadro);
    // ~15 fps: queda lenta de tubo, sem esquentar a bateria de ninguém.
    if (agora - ultimo < 66) return;
    ultimo = agora;
    // CRT desligado no meio da chuva: para de desenhar (o CSS esconde o canvas).
    if (document.documentElement.dataset.crt === "off") return;
    // Rastro: em vez de limpar o quadro, escurece um pouco — a cauda apaga
    // devagar, como fósforo cansando. O rgb(4, 7, 5) casa com o fundo #040705
    // das superfícies que usam a chuva (tela de boot e celebração), para o
    // acúmulo não formar uma placa opaca de cor diferente.
    ctx.fillStyle = "rgba(4, 7, 5, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${PASSO - 2}px "JetBrains Mono", "Fira Code", ui-monospace, monospace`;
    for (let i = 0; i < colunas.length; i++) {
      const y = colunas[i]! * PASSO;
      ctx.fillStyle = "#4aff7f";
      ctx.fillText(bytes[Math.floor(Math.random() * bytes.length)]!, i * COLUNA, y);
      colunas[i]! += 1;
      if (y > canvas.height && Math.random() > 0.975) colunas[i] = 0;
    }
  };

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    raf = requestAnimationFrame(quadro);
  }

  return () => {
    cancelAnimationFrame(raf);
    observador.disconnect();
  };
}
