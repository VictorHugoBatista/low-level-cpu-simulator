import { createSignal } from "solid-js";

/**
 * O card de melhor performance: para cada exercício, a menor soma de ciclos de todos
 * os casos de teste já verificada. A verificação roda os casos e o resultado só vale
 * com todos passando (resultado correto é pré-condição, o conferente é o próprio
 * verificador); a cada verificação com sucesso a marca é avaliada e atualizada se for
 * melhor — menos ciclos, melhor performance.
 *
 * Fica em localStorage, no mesmo padrão do progresso de exercícios (exerciseState.ts):
 * chave com prefixo "ak8-" e shape guard defensivo na leitura.
 */

export interface MarcadorState {
  /** exercício (id) → melhores ciclos. */
  marcas: Record<string, number>;
}

const STORAGE_KEY = "ak8-marcador";

function loadMarcador(): MarcadorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      // Shape guard: JSON válido com estrutura inesperada (dado adulterado ou schema de
      // versão futura) não pode derrubar a página — cada campo volta ao default.
      const parsed = JSON.parse(raw) as Partial<MarcadorState>;
      const marcas = typeof parsed.marcas === "object" && parsed.marcas !== null && !Array.isArray(parsed.marcas)
        ? parsed.marcas
        : {};
      const limpas: Record<string, number> = {};
      for (const [exercicio, ciclos] of Object.entries(marcas)) {
        if (typeof ciclos === "number" && Number.isFinite(ciclos) && ciclos >= 0)
          limpas[exercicio] = ciclos;
      }
      return { marcas: limpas };
    }
  } catch {
    /* localStorage indisponível ou JSON inválido: placar só vale para a sessão */
  }
  return { marcas: {} };
}

function saveMarcador(m: MarcadorState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {
    /* localStorage indisponível: placar só vale para a sessão */
  }
}

const [marcador, setMarcador] = createSignal<MarcadorState>(loadMarcador());

const updateMarcador = (fn: (m: MarcadorState) => MarcadorState): void => {
  setMarcador((prev) => {
    const next = fn(prev);
    saveMarcador(next);
    return next;
  });
};

/** A melhor performance registrada do exercício — undefined enquanto nada verificado. */
export const melhor = (exercicio: string): number | undefined => marcador().marcas[exercicio];

/** Registra (ou melhora) a marca de um exercício. Puro: devolve o estado novo sem tocar
 * no atual — a marca só recua, nunca sobe. */
export function registrarMelhor(
  state: MarcadorState,
  exercicio: string,
  ciclos: number,
): MarcadorState {
  const atual = state.marcas[exercicio];
  if (atual !== undefined && atual <= ciclos) return state;
  return { ...state, marcas: { ...state.marcas, [exercicio]: ciclos } };
}

/** Atualiza o card a cada verificação com sucesso: registra quando é a primeira marca
 * do exercício ou quando a rodada foi melhor (menos ciclos); do contrário, não mexe.
 * Devolve true quando houve registro novo ou melhorado. */
export function atualizarMelhor(exercicio: string, ciclos: number): boolean {
  const atual = marcador().marcas[exercicio];
  if (atual !== undefined && atual <= ciclos) return false;
  updateMarcador((s) => registrarMelhor(s, exercicio, ciclos));
  return true;
}
