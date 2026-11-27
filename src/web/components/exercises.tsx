import { For, Show } from "solid-js";
import { Editor } from "./editor.js";
import { ExerciseResults } from "./exercisePanel.js";
import { Celebrate } from "./celebrate.js";
import { MelhorPerformance } from "./desempenho.js";
import type { Store } from "../store.js";
import { TRACKS } from "../exerciseCatalog.js";
import type { ExerciseDef } from "../exerciseCatalog.js";
import {
  aplicarProgresso,
  coletarProgresso,
  nomeArquivoProgresso,
  parseProgresso,
  serializarProgresso,
} from "../progressoArquivo.js";
import {
  activeExercise,
  activeTrack,
  alternarSolucao,
  caseIndex,
  selectTrack,
  openExercise,
  progress,
  selectExercise,
  saveDraftActive,
  solveWithHelp,
  updateProgress,
  verifyActive,
  celebrate,
  results,
  verifiedId,
  solucaoVisivel,
} from "../exerciseState.js";

/**
 * A série de exercícios de fixação, gamificada: níveis que se desbloqueiam em sequência,
 * teoria breve + enunciado + dicas progressivas, e verificação por comportamento — cada
 * caso de teste roda o programa do aluno numa máquina fresca com valores de entrada
 * diferentes e confere os endereços de destino. O estado (progresso, exercício ativo,
 * resultado da verificação) mora em exerciseState.ts, compartilhado com a aba máquina —
 * dá para desenvolver lá, com os painéis da máquina à vista, e submeter de qualquer
 * uma das duas abas.
 */

const isSolved = (p: { solved: Record<string, unknown> }, def: ExerciseDef): boolean =>
  p.solved[def.id] !== undefined;

/** O próximo nível da trilha só abre quando o anterior foi concluído. */
const isUnlocked = (list: ExerciseDef[], index: number, p: { solved: Record<string, unknown> }): boolean =>
  index === 0 || isSolved(p, list[index - 1]);

