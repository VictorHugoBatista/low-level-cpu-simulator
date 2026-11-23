import { For, Show, createEffect } from "solid-js";
import { createStore } from "./store.js";
import type { Store } from "./store.js";
import { Controls } from "./components/controls.js";
import type { ExampleDef } from "./components/controls.js";
import { RegistersPanel } from "./components/registers.js";
import { MemoryView } from "./components/memoryView.js";
import { BusMonitor } from "./components/busMonitor.js";
import { ProgramView } from "./components/programView.js";
import somaAsm from "../../examples/soma.asm?raw";
import desvioAsm from "../../examples/desvio.asm?raw";
import bootAsm from "../../examples/boot.asm?raw";
import helloAsm from "../../examples/hello.asm?raw";

function TerminalPanel(props: { store: Store }) {
  let el: HTMLPreElement | undefined;
  createEffect(() => {
    props.store.terminalText();
    if (el !== undefined) el.scrollTop = el.scrollHeight;
  });
  return (
    <section class="panel">
      <h2>terminal ($E800)</h2>
      <pre class="term" ref={el}>
        {props.store.terminalText()}
      </pre>
    </section>
  );
}

const EXAMPLES: ExampleDef[] = [
  { name: "soma", asm: somaAsm },
  { name: "desvio", asm: desvioAsm },
  {
    name: "hello-disk",
    asm: bootAsm,
    disk: { source: helloAsm, name: "hello.asm", lba: 1 },
  },
];

export function App() {
  const store = createStore();

  return (
    <main>
      <header>
        <h1>AK-8</h1>
        <div class="subtitle">simulador de CPU em baixo nível — von Neumann de 8 bits</div>
        <div class="status">
          {store.program() === null
            ? "carregue um programa"
            : store.halted()
              ? "parado (HLT)"
              : store.running()
                ? "rodando"
                : "pausado"}
          {" · "}
          {store.cycles()} ciclos
        </div>
      </header>

      <Show when={store.notice() !== null}>
        <pre class="errors">{store.notice()}</pre>
      </Show>

      <div class="grid">
        <div class="col">
          <Controls store={store} examples={EXAMPLES} />
          <RegistersPanel regs={store.regs} />
          <ProgramView store={store} />
        </div>
        <div class="col">
          <BusMonitor store={store} />
          <TerminalPanel store={store} />
          <MemoryView store={store} />
        </div>
      </div>
    </main>
  );
}
