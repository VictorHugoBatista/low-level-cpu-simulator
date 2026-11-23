import { For, createMemo } from "solid-js";
import { hex2, hex4 } from "../../core/bytes.js";
import type { BusTransaction } from "../../bus/bus.js";
import type { Store } from "../store.js";

const bin8 = (v: number): string => v.toString(2).padStart(8, "0");

export function BusMonitor(props: { store: Store }) {
  const s = props.store;

  const last = createMemo<BusTransaction | null>(() => s.transactions().at(-1) ?? null);
  const history = createMemo<BusTransaction[]>(() => s.transactions().slice().reverse());

  return (
    <section class="panel">
      <h2>barramentos</h2>
      <div class="busnow">
        {last() === null ? (
          <span class="hint">sem transferências ainda</span>
        ) : (
          <>
            <div>
              <span class="dir">{last()!.write ? "WRITE" : "READ"}</span>{" "}
              <span class="addr">M[${hex4(last()!.address)}]</span>
              {"  dados: "}
              <span class="data">{hex2(last()!.data)}</span>{" "}
              <span class="bin">{bin8(last()!.data)}</span>
            </div>
            <div class="hint">sinais: {last()!.write ? "WRITE=1" : "READ=1"} · ciclo {last()!.cycle}</div>
          </>
        )}
      </div>
      <div class="bushist">
        <For each={history()}>
          {(t) => (
            <div class="busline">
              {String(t.cycle).padStart(4)} · {t.write ? "WRITE" : "READ "} · {hex4(t.address)} ·{" "}
              {hex2(t.data)}
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
