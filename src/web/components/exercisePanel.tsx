import { For, Show } from "solid-js";
import type { Store } from "../store.js";
import { Celebrate } from "./celebrate.js";
import {
  activeExercise,
  activeTrack,
  applyActiveCase,
  caseIndex,
  celebrate,
  results,
  verifiedId,
  verifyActive,
} from "../exerciseState.js";
import type { CaseResult } from "../../runtime/exercise.js";

/**
 * Painel do exercício ativo na aba máquina: enunciado à mão, as entradas do caso de
 * teste gravadas na RAM (a pessoa roda e acompanha nos painéis) e o botão de submeter
 * que roda os casos de teste — desenvolver o exercício sem sair da máquina.
 */

/** Tabela de resultado da verificação, compartilhada com a aba de exercícios. */
export function ExerciseResults(props: { results: CaseResult[] }) {
  return (
    <table class="ref ex-cases">
      <tbody>
        <For each={props.results}>
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
  );
}

export function ExercisePanel(props: { store: Store; onOpenExercises?: () => void }) {
  const s = props.store;
  return (
    <Show when={activeExercise()}>
      {(def) => (
        <section class="panel ex-banner">
          <h2>
            exercício {activeTrack().exercises.indexOf(def()) + 1} — {def().title}
          </h2>
          <details class="ex-statement">
            <summary>enunciado</summary>
            <p>{def().statement}</p>
          </details>
          <div class="row ex-case-row">
            <span class="ex-case-label">caso de teste:</span>
            <For each={def().cases}>
              {(c, i) => (
                <button
                  classList={{ "ex-case": true, active: i() === caseIndex() }}
                  onClick={() => applyActiveCase(s, i())}
                  title={c.name}
                >
                  {i() + 1}
                </button>
              )}
            </For>
            <span class="ex-case-name">{def().cases[caseIndex()]?.name}</span>
          </div>
          <div class="hint">
            as entradas do caso estão gravadas na RAM — dê Run (ou Passo) e confira o
            resultado na memória; troque o caso e remonte para testar outros valores.
          </div>
          <div class="row">
            <button class="run" onClick={() => verifyActive(s)}>
              Submeter resposta (roda {def().cases.length} casos de teste)
            </button>
            <Show when={props.onOpenExercises !== undefined}>
              <button onClick={() => props.onOpenExercises?.()}>teoria e dicas</button>
            </Show>
          </div>
          <Show when={celebrate() !== null}>
            <Celebrate texto={celebrate()!} />
          </Show>
          <Show when={results() !== null && verifiedId() === def().id}>
            <ExerciseResults results={results()!} />
          </Show>
        </section>
      )}
    </Show>
  );
}