export function ExercisesPage(props: { store: Store; onOpenMachine?: () => void }) {
  const s = props.store;

  const current = (): ExerciseDef | undefined => activeExercise();
  const hintCount = (def: ExerciseDef): number => progress().hints[def.id] ?? 0;
  const list = (): ExerciseDef[] => activeTrack().exercises;
  const solvedCount = (): number => list().filter((d) => isSolved(progress(), d)).length;

  /** Baixa o progresso inteiro (níveis, rascunhos, dicas, marcas) como arquivo .json —
   * o mesmo caminho do download de .asm do editor. */
  const salvarProgresso = (): void => {
    const blob = new Blob([serializarProgresso(coletarProgresso())], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivoProgresso();
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /** Lê o arquivo escolhido, valida e restaura — substituindo o progresso corrente.
   * Erro (arquivo estranho, de outro app, de versão futura) vira aviso, não exceção. */
  const carregarProgresso = async (file: File): Promise<void> => {
    try {
      const p = parseProgresso(await file.text());
      aplicarProgresso(p, s);
      const quando = p.savedAt === "" ? "" : ` (salvo em ${p.savedAt.slice(0, 10)})`;
      s.report(`progresso restaurado de ${file.name}${quando}`);
    } catch (e) {
      s.report(e instanceof Error ? e.message : String(e));
    }
  };

  const revelarArquivo = (): void => {
    inputArquivo?.click();
  };

  let inputArquivo: HTMLInputElement | undefined;

  const revealHint = (def: ExerciseDef): void => {
    updateProgress((p) => {
      const used = p.hints[def.id] ?? 0;
      if (used >= def.hints.length) return p;
      return { ...p, hints: { ...p.hints, [def.id]: used + 1 } };
    });
  };

  /** Depois de todas as dicas: ver a solução avança o nível, marcado como "com ajuda". */
  const giveUp = (def: ExerciseDef): void => {
    solveWithHelp(def);
  };

  /** Ao montar a aba, se nenhum exercício está ativo (primeira visita), abre o próximo
   * nível não resolvido — o contexto (editor + entradas do caso) já fica na máquina. */
  if (current() === undefined) {
    const firstOpen = Math.max(0, list().findIndex((def) => !isSolved(progress(), def)));
    const initial = list()[firstOpen] ?? list()[0];
    if (initial !== undefined) openExercise(initial, s);
  }

  return (
    <div class="ex">
      <aside class="panel ex-levels">
        <h2>trilha</h2>
        <select
          value={activeTrack().id}
          onChange={(e) => selectTrack(TRACKS.find((t) => t.id === e.currentTarget.value) ?? activeTrack(), s)}
        >
          <For each={TRACKS}>{(t) => <option value={t.id}>{t.title}</option>}</For>
        </select>
        <p class="hint">{activeTrack().description}</p>
        <div class="ex-progress">
          <div class="ex-bar">
            <div class="ex-bar-fill" style={{ width: `${(solvedCount() / Math.max(1, list().length)) * 100}%` }} />
          </div>
          <span class="ex-count">{solvedCount()}/{list().length} níveis</span>
        </div>
        <div class="row">
          <button onClick={salvarProgresso} title="baixa um .json com níveis, rascunhos, dicas e marcas de ciclos">
            Salvar progresso
          </button>
          <button onClick={revelarArquivo} title="restaura o progresso de um .json salvo antes — substitui o atual">
            Carregar progresso
          </button>
          <input
            type="file"
            accept=".json,application/json"
            hidden
            ref={inputArquivo}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file !== undefined) void carregarProgresso(file);
              e.currentTarget.value = ""; // escolher o mesmo arquivo de novo precisa reabrir o diálogo
            }}
          />
        </div>
        <ol>
          <For each={list()}>
            {(def, i) => (
              <li>
                <button
                  classList={{
                    "ex-lvl": true,
                    done: isSolved(progress(), def),
                    current: def.id === current()?.id,
                    locked: !isUnlocked(list(), i(), progress()),
                  }}
                  disabled={!isUnlocked(list(), i(), progress())}
                  onClick={() => selectExercise(def, s)}
                  title={
                    isUnlocked(list(), i(), progress())
                      ? def.title
                      : "conclua o nível anterior para desbloquear"
                  }
                >
                  <span class="ex-badge">
                    {isSolved(progress(), def)
                      ? progress().solved[def.id] === "help"
                        ? "☆"
                        : "★"
                      : isUnlocked(list(), i(), progress())
                        ? "▶"
                        : "🔒"}
                  </span>
                  <span class="ex-lvl-label">
                    {i() + 1}. {def.title}
                  </span>
                </button>
              </li>
            )}
          </For>
        </ol>
      </aside>

      <div class="ex-main">
        <Show when={current()}>
          {(def) => (
            <>
              <section class="panel">
                <h2>nível {list().indexOf(def()) + 1} — {def().title}</h2>
                <h3>base teórica</h3>
                <p>{def().theory}</p>
                <Show when={def().cCode !== undefined}>
                  <h3>a mesma lógica em C</h3>
                  <pre class="ex-c-code">{def().cCode}</pre>
                </Show>
                <h3>o problema</h3>
                <p>{def().statement}</p>
                <div class="row">
                  <button onClick={() => props.onOpenMachine?.()}>Ir para o editor</button>
                </div>
                <div class="hint">
                  o editor é o mesmo das duas abas — o exercício já está lá, com as entradas do
                  caso de teste gravadas na RAM e o botão de submeter. Clicar no nível na lista
                  reabre o rascunho salvo se você o tiver trocado por outro programa.
                </div>
              </section>

              <section class="panel">
                <h2>dicas</h2>
                <div class="row">
                  <For each={def().hints}>
                    {(_, i) => (
                      <Show
                        when={i() < hintCount(def())}
                        fallback={
                          <button onClick={() => revealHint(def())} disabled={i() !== hintCount(def())}>
                            dica {i() + 1}
                          </button>
                        }
                      >
                        <p class="hint">💡 {def().hints[i()]}</p>
                      </Show>
                    )}
                  </For>
                </div>
                <Show when={hintCount(def()) >= def().hints.length && !isSolved(progress(), def())}>
                  <div class="row">
                    <button onClick={() => giveUp(def())}>
                      Desistir e ver a solução de referência
                    </button>
                  </div>
                </Show>
              </section>

              <section class="panel">
                <h2>verificação</h2>
                <div class="row">
                  <button class="run" onClick={() => verifyActive(s)}>
                    Verificar (roda {def().cases.length} casos de teste)
                  </button>
                </div>
                <div class="hint">
                  cada caso roda seu programa numa máquina fresca, com valores de entrada
                  diferentes nos endereços de origem, e confere os endereços de destino.
                </div>
                <Show when={celebrate() !== null}>
                  <Celebrate texto={celebrate()!} />
                </Show>
                <Show when={results() !== null && verifiedId() === def().id}>
                  <ExerciseResults results={results()!} />
                </Show>
              </section>

              <section class="panel">
                <MelhorPerformance exercicioId={def().id} />
              </section>

              <Show when={isSolved(progress(), def())}>
                <section class="panel">
                  <h2>solução de referência</h2>
                  <div class="row">
                    <button
                      onClick={() => alternarSolucao()}
                      title="a solução de referência fica oculta; revele só quando quiser comparar com o seu programa"
                    >
                      {solucaoVisivel() ? "Ocultar solução" : "Mostrar solução"}
                    </button>
                  </div>
                  <Show when={solucaoVisivel()}>
                    <pre class="ex-solution">{def().solution}</pre>
                  </Show>
                </section>
              </Show>
            </>
          )}
        </Show>

        <Editor store={s} onBlur={() => saveDraftActive(s)} />
      </div>
    </div>
  );
}
