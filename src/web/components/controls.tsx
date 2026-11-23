import { For } from "solid-js";
import type { Store } from "../store.js";

export interface ExampleDef {
  name: string;
  asm: string;
  /** Se definido, monta o .asm e grava como setor de um disco novo antes de carregar. */
  disk?: { source: string; name: string; lba: number };
}

export function Controls(props: { store: Store; examples: ExampleDef[] }) {
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
      s.loadDisk(new Uint8Array(await file.arrayBuffer()), file.name);
    } else {
      s.report("formato não suportado: use .asm, .bin ou .disk");
    }
    input.value = "";
  };

  return (
    <section class="panel">
      <h2>controles</h2>
      <div class="row">
        <input
          type="file"
          accept=".asm,.bin,.disk"
          ref={fileInput}
          onChange={onFile}
          title="carregar .asm, .bin ou .disk"
        />
      </div>
      <div class="row">
        <For each={props.examples}>
          {(ex) => (
            <button
              onClick={() => {
                if (ex.disk !== undefined) {
                  s.loadDiskFromAsm(ex.disk.source, ex.disk.name, ex.disk.lba);
                }
                s.loadAsm(ex.asm, `${ex.name}.asm`);
                if (ex.disk !== undefined) s.bootFromDisk();
              }}
            >
              exemplo: {ex.name}
            </button>
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
        <button onClick={() => s.bootFromDisk()}>Boot do disco</button>
      </div>
      <div class="hint">
        Passo avança exatamente um clock. Breakpoints: clique nas linhas do programa. O Boot
        copia o setor 0 do disco para $0200 e dispara.
      </div>
    </section>
  );
}
