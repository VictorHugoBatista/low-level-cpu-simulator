import { For } from "solid-js";
import type { Store } from "../store.js";

export function Controls(props: { store: Store; examples: [string, string][] }) {
  const s = props.store;
  let fileInput: HTMLInputElement | undefined;

  const onFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file === undefined) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".asm")) {
      s.loadAsm(await file.text(), file.name);
    } else if (name.endsWith(".bin")) {
      s.loadBin(new Uint8Array(await file.arrayBuffer()), file.name);
    } else if (name.endsWith(".disk")) {
      s.report("a memória secundária (disco) chega no marco M4");
    } else {
      s.report("formato não suportado: use .asm ou .bin");
    }
    input.value = "";
  };

  return (
    <section class="panel">
      <h2>controles</h2>
      <div class="row">
        <input
          type="file"
          accept=".asm,.bin"
          ref={fileInput}
          onChange={onFile}
          title="carregar .asm ou .bin"
        />
        <For each={props.examples}>
          {([name, source]) => (
            <button onClick={() => s.loadAsm(source, `${name}.asm`)}>exemplo: {name}</button>
          )}
        </For>
      </div>
      <div class="row">
        <button onClick={() => s.reset()}>Reset</button>
        <button onClick={() => s.stepClock()}>Passo (1 clock)</button>
        <button onClick={() => s.stepInstruction()}>Passo (1 instrução)</button>
        <button class="run" onClick={() => s.toggleRun()}>
          {s.running() ? "Pause" : "Run"}
        </button>
        <select
          title="velocidade do Run"
          value={String(s.speed())}
          onChange={(e) => s.setSpeed(Number(e.currentTarget.value))}
        >
          <option value="1">1 Hz</option>
          <option value="10">10 Hz</option>
          <option value="100">100 Hz</option>
          <option value="1000">1 kHz</option>
          <option value="0">Máximo</option>
        </select>
      </div>
      <div class="hint">
        Passo avança exatamente um clock. Breakpoints: clique nas linhas do programa.
      </div>
    </section>
  );
}
