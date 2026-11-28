import { For, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { Store } from "../store.js";

/** Editor do fonte em assembly: o que está aqui é o que o botão "Montar e carregar" usa. */
export function Editor(props: { store: Store; onBlur?: () => void }) {
  const s = props.store;
  let ta: HTMLTextAreaElement | undefined;
  let gutter: HTMLDivElement | undefined;

  const lineCount = createMemo(() => s.source().split("\n").length);

  /** Linha do cursor e geometria da faixa destacada (top/altura em px, já
   * compensada pela rolagem do campo). */
  const [linha, setLinha] = createSignal(0);
  const [faixa, setFaixa] = createSignal({ top: 0, altura: 0 });

  /** Métricas do campo (padding topo e altura de linha em px), lidas vivas do
   * computed style — a faixa sobrevive a mudança de zoom ou de fonte. */
  const metricas = () => {
    if (ta === undefined) return { pad: 0, altura: 0 };
    const st = getComputedStyle(ta);
    return { pad: parseFloat(st.paddingTop), altura: parseFloat(st.lineHeight) };
  };

  /** Recalcula linha do cursor e posição da faixa. Chamar em todo evento que
   * pode mover o cursor ou rolar o campo. */
  const syncCursor = (): void => {
    if (ta === undefined) return;
    const pos = ta.selectionStart;
    const linhaAtual = Math.min(
      s.source().slice(0, pos).split("\n").length - 1,
      Math.max(0, lineCount() - 1),
    );
    setLinha(linhaAtual);
    const m = metricas();
    setFaixa({ top: m.pad + linhaAtual * m.altura - ta.scrollTop, altura: m.altura });
  };

  const syncScroll = (): void => {
    if (gutter !== undefined && ta !== undefined) gutter.scrollTop = ta.scrollTop;
    syncCursor();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      s.assembleCurrent();
      return;
    }
    if (e.key === "Tab") {
      // tab insere oito espaços — a coluna dos mnemônicos nos exemplos e nas
      // soluções — em vez de fugir do campo
      e.preventDefault();
      const el = e.currentTarget as HTMLTextAreaElement;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const v = s.source();
      s.setSource(v.slice(0, start) + "  " + v.slice(end));
      queueMicrotask(() => {
        el.selectionStart = el.selectionEnd = start + 2;
        syncCursor();
      });
    }
  };

  const download = (): void => {
    const p = s.program();
    const name = p !== null && p.kind === "asm" ? p.name : "programa.asm";
    const blob = new Blob([s.source()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /** Fonte trocada por fora (exemplo, exercício, Novo): o cursor do campo é
   * reiniciado pelo navegador — recalcular depois do valor novo assentar. O
   * microtask também cobre a montagem inicial, com a ref do campo já resolvida. */
  createEffect(() => {
    s.source(); // rastreia trocas de fonte
    queueMicrotask(syncCursor);
  });

  // Toda mudança de seleção passa por aqui — cobre os furos de click/keyup:
  // arrastar seleção e soltar fora do campo, e setas seguradas (o keyup só vem
  // na solta). O listener no document é o caminho universal nos navegadores.
  onMount(() => {
    document.addEventListener("selectionchange", syncCursor);
    onCleanup(() => document.removeEventListener("selectionchange", syncCursor));
  });

  return (
    <section class="panel hero-src">
      <h2>fonte</h2>
      <div class="row">
        <button class="run" onClick={() => s.assembleCurrent()}>
          Montar e carregar (Ctrl+Enter)
        </button>
        <button onClick={download}>Baixar .asm</button>
        <button onClick={() => s.newSource()}>Novo</button>
      </div>
      <div class="editor">
        <div class="gutter" ref={gutter} aria-hidden="true">
          <For each={Array.from({ length: lineCount() })}>
            {(_, i) => <div classList={{ ativa: i() === linha() }}>{i() + 1}</div>}
          </For>
        </div>
        <div class="srcwrap">
          <div
            class="cursor-line"
            aria-hidden="true"
            style={{ top: `${faixa().top}px`, height: `${faixa().altura}px` }}
          />
          <textarea
            ref={ta}
            class="srcedit"
            spellcheck={false}
            wrap="off"
            value={s.source()}
            placeholder={"; escreva seu programa em assembly MOS-6502 aqui\n; Ctrl+Enter monta e carrega"}
            onInput={(e) => {
              s.setSource(e.currentTarget.value);
              syncCursor();
            }}
            onClick={syncCursor}
            onKeyUp={syncCursor}
            onFocus={syncCursor}
            onBlur={() => props.onBlur?.()}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
          />
        </div>
      </div>
    </section>
  );
}
