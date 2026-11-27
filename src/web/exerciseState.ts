import { createSignal } from "solid-js";
import { AsmError, assemble } from "../asm/assembler.js";
import { runExerciseCases } from "../runtime/exercise.js";
import type { CaseResult } from "../runtime/exercise.js";
import { TRACKS } from "./exerciseCatalog.js";
import type { ExerciseDef, TrackDef } from "./exerciseCatalog.js";
import { atualizarMelhor } from "./marcador.js";
import type { Store } from "./store.js";

/**
 * Estado de exercício compartilhado entre as abas "máquina" e "exercícios": qual nível
 * está aberto, qual caso de teste tem as entradas gravadas na máquina visível, o último
 * resultado da verificação e o progresso (níveis, rascunhos, dicas). As duas abas leem
 * e escrevem por aqui, então a pessoa pode desenvolver na aba máquina — com os painéis
 * da máquina à vista — e submeter de lá mesmo.
 *
 * Progresso e exercício ativo ficam em localStorage, no mesmo padrão do tema e do layout.
 */

export type LevelStatus = "full" | "help";

export interface ExerciseProgress {
  solved: Record<string, LevelStatus>;
  drafts: Record<string, string>;
  hints: Record<string, number>;
  /** Último exercício aberto: recarregar a página restaura o contexto na máquina. */
  last?: string;
}

const STORAGE_KEY = "ak8-exercises";

/** Shape guard: qualquer valor (JSON de localStorage ou de arquivo importado) vira um
 * progresso válido, campo a campo — dado adulterado ou de versão futura volta ao
 * default em vez de derrubar a página. Fonte única do que é um progresso válido. */
export function normalizarProgresso(v: unknown): ExerciseProgress {
  const p = (typeof v === "object" && v !== null && !Array.isArray(v) ? v : {}) as Partial<ExerciseProgress>;
  const recFiltrado = (x: unknown, valorValido: (val: unknown) => boolean): Record<string, unknown> => {
    const bruto =
      typeof x === "object" && x !== null && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
    const limpo: Record<string, unknown> = {};
    for (const [chave, val] of Object.entries(bruto)) {
      if (valorValido(val)) limpo[chave] = val;
    }
    return limpo;
  };
  return {
    solved: recFiltrado(p.solved, (val) => val === "full" || val === "help") as ExerciseProgress["solved"],
    drafts: recFiltrado(p.drafts, (val) => typeof val === "string") as ExerciseProgress["drafts"],
    hints: recFiltrado(
      p.hints,
      (val) => typeof val === "number" && Number.isFinite(val) && val >= 0,
    ) as ExerciseProgress["hints"],
    last: typeof p.last === "string" ? p.last : undefined,
  };
}

function loadProgress(): ExerciseProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return normalizarProgresso(JSON.parse(raw));
  } catch {
    /* localStorage indisponível ou JSON inválido: progresso só vale para a sessão */
  }
  return { solved: {}, drafts: {}, hints: {} };
}

function saveProgress(p: ExerciseProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* localStorage indisponível: progresso só vale para a sessão */
  }
}

const [progress, setProgress] = createSignal<ExerciseProgress>(loadProgress());

const updateProgress = (fn: (p: ExerciseProgress) => ExerciseProgress): void => {
  setProgress((prev) => {
    const next = fn(prev);
    saveProgress(next);
    return next;
  });
};

/** Substitui o progresso inteiro (restaurar de arquivo importado): troca o sinal e
 * grava no localStorage. Quem chama valida antes — aqui não há guarda. */
export function restaurarProgresso(p: ExerciseProgress): void {
  updateProgress(() => p);
}

/** O exercício aberto agora (em qualquer aba) — null quando nenhum. */
const [activeId, setActiveId] = createSignal<string | null>(null);

/** A solução de referência do nível aberto: oculta por padrão, e trocar de nível
 * esconde de novo — revelar é uma decisão da pessoa, feita no botão do painel. */
const [solucaoVisivel, setSolucaoVisivel] = createSignal(false);

export const alternarSolucao = (): void => {
  setSolucaoVisivel((v) => !v);
};

/** Índice do caso de teste cujas entradas estão gravadas na máquina visível. */
const [caseIndex, setCaseIndex] = createSignal(0);

/** Resultado da última verificação, e de qual exercício ela foi. */
const [results, setResults] = createSignal<CaseResult[] | null>(null);
const [verifiedId, setVerifiedId] = createSignal<string | null>(null);
const [celebrate, setCelebrate] = createSignal<string | null>(null);

/** A trilha aberta na aba exercícios; abrir um exercício a alinha com a trilha dele. */
const [trackId, setTrackId] = createSignal(TRACKS[0]?.id);

export const activeTrack = (): TrackDef => TRACKS.find((t) => t.id === trackId()) ?? (TRACKS[0] as TrackDef);

const findExercise = (id: string): ExerciseDef | undefined =>
  TRACKS.flatMap((t) => t.exercises).find((d) => d.id === id);

export const activeExercise = (): ExerciseDef | undefined => {
  const id = activeId();
  return id === null ? undefined : findExercise(id);
};

const isSolved = (def: ExerciseDef): boolean => progress().solved[def.id] !== undefined;

/** Abre um exercício: restaura rascunho (ou template) no editor e na máquina e grava
 * as entradas do primeiro caso na RAM, prontas para rodar e inspecionar nos painéis. */
