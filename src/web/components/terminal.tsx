import { createEffect } from "solid-js";
import type { Store } from "../store.js";

/** Corpo do terminal ($E800): imprime os bytes gravados e rola para o fim. */
export function TerminalView(props: { store: Store }) {
  let el: HTMLPreElement | undefined;
  createEffect(() => {
    props.store.terminalText();
    if (el !== undefined) el.scrollTop = el.scrollHeight;
  });
  return (
    <pre class="term" ref={el}>
      {props.store.terminalText()}
    </pre>
  );
}
