import { For, Match, Switch } from "solid-js";
import type { Store } from "../store.js";
import { RegistersPanel } from "./registers.js";
import { MemoryView } from "./memoryView.js";
import { BusMonitor } from "./busMonitor.js";
import { ProgramView } from "./programView.js";
import { TerminalView } from "./terminal.js";

export type IndicatorKind =
  | "registradores"
  | "memoria"
  | "barramento"
  | "programa"
  | "terminal";

/** Fonte única dos títulos: o h2 do painel e as opções do dropdown derivam daqui. */
const TITLE: Record<IndicatorKind, string> = {
  registradores: "registradores",
  memoria: "memória",
  barramento: "barramentos",
  programa: "programa",
  terminal: "terminal ($E800)",
};

const KINDS: IndicatorKind[] = [
  "registradores",
  "memoria",
  "barramento",
  "programa",
  "terminal",
];

/**
 * Painel de indicador: cabeçalho com dropdown que troca o conteúdo deste espaço
 * pelo painel escolhido (a troca é feita quem detém a lista de espaços, via onPick).
 */
export function IndicatorPanel(props: {
  kind: IndicatorKind;
  index: number;
  store: Store;
  onPick: (index: number, kind: IndicatorKind) => void;
}) {
  return (
    <section class="panel">
      <div class="panel-head">
        <h2>{TITLE[props.kind]}</h2>
        <select
          class="panel-picker"
          title="escolher o painel deste espaço"
          aria-label="trocar o painel deste espaço"
          value={props.kind}
          onChange={(e) =>
            props.onPick(props.index, e.currentTarget.value as IndicatorKind)
          }
        >
          <For each={KINDS}>{(k) => <option value={k}>{TITLE[k]}</option>}</For>
        </select>
      </div>
      <Switch>
        <Match when={props.kind === "registradores"}>
          <RegistersPanel regs={props.store.regs} />
        </Match>
        <Match when={props.kind === "memoria"}>
          <MemoryView store={props.store} />
        </Match>
        <Match when={props.kind === "barramento"}>
          <BusMonitor store={props.store} />
        </Match>
        <Match when={props.kind === "programa"}>
          <ProgramView store={props.store} />
        </Match>
        <Match when={props.kind === "terminal"}>
          <TerminalView store={props.store} />
        </Match>
      </Switch>
    </section>
  );
}
