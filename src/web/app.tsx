import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { createStore } from "./store.js";
import type { Store } from "./store.js";
import { Controls } from "./components/controls.js";
import type { ExampleDef } from "./components/controls.js";
import { Editor } from "./components/editor.js";
import { IndicatorPanel } from "./components/indicatorPanel.js";
import type { IndicatorKind } from "./components/indicatorPanel.js";
import { ReferencePage } from "./components/reference.js";
import { ExercisesPage } from "./components/exercises.js";
import { ExercisePanel } from "./components/exercisePanel.js";
import { OpcoesPage } from "./components/opcoes.js";
import { BootScreen } from "./components/boot.js";
import { FundoChuva } from "./components/fundo.js";
import { restoreLast, saveDraftActive } from "./exerciseState.js";
import somaAsm from "../../examples/soma.asm?raw";
import desvioAsm from "../../examples/desvio.asm?raw";
import bootAsm from "../../examples/boot.asm?raw";
import helloAsm from "../../examples/hello.asm?raw";

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
    note: "É o MBR da MOS-6502. Ao bootar, a máquina copia o setor 0 para $0200, aponta o vetor de reset ($FFFC) para lá e reseta. Este loader então configura o controlador do disco ($F001 = LBA 1, $F002/$F003 = destino $0300, $F000 = CMD 1, 'ler setor') e dá JMP $0300 para disparar o programa que veio do disco. Memória secundária só vira execução depois de copiada para a primária.",
  },
  {
    name: "hello.asm — o PROGRAMA, mora no setor 1 do disco (entrada $0300)",
    source: helloAsm,
    note: "Imprime 'Ola, MOS-6502!' no terminal escrevendo caractere por caractere em $E800 e para. Como o núcleo ainda não tem X/Y, o eco é desenrolado: cada caractere é um LDA + STA — no M5, com indexação, isto vira um loop de quatro linhas.",
  },
];

/** Painéis indicadores por espaço: os dois primeiros ficam na coluna esquerda, o resto na direita. */
const INITIAL_SLOTS: IndicatorKind[] = [
  "registradores",
  "memoria",
  "programa",
  "barramento",
  "terminal",
];

export type Theme = "dark" | "light";

/** Duplicada no script inline do index.html, que roda antes do build e não consegue importar daqui. */
const THEME_KEY = "ak8-theme";

export type Crt = "on" | "off";

/** Duplicada no script inline do index.html, junto com THEME_KEY. */
const CRT_KEY = "ak8-crt";

/** O boot toca uma vez por sessão — refresh no mesmo nano não reboota a máquina. */
const BOOT_KEY = "ak8-boot-visto";

function initialCrt(): Crt {
  return document.documentElement.dataset.crt === "off" ? "off" : "on";
}

function applyCrt(crt: Crt) {
  document.documentElement.dataset.crt = crt;
  try {
    localStorage.setItem(CRT_KEY, crt);
  } catch {
    /* localStorage indisponível: CRT só vale para a sessão */
  }
}

/** A cerimônia de boot só acontece para quem ligou o CRT, ainda não a viu nesta
 * sessão e não pediu menos animação no sistema — todo mundo entra direto na máquina. */
