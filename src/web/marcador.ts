import { createSignal } from "solid-js";
import type { Machine } from "../runtime/machine.js";

/**
 * O marcador de melhores execuções: cada pessoa guarda o menor número de ciclos já
 * alcançado em cada exemplo da máquina. A execução vale quando a máquina para por HLT,
 * o programa carregado é um dos exemplos (ou fonte dele editado e remontado) e o
 * resultado continua correto — cada exemplo tem seu conferente, então otimizar o fonte
 * está liberado, trapacear o resultado não. A marca de uma pessoa é a soma dos melhores
 * ciclos dos exemplos: menos ciclos, melhor execução.
 *
 * O placar fica em localStorage, no mesmo padrão do progresso de exercícios
 * (exerciseState.ts): chaves com prefixo "ak8-" e shape guard defensivo na leitura.
 */

export interface MarcadorState {
  /** Apelido em uso neste navegador; vazio enquanto a pessoa não se identifica. */
  jogador: string;
  /** jogador → exemplo → melhores ciclos. */
  marcas: Record<string, Record<string, number>>;
}

export interface ExemploMarcador {
  /** Chave nos registros do placar. */
  name: string;
  /** Nome do programa carregado (LoadedProgram.name) quando o exemplo roda. */
  arquivo: string;
  /** O resultado precisa continuar correto para a execução valer. */
  conferir: (m: Machine) => boolean;
}

/** O conferente de cada exemplo usa o que a execução DESTE run escreveu: as transações
 * do barramento desde o último reset, não a memória que já estava lá — rodar um HLT
 * seco em cima de um $0300 que sobrou de execução anterior não vira marca. */
export const EXEMPLOS_MARCADOR: ExemploMarcador[] = [
  {
    name: "soma",
    arquivo: "soma.asm",
    conferir: (m) => m.transactions.some((t) => t.write && t.address === 0x0300 && t.data === 5),
  },
  {
    name: "desvio",
    arquivo: "desvio.asm",
    conferir: (m) => m.transactions.some((t) => t.write && t.address === 0x0300 && t.data === 1),
  },
  {
    name: "hello-disk",
    arquivo: "hello-disk.asm",
    conferir: (m) => m.terminal.text.includes("Ola, MOS-6502!"),
  },
];

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
          for (const [exemplo, ciclos] of Object.entries(marcasPessoa)) {
            if (typeof ciclos === "number" && Number.isFinite(ciclos) && ciclos >= 0)
              limpas[exemplo] = ciclos;
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

/** Registra (ou melhora) a marca de uma pessoa em um exemplo. Puro: devolve o estado
 * novo sem tocar no atual — a marca só recua, nunca sobe. */
export function registrarExecucao(
  state: MarcadorState,
  pessoa: string,
  exemplo: string,
  ciclos: number,
): MarcadorState {
  const atual = state.marcas[pessoa]?.[exemplo];
  if (atual !== undefined && atual <= ciclos) return state;
  const daPessoa = { ...(state.marcas[pessoa] ?? {}), [exemplo]: ciclos };
  return { ...state, marcas: { ...state.marcas, [pessoa]: daPessoa } };
}

export interface LinhaRanking {
  jogador: string;
  /** Marca por exemplo; undefined quando o exemplo ainda não foi rodado. */
  marcas: Record<string, number | undefined>;
  /** Soma das marcas já feitas. */
  parcial: number;
  /** true quando a pessoa tem marca em todos os exemplos — só aí o total compara. */
  completa: boolean;
}

/** O placar ordenado: quem completou os três exemplos primeiro, pelo menor total;
 * incompletas depois, da mais completa para a menos. Puro. */
export function ranking(state: MarcadorState, exemplos: readonly string[]): LinhaRanking[] {
  const linhas: LinhaRanking[] = [];
  for (const [pessoa, marcasPessoa] of Object.entries(state.marcas)) {
    if (pessoa === "") continue; // registro órfão: captura nunca grava sem nome
    const marcas: Record<string, number | undefined> = {};
    let parcial = 0;
    let completa = true;
    for (const ex of exemplos) {
      const v = marcasPessoa[ex];
      marcas[ex] = v;
      if (v === undefined) completa = false;
      else parcial += v;
    }
    linhas.push({ jogador: pessoa, marcas, parcial, completa });
  }
  return linhas.sort((a, b) => {
    if (a.completa !== b.completa) return a.completa ? -1 : 1;
    if (a.completa) return a.parcial - b.parcial;
    const feitos = (l: LinhaRanking) => exemplos.filter((e) => l.marcas[e] !== undefined).length;
    return (
      feitos(b) - feitos(a) ||
      a.parcial - b.parcial ||
      a.jogador.localeCompare(b.jogador)
    );
  });
}

/** Captura no fim de uma execução (o hook onHalt da loja chama): vale quando a pessoa
 * já se identificou, o programa carregado é um dos exemplos e o resultado conferiu.
 * Devolve true quando a captura criou ou melhorou a marca da pessoa. */
export function capturarExecucao(m: Machine, programName: string | null): boolean {
  const pessoa = jogador().trim();
  if (pessoa === "") return false;
  const exemplo = EXEMPLOS_MARCADOR.find((e) => e.arquivo === programName);
  if (exemplo === undefined) return false;
  if (!exemplo.conferir(m)) return false;
  const anterior = estado().marcas[pessoa]?.[exemplo.name];
  updateMarcador((s) => registrarExecucao(s, pessoa, exemplo.name, m.cycleCount));
  return anterior === undefined || m.cycleCount < anterior;
}
