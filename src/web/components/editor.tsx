import { For, createMemo } from "solid-js";
import type { Store } from "../store.js";

/** Editor do fonte em assembly: o que está aqui é o que o botão "Montar e carregar" usa. */
export function Editor(props: { store: Store; onBlur?: () => void }) {
  const s = props.store;
  let ta: HTMLTextAreaElement | undefined;
  let gutter: HTMLDivElement | undefined;

  const lineCount = createMemo(() => s.source().split("\n").length);

  const syncScroll = (): void => {
    if (gutter !== undefined && ta !== undefined) gutter.scrollTop = ta.scrollTop;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      s.assembleCurrent();
      return;
    }
    if (e.key === "Tab") {
      // tab insere dois espaços em vez de fugir do campo
      e.preventDefault();
      const el = e.currentTarget as HTMLTextAreaElement;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const v = s.source();
      s.setSource(v.slice(0, start) + "  " + v.slice(end));
      queueMicrotask(() => {
        el.selectionStart = el.selectionEnd = start + 2;
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

  return (
    <section class="panel">
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
            {(_, i) => <div>{i() + 1}</div>}
          </For>
        </div>
        <textarea
          ref={ta}
          class="srcedit"
          spellcheck={false}
          wrap="off"
          value={s.source()}
          placeholder={"; escreva seu programa em assembly MOS-6502 aqui\n; Ctrl+Enter monta e carrega"}
          onInput={(e) => s.setSource(e.currentTarget.value)}
          onBlur={() => props.onBlur?.()}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
        />
      </div>
    </section>
  );
}
