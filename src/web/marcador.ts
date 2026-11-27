import { createSignal } from "solid-js";

/**
 * O card de melhor performance: para cada exercício, a melhor verificação já feita —
 * a soma dos ciclos de todos os casos de teste e o detalhe por caso. A verificação só
 * roda com todos os casos passando (resultado correto é pré-condição, o conferente é
 * o próprio verificador); a cada verificação com sucesso a marca é avaliada e
 * atualizada se for melhor — menos ciclos, melhor performance.
 *
 * Fica em localStorage, no mesmo padrão do progresso de exercícios (exerciseState.ts):
 * chave com prefixo "ak8-" e shape guard defensivo na leitura.
 */

/** Ciclos de um caso de teste da melhor rodada. */
export interface CasoCiclos {
  name: string;
  ciclos: number;
}

/** A melhor rodada de um exercício: o total que o card compara e o detalhe por caso. */
export interface MarcaExercicio {
  /** Soma dos ciclos de todos os casos — o número que decide a melhor performance. */
  total: number;
  /** Ciclos por caso de teste, na ordem do catálogo. */
  casos: CasoCiclos[];
}

export interface MarcadorState {
  /** exercício (id) → melhor rodada. */
  marcas: Record<string, MarcaExercicio>;
}

const STORAGE_KEY = "ak8-marcador";

const limparMarca = (v: unknown): MarcaExercicio | null => {
  // Schema antigo, só a soma: migra para a marca nova, sem detalhe por caso.
  // Total 0 não existe em rodada real (cada caso roda ao menos o fetch) — é dado
  // adulterado, e uma marca de 0 ciclos seria inbatível.
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return { total: v, casos: [] };
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const m = v as Partial<MarcaExercicio>;
  if (typeof m.total !== "number" || !Number.isFinite(m.total) || m.total <= 0) return null;
  if (!Array.isArray(m.casos)) return null;
  const casos: CasoCiclos[] = [];
  for (const c of m.casos) {
    if (
      typeof c === "object" &&
      c !== null &&
      typeof (c as CasoCiclos).name === "string" &&
      typeof (c as CasoCiclos).ciclos === "number" &&
      Number.isFinite((c as CasoCiclos).ciclos)
    ) {
      casos.push({ name: (c as CasoCiclos).name, ciclos: (c as CasoCiclos).ciclos });
    }
  }
  return { total: m.total, casos };
};

function loadMarcador(): MarcadorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      // Shape guard: JSON válido com estrutura inesperada (dado adulterado ou schema de
      // versão futura) não pode derrubar a página — cada campo volta ao default.
      const parsed = JSON.parse(raw) as Partial<MarcadorState>;
      const marcas =
        typeof parsed.marcas === "object" && parsed.marcas !== null && !Array.isArray(parsed.marcas)
          ? parsed.marcas
          : {};
      const limpas: Record<string, MarcaExercicio> = {};
      for (const [exercicio, marca] of Object.entries(marcas)) {
        const limpa = limparMarca(marca);
        if (limpa !== null) limpas[exercicio] = limpa;
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

/** A melhor rodada registrada do exercício — undefined enquanto nada verificado. */
export const melhor = (exercicio: string): MarcaExercicio | undefined =>
  marcador().marcas[exercicio];

/** A rodada nova vence a guardada: total menor, ou primeiro registro; em empate de
 * total, só troca quando a marca guardada está sem detalhe (migrada do schema antigo,
 * que só tinha a soma) e a rodada nova trouxe o detalhe — preencher o card não pode
 * nunca custar ciclos. */
function deveTrocar(atual: MarcaExercicio | undefined, marca: MarcaExercicio): boolean {
  if (atual === undefined) return true;
  if (marca.total < atual.total) return true;
  return marca.total === atual.total && atual.casos.length === 0 && marca.casos.length > 0;
}

/** Registra (ou melhora) a marca de um exercício. Puro: devolve o estado novo sem tocar
 * no atual — a marca só recua, nunca sobe; quem compara é o total. */
export function registrarMelhor(
  state: MarcadorState,
  exercicio: string,
  marca: MarcaExercicio,
): MarcadorState {
  if (!deveTrocar(state.marcas[exercicio], marca)) return state;
  return { ...state, marcas: { ...state.marcas, [exercicio]: marca } };
}

/** Atualiza o card a cada verificação com sucesso: recebe os ciclos de cada caso de
 * teste, soma no total e registra quando é a primeira marca do exercício, quando a
 * rodada foi melhor ou quando empata com uma marca antiga que só tinha a soma. Do
 * contrário, não mexe. Devolve true quando houve registro novo ou melhorado. */
export function atualizarMelhor(exercicio: string, casos: readonly CasoCiclos[]): boolean {
  if (casos.length === 0) return false; // exercício sem casos não tem rodada que valha
  const total = casos.reduce((soma, c) => soma + c.ciclos, 0);
  if (!(total > 0)) return false;
  const marca: MarcaExercicio = { total, casos: [...casos] };
  if (!deveTrocar(marcador().marcas[exercicio], marca)) return false;
  updateMarcador((s) => registrarMelhor(s, exercicio, marca));
  return true;
}
