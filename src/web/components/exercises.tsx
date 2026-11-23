import { For, Show, createSignal } from "solid-js";
import { Editor } from "./editor.js";
import type { Store } from "../store.js";
import { EXERCISES } from "../exerciseCatalog.js";
import type { ExerciseDef } from "../exerciseCatalog.js";
import { AsmError, assemble } from "../../asm/assembler.js";
import { runExerciseCases } from "../../runtime/exercise.js";
import type { CaseResult } from "../../runtime/exercise.js";

/**
 * A série de exercícios de fixação, gamificada: níveis que se desbloqueiam em sequência,
 * teoria breve + enunciado + dicas progressivas, e verificação por comportamento — cada
 * caso de teste roda o programa do aluno numa máquina fresca com valores de entrada
 * diferentes e confere os endereços de destino. Progresso e rascunhos ficam em
 * localStorage, no mesmo padrão do tema e do layout.
 */

type LevelStatus = "full" | "help";

interface ExerciseProgress {
  solved: Record<string, LevelStatus>;
  drafts: Record<string, string>;
  hints: Record<string, number>;
}

const STORAGE_KEY = "ak8-exercises";

function loadProgress(): ExerciseProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      // Shape guard: JSON válido com estrutura inesperada (dado adulterado ou schema de
      // versão futura) não pode derrubar a página — cada campo volta ao default.
      const parsed = JSON.parse(raw) as Partial<ExerciseProgress>;
      const rec = (v: unknown): Record<string, unknown> =>
        typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
      return {
        solved: rec(parsed.solved) as ExerciseProgress["solved"],
        drafts: rec(parsed.drafts) as ExerciseProgress["drafts"],
        hints: rec(parsed.hints) as ExerciseProgress["hints"],
      };
    }
  } catch {
    /* localStorage indisponível ou JSON inválido: progresso só vale para a sessão */
  }
  return { solved: {}, drafts: {}, hints: {} };
}

function saveProgress(p: ExerciseProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* localStorage indisponível: progresso só vale para a sessão */
  }
}

const isSolved = (p: ExerciseProgress, def: ExerciseDef): boolean =>
  p.solved[def.id] !== undefined;

/** O próximo nível só abre quando o anterior foi concluído. */
const isUnlocked = (index: number, p: ExerciseProgress): boolean =>
  index === 0 || isSolved(p, EXERCISES[index - 1]);

export function ExercisesPage(props: { store: Store }) {
  const s = props.store;
  const [progress, setProgress] = createSignal<ExerciseProgress>(loadProgress());
  const firstOpen = Math.max(
    0,
    EXERCISES.findIndex((def) => !isSolved(progress(), def)),
  );
  const [currentId, setCurrentId] = createSignal<string>(EXERCISES[firstOpen]?.id ?? "");
  const [results, setResults] = createSignal<CaseResult[] | null>(null);
  const [verifiedId, setVerifiedId] = createSignal<string | null>(null);
  const [celebrate, setCelebrate] = createSignal<string | null>(null);

  const current = (): ExerciseDef | undefined => EXERCISES.find((d) => d.id === currentId());
  const hintCount = (def: ExerciseDef): number => progress().hints[def.id] ?? 0;
  const solvedCount = (): number =>
    EXERCISES.filter((d) => isSolved(progress(), d)).length;

  const update = (fn: (p: ExerciseProgress) => ExerciseProgress): void => {
    setProgress((prev) => {
      const next = fn(prev);
      saveProgress(next);
      return next;
    });
  };

  /** Salva o fonte corrente como rascunho do nível ativo (troca de nível e blur do editor). */
  const saveDraft = (def: ExerciseDef | undefined): void => {
    if (def === undefined) return;
    update((p) => ({ ...p, drafts: { ...p.drafts, [def.id]: s.source() } }));
  };

  /** Clique na lista de níveis: preserva o rascunho do nível que está saindo. */
  const select = (def: ExerciseDef): void => {
    saveDraft(current());
    open(def);
  };

  /** Abre o nível: restaura o rascunho (ou o template) no editor e na máquina. */
  const open = (def: ExerciseDef): void => {
    setCurrentId(def.id);
    setResults(null);
    setVerifiedId(null);
    setCelebrate(null);
    const draft = progress().drafts[def.id];
    s.loadAsm(draft ?? def.template, `${def.id}.asm`);
  };

  /** Roda a sequência de casos com os valores de entrada diferentes e confere os destinos. */
  const verify = (): void => {
    const def = current();
    if (def === undefined) return;
    setCelebrate(null);
    let program;
    try {
      const r = assemble(s.source(), `${def.id}.asm`);
      program = { origin: r.origin, bytes: r.bytes };
    } catch (e) {
      s.report(e instanceof AsmError ? e.message : String(e));
      setResults(null);
      return;
    }
    s.report(null);
    update((p) => ({ ...p, drafts: { ...p.drafts, [def.id]: s.source() } }));
    const out = runExerciseCases(program, def.cases);
    setResults(out);
    setVerifiedId(def.id);
    const allPassed = out.every((r) => r.passed);
    if (allPassed && !isSolved(progress(), def)) {
      update((p) => ({ ...p, solved: { ...p.solved, [def.id]: "full" } }));
      setCelebrate("Nível concluído! O próximo desbloqueou — continue a sequência.");
    } else if (allPassed) {
      setCelebrate("Ainda passando — pode revisar ou seguir adiante.");
    }
  };

  const revealHint = (def: ExerciseDef): void => {
    update((p) => {
      const used = p.hints[def.id] ?? 0;
      if (used >= def.hints.length) return p;
      return { ...p, hints: { ...p.hints, [def.id]: used + 1 } };
    });
  };

  /** Depois de todas as dicas: ver a solução avança o nível, marcado como "com ajuda". */
  const giveUp = (def: ExerciseDef): void => {
    update((p) => ({ ...p, solved: { ...p.solved, [def.id]: "help" } }));
    setCelebrate("Nível concluído com a solução de referência. Estude-a e siga adiante!");
  };

  const restoreTemplate = (def: ExerciseDef): void => {
    update((p) => ({ ...p, drafts: { ...p.drafts, [def.id]: def.template } }));
    s.loadAsm(def.template, `${def.id}.asm`);
    setResults(null);
  };

  /** Ao montar a aba, o nível corrente entra no editor — não sobra o exemplo anterior. */
  const initial = EXERCISES[firstOpen] ?? EXERCISES[0];
  if (initial !== undefined) open(initial);

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
                    current: def.id === currentId(),
                    locked: !isUnlocked(i(), progress()),
                  }}
                  disabled={!isUnlocked(i(), progress())}
                  onClick={() => select(def)}
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
                  <button onClick={() => open(def())}>Recarregar no editor</button>
                  <button onClick={() => restoreTemplate(def())}>Restaurar template</button>
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
                  <button class="run" onClick={verify}>
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
                  <table class="ref ex-cases">
                    <tbody>
                      <For each={results()}>
                        {(r) => (
                          <tr classList={{ pass: r.passed, fail: !r.passed }}>
                            <td class="mark">{r.passed ? "✓" : "✗"}</td>
                            <td class="cname">{r.name}</td>
                            <td class="detail">
                              <Show
                                when={r.passed}
                                fallback={
                                  <ul class="ex-fails">
                                    <For each={r.failures}>{(f) => <li>{f}</li>}</For>
                                  </ul>
                                }
                              >
                                {r.cycles} ciclos
                              </Show>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
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

        <Editor store={s} onBlur={() => saveDraft(current())} />
      </div>
    </div>
  );
}
