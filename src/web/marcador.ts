import { createSignal } from "solid-js";

/**
 * O marcador de melhores execuções: cada pessoa guarda o menor número de ciclos já
 * alcançado em cada exercício. A execução é medida pela verificação — a soma dos ciclos
 * de todos os casos de teste, que só roda quando todos passam (resultado correto é
 * pré-condição, o conferente é o próprio verificador). Menos ciclos, melhor performance.
 *
 * O placar fica em localStorage, no mesmo padrão do progresso de exercícios
 * (exerciseState.ts): chaves com prefixo "ak8-" e shape guard defensivo na leitura.
 */

export interface MarcadorState {
  /** Apelido em uso neste navegador; vazio enquanto a pessoa não se identifica. */
  jogador: string;
  /** pessoa → exercício (id) → melhores ciclos. */
  marcas: Record<string, Record<string, number>>;
}

const STORAGE_KEY = "ak8-marcador";

function loadMarcador(): MarcadorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      // Shape guard: JSON válido com estrutura inesperada (dado adulterado ou schema de
      // versão futura) não pode derrubar a página — cada campo volta ao default.
      const parsed = JSON.parse(raw) as Partial<MarcadorState>;
      const limparPessoas = (v: unknown): Record<string, Record<string, number>> => {
        if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
        const out: Record<string, Record<string, number>> = {};
        for (const [pessoa, marcasPessoa] of Object.entries(v)) {
          if (typeof marcasPessoa !== "object" || marcasPessoa === null || Array.isArray(marcasPessoa))
            continue;
          const limpas: Record<string, number> = {};
          for (const [exercicio, ciclos] of Object.entries(marcasPessoa)) {
            if (typeof ciclos === "number" && Number.isFinite(ciclos) && ciclos >= 0)
              limpas[exercicio] = ciclos;
          }
          out[pessoa] = limpas;
        }
        return out;
      };
      return {
        jogador: typeof parsed.jogador === "string" ? parsed.jogador : "",
        marcas: limparPessoas(parsed.marcas),
      };
    }
  } catch {
    /* localStorage indisponível ou JSON inválido: placar só vale para a sessão */
  }
  return { jogador: "", marcas: {} };
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

/** O estado completo do placar (reativo). */
export const estado = (): MarcadorState => marcador();

/** O apelido em uso agora — vazio enquanto a pessoa não se identifica. */
export const jogador = (): string => marcador().jogador;

/** Define o apelido em uso neste navegador. */
export const setJogador = (nome: string): void => {
  updateMarcador((m) => ({ ...m, jogador: nome }));
};

/** Registra (ou melhora) a marca de uma pessoa em um exercício. Puro: devolve o estado
 * novo sem tocar no atual — a marca só recua, nunca sobe. */
export function registrarExecucao(
  state: MarcadorState,
  pessoa: string,
  exercicio: string,
  ciclos: number,
): MarcadorState {
  const atual = state.marcas[pessoa]?.[exercicio];
  if (atual !== undefined && atual <= ciclos) return state;
  const daPessoa = { ...(state.marcas[pessoa] ?? {}), [exercicio]: ciclos };
  return { ...state, marcas: { ...state.marcas, [pessoa]: daPessoa } };
}

export interface LinhaRanking {
  jogador: string;
  ciclos: number;
}

/** O placar de um exercício: quem tem marca nele, do menor número de ciclos para o
 * maior (empate em ordem alfabética). Puro. */
export function rankingExercicio(state: MarcadorState, exercicio: string): LinhaRanking[] {
  const linhas: LinhaRanking[] = [];
  for (const [pessoa, marcasPessoa] of Object.entries(state.marcas)) {
    const ciclos = marcasPessoa[exercicio];
    if (pessoa !== "" && ciclos !== undefined) linhas.push({ jogador: pessoa, ciclos });
  }
  return linhas.sort(
    (a, b) => a.ciclos - b.ciclos || a.jogador.localeCompare(b.jogador),
  );
}

/** Captura o resultado de uma verificação: vale quando a pessoa já se identificou. O
 * chamador (verifyActive) só captura com todos os casos passando, e os ciclos são a
 * soma dos ciclos de todos os casos. Devolve true quando a captura criou ou melhorou
 * a marca da pessoa. */
export function capturarExecucao(exercicio: string, ciclos: number): boolean {
  const pessoa = jogador().trim();
  if (pessoa === "") return false;
  const anterior = estado().marcas[pessoa]?.[exercicio];
  updateMarcador((s) => registrarExecucao(s, pessoa, exercicio, ciclos));
  return anterior === undefined || ciclos < anterior;
}
