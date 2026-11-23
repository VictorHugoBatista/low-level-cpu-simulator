import { For, Show } from "solid-js";
import { createStore } from "./store.js";
import type { Store } from "./store.js";
import { Controls } from "./components/controls.js";
import { RegistersPanel } from "./components/registers.js";
import { MemoryView } from "./components/memoryView.js";
import { BusMonitor } from "./components/busMonitor.js";
import { ProgramView } from "./components/programView.js";
import somaAsm from "../../examples/soma.asm?raw";
import desvioAsm from "../../examples/desvio.asm?raw";

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

      <Show when={store.asmError() !== null}>
        <pre class="errors">{store.asmError()}</pre>
      </Show>

      <div class="grid">
        <div class="col">
          <Controls store={store} examples={[["soma", somaAsm], ["desvio", desvioAsm]]} />
          <RegistersPanel regs={store.regs} />
          <ProgramView store={store} />
        </div>
        <div class="col">
          <BusMonitor store={store} />
          <MemoryView store={store} />
        </div>
      </div>
    </main>
  );
}
