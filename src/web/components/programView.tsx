import { For, createMemo } from "solid-js";
import { hex2, hex4 } from "../../core/bytes.js";
import type { Store } from "../store.js";

/** Painel do programa: listing com o PC apontando a linha corrente e breakpoints por clique. */
export function ProgramView(props: { store: Store }) {
  const s = props.store;
  const entries = () => s.program()?.entries ?? [];
  const pc = () => s.regs().pc;

  const currentIndex = createMemo(() => {
    const p = pc();
    const list = entries();
    let found = -1;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.bytes.length > 0 && e.addr <= p && p < e.addr + e.bytes.length) found = i;
    }
    return found;
  });

  return (
    <section class="panel">
      <h2>programa</h2>
      {s.program() === null ? (
        <div class="hint">carregue um .asm (com listing) ou .bin</div>
      ) : (
        <div class="listing">
          <For each={entries()}>
            {(e, i) => (
              <div
                classList={{
                  line: true,
                  hot: i() === currentIndex(),
                  bp: s.breakpoints().has(e.addr),
                  clickable: e.bytes.length > 0,
                }}
                onClick={() => e.bytes.length > 0 && s.toggleBreakpoint(e.addr)}
              >
                <span class="bpm">{s.breakpoints().has(e.addr) ? "●" : "·"}</span>
                <span class="addr">{hex4(e.addr)}</span>
                <span class="bytes">{e.bytes.map(hex2).join(" ")}</span>
                <span class="src">{e.raw.trim()}</span>
              </div>
            )}
          </For>
        </div>
      )}
    </section>
  );
}
