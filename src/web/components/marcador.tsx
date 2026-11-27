import { For, Show } from "solid-js";
import type { Store } from "../store.js";
import {
  EXEMPLOS_MARCADOR,
  estado,
  jogador,
  ranking,
  setJogador,
} from "../marcador.js";

/**
 * A aba "marcador": quem está executando se identifica com um nome, roda os três
 * exemplos (pode editar o fonte e remontar à vontade — o conferente exige que o
 * resultado continue correto) e disputa a menor soma de ciclos. A captura é automática:
 * toda vez que um exemplo chega ao HLT com resultado válido, a marca da pessoa é
 * avaliada — só recua, nunca sobe.
 */
export function MarcadorPage(props: { store: Store }) {
  const exemplos = EXEMPLOS_MARCADOR.map((e) => e.name);
  const linhas = () => ranking(estado(), exemplos);

  return (
    <div class="marcador">
      <section class="panel">
        <h2>marcador de melhores execuções</h2>
        <div class="row">
          <input
            type="text"
            placeholder="seu nome"
            value={jogador()}
            maxLength={40}
            onInput={(e) => setJogador(e.currentTarget.value)}
            title="nome pelo qual suas execuções entram no placar"
          />
        </div>
        <p class="hint">
          Rode os três exemplos na aba máquina — editar o fonte e remontar à vontade faz
          parte do desafio, desde que o resultado continue correto: soma deixa 5 em $0300,
          desvio deixa 1 em $0300 e hello-disk imprime "Ola, MOS-6502!" no terminal. Fica
          guardada a sua melhor execução de cada exemplo e a sua marca é a soma dos
          melhores ciclos: menos ciclos vence.
        </p>
      </section>
      <section class="panel">
        <h2>placar</h2>
        <Show
          when={linhas().length > 0}
          fallback={
            <p class="hint">
              Ninguém no placar ainda: identifique-se e rode o primeiro exemplo até o HLT.
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>pessoa</th>
                <For each={EXEMPLOS_MARCADOR}>
                  {(ex) => <th class="num">{ex.name}</th>}
                </For>
                <th class="num">total</th>
              </tr>
            </thead>
            <tbody>
              <For each={linhas()}>
                {(linha) => (
                  <tr classList={{ eu: linha.jogador === jogador() }}>
                    <td>{linha.jogador}</td>
                    <For each={EXEMPLOS_MARCADOR}>
                      {(ex) => (
                        <td class="num" classList={{ falta: linha.marcas[ex.name] === undefined }}>
                          {linha.marcas[ex.name] ?? "—"}
                        </td>
                      )}
                    </For>
                    <td class="num total">{linha.completa ? linha.parcial : "—"}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </section>
    </div>
  );
}
