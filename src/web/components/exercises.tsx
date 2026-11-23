import { For, Show } from "solid-js";
import { Editor } from "./editor.js";
import { ExerciseResults } from "./exercisePanel.js";
import type { Store } from "../store.js";
import { EXERCISES } from "../exerciseCatalog.js";
import type { ExerciseDef } from "../exerciseCatalog.js";
import {
  activeExercise,
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

/** O próximo nível só abre quando o anterior foi concluído. */
const isUnlocked = (index: number, p: { solved: Record<string, unknown> }): boolean =>
  index === 0 || isSolved(p, EXERCISES[index - 1]);

export function ExercisesPage(props: { store: Store }) {
  const s = props.store;

  const current = (): ExerciseDef | undefined => activeExercise();
  const hintCount = (def: ExerciseDef): number => progress().hints[def.id] ?? 0;
  const solvedCount = (): number => EXERCISES.filter((d) => isSolved(progress(), d)).length;

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

  const restoreTemplate = (def: ExerciseDef): void => {
    updateProgress((p) => ({ ...p, drafts: { ...p.drafts, [def.id]: def.template } }));
    openExercise(def, s);
  };

  /** Ao montar a aba, se nenhum exercício está ativo (primeira visita), abre o próximo
   * nível não resolvido — o contexto (editor + entradas do caso) já fica na máquina. */
  if (current() === undefined) {
    const firstOpen = Math.max(0, EXERCISES.findIndex((def) => !isSolved(progress(), def)));
    const initial = EXERCISES[firstOpen] ?? EXERCISES[0];
    if (initial !== undefined) openExercise(initial, s);
  }

  return (
    <div class="ex">
      <aside class="panel ex-levels">
        <h2>exercícios</h2>
        <div class="ex-progress">
          <div class="ex-bar">
            <div class="ex-bar-fill" style={{ width: `${(solvedCount() / EXERCISES.length) * 100}%` }} />
          </div>
          <span class="ex-count">{solvedCount()}/{EXERCISES.length} níveis</span>
        </div>
        <ol>
          <For each={EXERCISES}>
            {(def, i) => (
              <li>
                <button
                  classList={{
                    "ex-lvl": true,
                    done: isSolved(progress(), def),
                    current: def.id === current()?.id,
                    locked: !isUnlocked(i(), progress()),
                  }}
                  disabled={!isUnlocked(i(), progress())}
                  onClick={() => selectExercise(def, s)}
                  title={
                    isUnlocked(i(), progress())
                      ? def.title
                      : "conclua o nível anterior para desbloquear"
                  }
                >
                  <span class="ex-badge">
                    {isSolved(progress(), def)
                      ? progress().solved[def.id] === "help"
                        ? "☆"
                        : "★"
                      : isUnlocked(i(), progress())
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
                <h2>nível {EXERCISES.indexOf(def()) + 1} — {def().title}</h2>
                <h3>base teórica</h3>
                <p>{def().theory}</p>
                <h3>o problema</h3>
                <p>{def().statement}</p>
                <div class="row">
                  <button onClick={() => openExercise(def(), s)}>Recarregar no editor</button>
                  <button onClick={() => restoreTemplate(def())}>Restaurar template</button>
                </div>
                <div class="hint">
                  este exercício também está aberto na aba máquina — com as entradas do caso
                  de teste gravadas na RAM e o botão de submeter junto do editor.
                </div>
              </section>

              <section class="panel">
                <h3>dicas</h3>
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
                <h3>verificação</h3>
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
                  <p class="ex-celebrate">🏆 {celebrate()}</p>
                </Show>
                <Show when={results() !== null && verifiedId() === def().id}>
                  <ExerciseResults results={results()!} />
                </Show>
              </section>

              <Show when={isSolved(progress(), def())}>
                <section class="panel">
                  <h3>solução de referência</h3>
                  <pre class="ex-solution">{def().solution}</pre>
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
