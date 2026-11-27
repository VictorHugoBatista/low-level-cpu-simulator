import { For, Show } from "solid-js";
import { melhor } from "../marcador.js";

/**
 * O card "melhor performance" do exercício: a melhor verificação já feita — a soma dos
 * ciclos de todos os casos de teste e o detalhe por caso. Aparece na tela de cada
 * exercício — na aba exercícios e no painel do exercício ativo na aba máquina. A função
 * atualizarMelhor (chamada pela verificação) o atualiza a cada submissão com sucesso,
 * e só quando a rodada foi melhor: menos ciclos vence, a marca nunca sobe.
 */
export function MelhorPerformance(props: { exercicioId: string }) {
  const marca = () => melhor(props.exercicioId);
  return (
    <div class="mp">
      <h3>melhor performance</h3>
      <Show
        when={marca() !== undefined}
        fallback={
          <span
            class="mp-vazio"
            title="verifique com todos os casos passando para registrar seus ciclos"
          >
            — ainda sem verificação com sucesso
          </span>
        }
      >
        <div class="mp-corpo">
          <span class="mp-valor" title="atualiza a cada verificação com sucesso — só melhora">
            {marca()!.total} ciclos
          </span>
          <Show when={marca()!.casos.length > 0}>
            <ul class="mp-casos">
              <For each={marca()!.casos}>
                {(caso) => (
                  <li>
                    <span class="mp-caso">{caso.name}</span> {caso.ciclos} ciclos
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </Show>
    </div>
  );
}
