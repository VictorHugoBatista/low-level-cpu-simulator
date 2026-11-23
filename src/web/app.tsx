import { For, Show, createEffect, createSignal } from "solid-js";
import { createStore } from "./store.js";
import type { Store } from "./store.js";
import { Controls } from "./components/controls.js";
import type { ExampleDef } from "./components/controls.js";
import { Editor } from "./components/editor.js";
import { RegistersPanel } from "./components/registers.js";
import { MemoryView } from "./components/memoryView.js";
import { BusMonitor } from "./components/busMonitor.js";
import { ProgramView } from "./components/programView.js";
import { ReferencePage } from "./components/reference.js";
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

const REF_EXAMPLES = [
  {
    name: "soma.asm — na RAM, carregado em $0200",
    source: somaAsm,
    note: "A prova de fogo do núcleo. Soma 2 + 3 com operandos imediatos e grava o resultado em $0300: LDA põe 2 em A, ADD soma 3 (A = 5 e as flags Z/N são atualizadas), STA copia A para $0300 e HLT para. 8 bytes, 12 ciclos — os testes do M1 montam exatamente estes bytes.",
  },
  {
    name: "desvio.asm — if/else compilado, na RAM em $0200",
    source: desvioAsm,
    note: "Mostra como decisão vira flag + desvio. SUB #$05 zera A e liga a flag Z; o JZ 'igual' desvia quando Z = 1 e pula o caminho que gravaria 0; o caminho tomado grava 1 em $0300. Experimento: troque o sub para #$04, remonte e veja o JZ não desviar — quem decide é a flag. 20 bytes, 18 ciclos.",
  },
  {
    name: "boot.asm — o LOADER, mora no setor 0 do disco",
    source: bootAsm,
    note: "É o MBR da AK-8. Ao bootar, a máquina copia o setor 0 para $0200, aponta o vetor de reset ($FFFC) para lá e reseta. Este loader então configura o controlador do disco ($F001 = LBA 1, $F002/$F003 = destino $0300, $F000 = CMD 1, 'ler setor') e dá JMP $0300 para disparar o programa que veio do disco. Memória secundária só vira execução depois de copiada para a primária.",
  },
  {
    name: "hello.asm — o PROGRAMA, mora no setor 1 do disco (entrada $0300)",
    source: helloAsm,
    note: "Imprime 'Ola, AK-8!' no terminal escrevendo caractere por caractere em $E800 e para. Como o núcleo ainda não tem X/Y, o eco é desenrolado: cada caractere é um LDA + STA — no M5, com indexação, isto vira um loop de quatro linhas.",
  },
];

type Theme = "dark" | "light";

/** Duplicada no script inline do index.html, que roda antes do build e não consegue importar daqui. */
const THEME_KEY = "ak8-theme";

function initialTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage indisponível: tema só vale para a sessão */
  }
}

export function App() {
  const store = createStore({ source: somaAsm, name: "soma.asm" });
  const [tab, setTab] = createSignal<"maquina" | "referencia">("maquina");
  const [theme, setTheme] = createSignal<Theme>(initialTheme());
  const setAndStoreTheme = (t: Theme) => {
    applyTheme(t);
    setTheme(t);
  };

  return (
    <main>
      <header>
        <h1>AK-8</h1>
        <div class="subtitle">simulador de CPU em baixo nível — von Neumann de 8 bits</div>
        <nav class="tabs">
          <button
            classList={{ active: tab() === "maquina" }}
            onClick={() => setTab("maquina")}
          >
            máquina
          </button>
          <button
            classList={{ active: tab() === "referencia" }}
            onClick={() => setTab("referencia")}
          >
            referência
          </button>
        </nav>
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
        <select
          title="tema"
          value={theme()}
          onChange={(e) => setAndStoreTheme(e.currentTarget.value as Theme)}
        >
          <option value="dark">escuro</option>
          <option value="light">claro</option>
        </select>
      </header>

      <Show when={store.notice() !== null}>
        <pre class="errors">{store.notice()}</pre>
      </Show>

      <Show when={tab() === "maquina"}>
        <div class="grid">
          <div class="col">
            <Controls store={store} examples={EXAMPLES} />
            <Editor store={store} />
            <RegistersPanel regs={store.regs} />
            <ProgramView store={store} />
          </div>
          <div class="col">
            <BusMonitor store={store} />
            <TerminalPanel store={store} />
            <MemoryView store={store} />
          </div>
        </div>
      </Show>

      <Show when={tab() === "referencia"}>
        <ReferencePage examples={REF_EXAMPLES} />
      </Show>
    </main>
  );
}