function deveBootar(): boolean {
  if (initialCrt() === "off") return false;
  try {
    if (sessionStorage.getItem(BOOT_KEY) !== null) return false;
  } catch {
    /* sessionStorage indisponível: boota sempre */
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type Layout = "colunas" | "lateral";

const LAYOUT_KEY = "ak8-layout";

/** O padrão é o lateral; o valor persistido continua "colunas" (o layout "editor cheio")
 * para não invalidar o localStorage de quem já escolheu. */
function initialLayout(): Layout {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved === "colunas" || saved === "lateral") return saved;
  } catch {
    /* localStorage indisponível: layout só vale para a sessão */
  }
  return "lateral";
}

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
  // A página carregada com um exercício: o último nível aberto volta com o rascunho no
  // editor e as entradas do caso gravadas na RAM — a pessoa continua de onde parou.
  restoreLast(store);
  const [tab, setTab] = createSignal<"maquina" | "exercicios" | "referencia" | "opcoes">("maquina");
  const [slots, setSlots] = createSignal<IndicatorKind[]>([...INITIAL_SLOTS]);

  /** No mobile, o menu hamburguer guarda as abas: escolher uma fecha o menu. */
  const [menuAberto, setMenuAberto] = createSignal(false);
  let btnMenu!: HTMLButtonElement;
  let navTabs!: HTMLElement;
  const irPara = (t: "maquina" | "exercicios" | "referencia" | "opcoes") => {
    setTab(t);
    setMenuAberto(false);
    // A aba escolhida some com o menu: o foco volta para o botão que o abre
    // (no desktop o botão está display:none e o focus() não faz nada).
    btnMenu.focus();
  };

  // Padrão disclosure: com o menu aberto, Escape fecha (devolvendo o foco ao
  // botão) e clique fora dele fecha. Os listeners existem só enquanto aberto.
  createEffect(() => {
    if (!menuAberto()) return;
    const fecharFora = (e: PointerEvent): void => {
      if (e.target instanceof Node && !navTabs.contains(e.target) && !btnMenu.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    const fecharEsc = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setMenuAberto(false);
        btnMenu.focus();
      }
    };
    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", fecharEsc);
    onCleanup(() => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", fecharEsc);
    });
  });

  /** Escolher um painel para um espaço troca com o espaço onde ele estava. */
  const pickSlot = (index: number, kind: IndicatorKind): void => {
    setSlots((prev) => {
      const from = prev.indexOf(kind);
      if (from === index || from === -1) return prev;
      const next = prev.slice();
      next[from] = next[index];
      next[index] = kind;
      return next;
    });
  };

  const [theme, setTheme] = createSignal<Theme>(initialTheme());
  const setAndStoreTheme = (t: Theme) => {
    applyTheme(t);
    setTheme(t);
  };

  const [crt, setCrt] = createSignal<Crt>(initialCrt());
  const setAndStoreCrt = (c: Crt) => {
    applyCrt(c);
    setCrt(c);
  };

  const [booting, setBooting] = createSignal(deveBootar());
  /** Fim do boot: timeout de 1,1 s ou clique na tela. Marca a sessão para o
   * refresh seguinte entrar direto. */
  const encerrarBoot = () => {
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* sessionStorage indisponível: o boot só volta no refresh */
    }
    setBooting(false);
  };

  const [layout, setLayout] = createSignal<Layout>(initialLayout());
  const setAndStoreLayout = (l: Layout) => {
    try {
      localStorage.setItem(LAYOUT_KEY, l);
    } catch {
      /* localStorage indisponível: layout só vale para a sessão */
    }
    setLayout(l);
  };

  return (
    <main>
      <Show when={crt() === "on"}>
        <FundoChuva />
      </Show>
      {/* Véu do menu mobile: cobre o site quando o menu está aberto, entre o
          conteúdo e o menu/botão (só existe de verdade no mobile, via CSS). */}
      <div class="menu-overlay" classList={{ on: menuAberto() }} aria-hidden="true" />
      <Show when={booting()}>
        <BootScreen onDone={encerrarBoot} />
      </Show>
      <header>
        <h1>MOS-6502</h1>
        <button
          class="menu-btn"
          ref={btnMenu}
          aria-expanded={menuAberto()}
          aria-controls="menu-tabs"
          aria-label="menu"
          onClick={() => setMenuAberto(!menuAberto())}
        >
          <span class="menu-icon" aria-hidden="true"><i /><i /><i /></span>
        </button>
        <div class="subtitle">Simulador de CPU de 8 bits</div>
        <nav class="tabs" id="menu-tabs" ref={navTabs} classList={{ open: menuAberto() }}>
          <button
            classList={{ active: tab() === "maquina" }}
            onClick={() => irPara("maquina")}
          >
            máquina
          </button>
          <button
            classList={{ active: tab() === "exercicios" }}
            onClick={() => irPara("exercicios")}
          >
            exercícios
          </button>
          <button
            classList={{ active: tab() === "referencia" }}
            onClick={() => irPara("referencia")}
          >
            referência
          </button>
          <button
            classList={{ active: tab() === "opcoes" }}
            onClick={() => irPara("opcoes")}
          >
            opções
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
      </header>

      <Show when={store.notice() !== null}>
        <pre class="errors">{store.notice()}</pre>
      </Show>

      <Show when={tab() === "maquina"}>
        <Show
          when={layout() === "lateral"}
          fallback={
            <div class="machine-cols">
              <ExercisePanel store={store} onOpenExercises={() => setTab("exercicios")} />
              <div class="hero">
                <Controls store={store} examples={EXAMPLES} />
                <Editor store={store} onBlur={() => saveDraftActive(store)} />
              </div>
              <div class="grid">
                <div class="col">
                  <For each={slots().slice(0, 2)}>
                    {(kind, i) => (
                      <IndicatorPanel
                        kind={kind}
                        index={i()}
                        store={store}
                        onPick={pickSlot}
                      />
                    )}
                  </For>
                </div>
                <div class="col">
                  <For each={slots().slice(2)}>
                    {(kind, i) => (
                      <IndicatorPanel
                        kind={kind}
                        index={i() + 2}
                        store={store}
                        onPick={pickSlot}
                      />
                    )}
                  </For>
                </div>
              </div>
            </div>
          }
        >
          <div class="layout-side">
            <div class="hero">
              <div class="col">
                <ExercisePanel store={store} onOpenExercises={() => setTab("exercicios")} />
                <Controls store={store} examples={EXAMPLES} />
              </div>
              <Editor store={store} onBlur={() => saveDraftActive(store)} />
            </div>
            <div class="grid">
              <div class="col">
                <For each={slots().slice(0, 2)}>
                  {(kind, i) => (
                    <IndicatorPanel
                      kind={kind}
                      index={i()}
                      store={store}
                      onPick={pickSlot}
                    />
                  )}
                </For>
              </div>
              <div class="col">
                <For each={slots().slice(2)}>
                  {(kind, i) => (
                    <IndicatorPanel
                      kind={kind}
                      index={i() + 2}
                      store={store}
                      onPick={pickSlot}
                    />
                  )}
                </For>
              </div>
            </div>
          </div>
        </Show>
      </Show>

      <Show when={tab() === "exercicios"}>
        <ExercisesPage store={store} onOpenMachine={() => setTab("maquina")} />
      </Show>

      <Show when={tab() === "referencia"}>
        <ReferencePage examples={REF_EXAMPLES} />
      </Show>

      <Show when={tab() === "opcoes"}>
        <OpcoesPage
          store={store}
          theme={theme()}
          setTheme={setAndStoreTheme}
          layout={layout()}
          setLayout={setAndStoreLayout}
          crt={crt()}
          setCrt={setAndStoreCrt}
        />
      </Show>

      <footer class="footer">
        <iframe
          class="gh-btn"
          src="https://ghbtns.com/github-btn.html?user=VictorHugoBatista&type=follow&count=true"
          title="github do autor"
          frameborder="0"
          scrolling="no"
          width="170"
          height="20"
        />
      </footer>
    </main>
  );
}
