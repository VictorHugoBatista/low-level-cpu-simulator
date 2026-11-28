import { createSignal } from "solid-js";

/**
 * A rádio de fundo: estações retrowave/vaporwave ao vivo (Icecast), tocando fora
 * da máquina simulada — o rádio não fala com a Machine (store.ts é a ponte
 * núcleo↔UI), é só ambiente, como a chuva do CRT.
 *
 * O estado (ligado, volume, estação) fica em localStorage, no mesmo padrão do
 * marcador e do progresso: chave com prefixo "ak8-" e shape guard defensivo na
 * leitura. Os streams são de terceiros e podem sair do ar sem aviso: as URLs
 * moram só aqui, e cada estação lista espelhos de fallback na ordem de tentativa
 * (SomaFM mantém ice1/ice2/…; quando um canal sai, trocar o link é uma linha).
 */

export interface EstacaoRadio {
  id: string;
  /** Nome exibido no rodapé; a fonte vai no nome, que é o crédito que pedem. */
  nome: string;
  /** URLs do stream na ordem de tentativa: primária primeiro, espelhos depois. */
  streams: string[];
}

export const ESTACOES: EstacaoRadio[] = [
  {
    id: "u80s",
    nome: "Underground 80s · SomaFM",
    streams: [
      "https://ice1.somafm.com/u80s-128-mp3",
      "https://ice2.somafm.com/u80s-128-mp3",
    ],
  },
  {
    id: "vaporwaves",
    nome: "Vaporwaves · SomaFM",
    streams: [
      "https://ice1.somafm.com/vaporwaves-128-mp3",
      "https://ice2.somafm.com/vaporwaves-128-mp3",
    ],
  },
  {
    id: "nightride",
    nome: "Nightride FM",
    streams: ["https://stream.nightride.fm/nightride.mp3"],
  },
];

export interface PreferenciaRadio {
  /** Stop/play: ligado puxa o stream ao vivo; parado solta a conexão Icecast —
   * rádio ao vivo não tem posição para "despausar", o que passou, passou. */
  ligado: boolean;
  /** Volume do HTMLAudioElement, 0..1. */
  volume: number;
  /** id de uma entrada de ESTACOES. */
  estacao: string;
}

export const RADIO_PADRAO: PreferenciaRadio = {
  ligado: false, // começa parada: o navegador bloqueia play sem gesto, e música de surpresa atrapalha
  volume: 0.5,
  estacao: "u80s",
};

const STORAGE_KEY = "ak8-radio";

/** Shape guard: qualquer valor (JSON de localStorage ou dado adulterado) vira uma
 * preferência válida — volume clampado a 0..1, estação desconhecida volta ao
 * padrão, ligado exige boolean. Fonte única do que é uma preferência válida. */
export function normalizarRadio(v: unknown): PreferenciaRadio {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return { ...RADIO_PADRAO };
  const p = v as Partial<PreferenciaRadio>;
  const volume =
    typeof p.volume === "number" && Number.isFinite(p.volume)
      ? Math.min(1, Math.max(0, p.volume))
      : RADIO_PADRAO.volume;
  return {
    ligado: p.ligado === true,
    volume,
    estacao: ESTACOES.some((e) => e.id === p.estacao)
      ? (p.estacao as string)
      : RADIO_PADRAO.estacao,
  };
}

function loadRadio(): PreferenciaRadio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return normalizarRadio(JSON.parse(raw));
  } catch {
    /* localStorage indisponível ou JSON inválido: rádio só vale para a sessão */
  }
  return { ...RADIO_PADRAO };
}

function saveRadio(r: PreferenciaRadio): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {
    /* localStorage indisponível: rádio só vale para a sessão */
  }
}

const [radio, setRadio] = createSignal<PreferenciaRadio>(loadRadio());

const updateRadio = (fn: (r: PreferenciaRadio) => PreferenciaRadio): void => {
  setRadio((prev) => {
    const next = fn(prev);
    saveRadio(next);
    return next;
  });
};

export const radioAtual = (): PreferenciaRadio => radio();

const estacaoPorId = (id: string): EstacaoRadio | undefined => ESTACOES.find((e) => e.id === id);

/** URL da tentativa n da estação (0 = primária); undefined quando acabaram os espelhos. */
export function streamDaEstacao(id: string, tentativa: number): string | undefined {
  return estacaoPorId(id)?.streams[tentativa];
}

export const ligarRadio = (): void => updateRadio((r) => ({ ...r, ligado: true }));

export const desligarRadio = (): void => updateRadio((r) => ({ ...r, ligado: false }));

export const ajustarVolume = (volume: number): void =>
  updateRadio((r) => ({ ...r, volume: Math.min(1, Math.max(0, volume)) }));

/**
 * A posição do slider vira ganho por curva de potência, não linear: percepção
 * de sonoridade é comprimida no logaritmo do ouvido, e ganho linear faz a
 * metade de baixo da barra parecer fraca. O expoente é escolhido para
 * atender ao desejado: 50% no slider = 80% de ganho (0.5^k = 0.8, com
 * k = ln(0.8)/ln(0.5) ≈ 0.322 — perto do expoente da Lei de Stevens para
 * sonoridade, ~0.3). As pontas ficam intactas: 0 → 0, 1 → 1.
 */
export const GANHO_EXPOENTE = Math.log(0.8) / Math.log(0.5);

export function volumeParaGanho(volume: number): number {
  const c = Math.min(1, Math.max(0, volume));
  return Math.pow(c, GANHO_EXPOENTE);
}

export const escolherEstacao = (estacao: string): void =>
  updateRadio((r) => ({ ...r, estacao }));
