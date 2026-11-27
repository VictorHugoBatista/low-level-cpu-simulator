import { For, Show } from "solid-js";
import { estado, jogador, rankingExercicio, setJogador } from "../marcador.js";

/**
 * "Melhor performance" de um exercício: a menor soma de ciclos de todos os casos de
 * teste já verificada por cada pessoa. Aparece na tela de cada exercício — na aba
 * exercícios e no painel do exercício ativo na aba máquina. O nome identifica a pessoa
 * no placar (fica em localStorage); a captura é automática em cada verificação que
 * passa, e a marca de cada pessoa só recua, nunca sobe.
 */
export function MelhorPerformance(props: { exercicioId: string }) {
  const linhas = () => rankingExercicio(estado(), props.exercicioId);

  return (
    <div class="mp">
      <div class="row mp-head">
        <span class="mp-label">melhor performance</span>
        <input
          type="text"
          placeholder="seu nome"
          value={jogador()}
          maxLength={40}
          onInput={(e) => setJogador(e.currentTarget.value)}
          title="nome pelo qual suas execuções entram no placar deste exercício"
        />
      </div>
      <Show
        when={linhas().length > 0}
        fallback={
          <p class="hint">
            ninguém marcou aqui ainda — verifique com todos os casos passando para registrar
            seus ciclos; menos ciclos é a melhor performance.
          </p>
        }
      >
        <table>
          <tbody>
            <For each={linhas()}>
              {(linha) => (
                <tr classList={{ eu: linha.jogador === jogador() }}>
                  <td>{linha.jogador}</td>
                  <td class="num">
                    {linha.ciclos} ciclos
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
