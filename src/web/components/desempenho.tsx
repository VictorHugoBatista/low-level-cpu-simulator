import { Show } from "solid-js";
import { melhor } from "../marcador.js";

/**
 * O card "melhor performance" do exercício: a menor soma de ciclos de todos os casos
 * de teste já verificada. Aparece na tela de cada exercício — na aba exercícios e no
 * painel do exercício ativo na aba máquina. A função atualizarMelhor (chamada pela
 * verificação) o atualiza a cada submissão com sucesso, e só quando a rodada foi
 * melhor: menos ciclos vence, a marca nunca sobe.
 */
export function MelhorPerformance(props: { exercicioId: string }) {
  const ciclos = () => melhor(props.exercicioId);
  return (
    <div class="mp">
      <span class="mp-label">melhor performance</span>
      <Show
        when={ciclos() !== undefined}
        fallback={
          <span class="mp-vazio" title="verifique com todos os casos passando para registrar seus ciclos">
            — ainda sem verificação com sucesso
          </span>
        }
      >
        <span class="mp-valor" title="atualiza a cada verificação com sucesso — só melhora">
          {ciclos()} ciclos
        </span>
      </Show>
    </div>
  );
}