export const openExercise = (def: ExerciseDef, s: Store): void => {
  setActiveId(def.id);
  setSolucaoVisivel(false); // abrir outro nível esconde a solução que estivesse revelada
  const track = TRACKS.find((t) => t.exercises.includes(def));
  if (track === undefined) throw new Error(`exercício ${def.id} não pertence a nenhuma trilha`);
  setTrackId(track.id);
  setCaseIndex(0);
  setResults(null);
  setVerifiedId(null);
  setCelebrate(null);
  const draft = progress().drafts[def.id];
  s.loadAsm(draft ?? def.template, `${def.id}.asm`);
  const first = def.cases[0];
  if (first !== undefined) s.applyPresets(first);
  updateProgress((p) => ({ ...p, last: def.id }));
};

/** Troca de nível pela lista: preserva o rascunho do nível que está saindo. */
export const selectExercise = (def: ExerciseDef, s: Store): void => {
  saveDraftActive(s);
  openExercise(def, s);
};

/** Troca de trilha: abre o primeiro nível ainda não resolvido dela (ou o primeiro). */
export const selectTrack = (track: TrackDef, s: Store): void => {
  saveDraftActive(s);
  const first = track.exercises.find((d) => !isSolved(d)) ?? track.exercises[0];
  if (first !== undefined) openExercise(first, s);
};

/** Salva o fonte corrente como rascunho do exercício ativo (blur do editor, submit,
 * troca de nível). Só grava fonte DIGITADO: exemplos, .bin e "Novo" entram no editor
 * sem passar pela digitação, e o rascunho do aluno não pode ser sobrescrito por eles —
 * é o que garante que clicar no nível na lista reabra o trabalho salvo. */
export const saveDraftActive = (s: Store): void => {
  const def = activeExercise();
  if (def === undefined) return;
  if (!s.sourceDirty()) return;
  updateProgress((p) => ({ ...p, drafts: { ...p.drafts, [def.id]: s.source() } }));
};

/** Grava as entradas de um caso na máquina visível — a pessoa roda à mão e acompanha
 * nos painéis de registradores, memória, barramento e terminal. */
export const applyActiveCase = (s: Store, index: number): void => {
  const def = activeExercise();
  const testCase = def?.cases[index];
  if (testCase === undefined) return;
  setCaseIndex(index);
  s.applyPresets(testCase);
};

/** Submete o fonte corrente: monta e roda todos os casos numa máquina fresca cada,
 * confere os destinos e marca o nível quando tudo passa. Compartilhado pelas duas abas. */
export const verifyActive = (s: Store): CaseResult[] | null => {
  const def = activeExercise();
  if (def === undefined) return null;
  setCelebrate(null);
  let program;
  try {
    const r = assemble(s.source(), `${def.id}.asm`);
    program = { origin: r.origin, bytes: r.bytes };
  } catch (e) {
    s.report(e instanceof AsmError ? e.message : String(e));
    setResults(null);
    return null;
  }
  s.report(null);
  saveDraftActive(s);
  const out = runExerciseCases(program, def.cases);
  setResults(out);
  setVerifiedId(def.id);
  const allPassed = out.every((r) => r.passed);
  if (allPassed) {
    // Card de melhor performance: os ciclos de cada caso somam no total que decide a
    // melhor rodada, e o card guarda também o detalhe por caso.
    const casos = out.map((r) => ({ name: r.name, ciclos: r.cycles }));
    atualizarMelhor(def.id, casos);
    if (!isSolved(def)) {
      updateProgress((p) => ({ ...p, solved: { ...p.solved, [def.id]: "full" } }));
      setCelebrate("Nível concluído! O próximo desbloqueou — continue a sequência.");
    } else {
      setCelebrate("Ainda passando — pode revisar ou seguir adiante.");
    }
  }
  return out;
};

/** Recarrega a página com o último exercício aberto: o contexto volta inteiro —
 * rascunho no editor e entradas do primeiro caso gravadas na máquina. */
export const restoreLast = (s: Store): void => {
  const id = progress().last;
  const def = id === undefined ? undefined : findExercise(id);
  if (def !== undefined) openExercise(def, s);
};

/** Fecha o contexto do exercício ativo sem tocar no progresso: nenhum nível aberto,
 * resultado de verificação e celebração limpos. Usado ao restaurar um progresso que
 * não aponta para exercício conhecido — nada do contexto velho sobrevive à troca
 * (o rascunho em edição, por exemplo, não vira rascunho do nível novo por engano:
 * saveDraftActive só grava com exercício ativo). Ao visitar a aba exercícios, o
 * próximo nível não resolvido abre sozinho a partir do progresso restaurado. */
export function fecharContexto(): void {
  setActiveId(null);
  setSolucaoVisivel(false);
  setCaseIndex(0);
  setResults(null);
  setVerifiedId(null);
  setCelebrate(null);
}

/** Depois de todas as dicas: ver a solução avança o nível, marcado como "com ajuda". */
export const solveWithHelp = (def: ExerciseDef): void => {
  updateProgress((p) => ({ ...p, solved: { ...p.solved, [def.id]: "help" } }));
  setCelebrate("Nível concluído com a solução de referência. Estude-a e siga adiante!");
};

export { progress, updateProgress, caseIndex, results, verifiedId, celebrate, solucaoVisivel };
