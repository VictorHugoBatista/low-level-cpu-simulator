import { For, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import {
  ESTACOES,
  ajustarVolume,
  desligarRadio,
  escolherEstacao,
  ligarRadio,
  radioAtual,
  streamDaEstacao,
} from "../radio.js";

/**
 * O player da rádio de fundo, no rodapé: stop/play, estação e volume. É widget
 * de ambiente, sempre montado fora das abas — o som atravessa a troca de aba,
 * como a chuva do CRT.
 *
 * O botão é stop, não pause: rádio ao vivo não tem posição para retomar
 * (comportamento de pause num stream Icecast varia por navegador e deixa a
 * conexão puxando dados em background). Parar faz pause + solta o src, matando a
 * conexão; tocar reconecta no tempo presente da transmissão.
 *
 * Erro de stream não é "erro é erro" do núcleo — é adorno cosmético: degrada
 * silenciosamente para o espelho seguinte e só então marca offline.
 */
export function RadioPlayer() {
  let audio!: HTMLAudioElement;
  const [tentativa, setTentativa] = createSignal(0);
  const [conectando, setConectando] = createSignal(false);
  const [offline, setOffline] = createSignal(false);

  /** Estado derivado para o texto do rodapé. */
  const noAr = () => radioAtual().ligado && !conectando() && !offline();

  createEffect(() => {
    const { ligado, estacao } = radioAtual();
    if (!ligado) {
      // Stop de verdade: sem src, o navegador solta a conexão do stream
      // (e cessa o download que um pause simples deixaria rodando).
      setConectando(false);
      setOffline(false);
      setTentativa(0);
      if (audio.dataset.stream !== undefined) {
        // Já está parado e o efeito re-rodou por outra mudança (ex.: volume):
        // não recarrega o elemento de novo, senão o load() dispara à toa.
        audio.removeAttribute("data-stream");
        audio.removeAttribute("src");
        audio.load();
      }
      return;
    }
    const url = streamDaEstacao(estacao, tentativa());
    if (url === undefined) {
      // Espelhos acabaram: a estação está fora do ar; o play de novo volta a tentar.
      setOffline(true);
      setConectando(false);
      return;
    }
    if (audio.dataset.stream === url) return; // mesmo stream (ex.: só o volume mudou)
    setOffline(false);
    setConectando(true);
    audio.dataset.stream = url;
    audio.src = url;
    audio.load();
    void audio.play().catch((e: unknown) => {
      // Nada aqui avança a tentativa: falha de rede/codec rejeita o play() e
      // TAMBÉM dispara o evento "error" no elemento — e o evento (audioErro) é
      // quem avança, senão o fallback pula dois espelhos de uma vez.
      // NotAllowedError: o navegador exige gesto — quem retoma é o listener do
      // onMount. AbortError: o src trocou no meio do play.
      if (e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "AbortError")) {
        return;
      }
    });
  });

  createEffect(() => {
    audio.volume = radioAtual().volume;
  });

  onMount(() => {
    // O efeito marca conectando ao abrir o stream, mas quem confirma que há som
    // é o próprio elemento: "playing" quando o áudio corre de verdade e
    // "waiting" quando ele engasga no buffering — o LED segue a transmissão.
    const aoTocar = (): void => {
      setConectando(false);
      setOffline(false);
    };
    const aoEngasgar = (): void => {
      if (radioAtual().ligado) setConectando(true);
    };
    audio.addEventListener("playing", aoTocar);
    audio.addEventListener("waiting", aoEngasgar);
    onCleanup(() => {
      audio.removeEventListener("playing", aoTocar);
      audio.removeEventListener("waiting", aoEngasgar);
    });

    // Preferência salva diz ligado? O autoplay sem gesto é bloqueado, então o
    // player fica armado: o primeiro clique/tecla (o boot é clicável) retoma.
    if (!radioAtual().ligado) return;
    const retomar = (): void => {
      void audio.play().catch(() => undefined); // falha de rede recai no efeito principal
      document.removeEventListener("pointerdown", retomar);
      document.removeEventListener("keydown", retomar);
    };
    document.addEventListener("pointerdown", retomar);
    document.addEventListener("keydown", retomar);
    onCleanup(() => {
      document.removeEventListener("pointerdown", retomar);
      document.removeEventListener("keydown", retomar);
    });
  });

  const audioErro = (): void => {
    if (!radioAtual().ligado) return; // erro do load() do stop: ignora
    setTentativa((t) => t + 1); // espelho seguinte, via efeito principal
  };

  const trocarEstacao = (id: string): void => {
    setTentativa(0); // estação nova começa pela primária, não pela tentativa anterior
    escolherEstacao(id);
  };

  onCleanup(() => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  });

  return (
    <div class="radio" title="rádio de fundo — música ao vivo por SomaFM (somafm.com) e Nightride FM">
      <button
        class="radio-btn"
        aria-label={radioAtual().ligado ? "parar a rádio" : "tocar a rádio"}
        title={radioAtual().ligado ? "parar (solta a conexão do stream)" : "tocar"}
        onClick={() => (radioAtual().ligado ? desligarRadio() : ligarRadio())}
      >
        <span class="glyph" aria-hidden="true">
          {radioAtual().ligado ? "■" : "▶"}
        </span>
      </button>
      <select
        class="radio-estacao"
        aria-label="estação da rádio"
        title="estação"
        value={radioAtual().estacao}
        onChange={(e) => trocarEstacao(e.currentTarget.value)}
      >
        <For each={ESTACOES}>{(est) => <option value={est.id}>{est.nome}</option>}</For>
      </select>
      <input
        class="radio-volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        aria-label="volume da rádio"
        title="volume"
        value={radioAtual().volume}
        style={{ "--volume": `${radioAtual().volume * 100}%` }}
        onInput={(e) => ajustarVolume(Number(e.currentTarget.value))}
      />
      <span class="radio-status" classList={{ offline: offline(), "no-ar": noAr() }}>
        {offline() ? "sem sinal" : conectando() ? "conectando…" : noAr() ? "no ar" : ""}
      </span>
      <audio ref={audio} preload="none" onError={audioErro} />
    </div>
  );
}
