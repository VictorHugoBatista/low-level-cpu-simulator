import type { Store } from "../store.js";
import type { Theme, Layout, Crt } from "../app.js";
import {
  aplicarProgresso,
  coletarProgresso,
  nomeArquivoProgresso,
  parseProgresso,
  serializarProgresso,
} from "../progressoArquivo.js";

/**
 * A tela de opções, em duas seções:
 *
 * - **progresso** — salvar e carregar em arquivo (o que vivia na lateral dos
 *   exercícios: aqui é o lugar definitivo, junto do que governa).
 * - **aparência** — tema, layout e CRT, hoje também nos dropdowns do header e do
 *   rodapé; os dropdowns continuam lá e saem quando forem removidos de vez.
 */
export function OpcoesPage(props: {
  store: Store;
  theme: Theme;
  setTheme: (t: Theme) => void;
  layout: Layout;
  setLayout: (l: Layout) => void;
  crt: Crt;
  setCrt: (c: Crt) => void;
}) {
  let inputArquivo: HTMLInputElement | undefined;

  /** Baixa o progresso inteiro (níveis, rascunhos, dicas, marcas) como arquivo .json —
   * o mesmo caminho do download de .asm do editor. */
  const salvarProgresso = (): void => {
    const blob = new Blob([serializarProgresso(coletarProgresso())], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivoProgresso();
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /** Lê o arquivo escolhido, valida e restaura — substituindo o progresso corrente.
   * Erro (arquivo estranho, de outro app, de versão futura) vira aviso, não exceção. */
  const carregarProgresso = async (file: File): Promise<void> => {
    try {
      const p = parseProgresso(await file.text());
      aplicarProgresso(p, props.store);
      const quando = p.savedAt === "" ? "" : ` (salvo em ${p.savedAt.slice(0, 10)})`;
      props.store.report(`progresso restaurado de ${file.name}${quando}`);
    } catch (e) {
      props.store.report(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div class="opcoes">
      <section class="panel">
        <h2>progresso</h2>
        <p>
          Seu progresso — níveis concluídos, rascunhos dos programas, dicas reveladas e
          melhores rodadas — fica salvo neste navegador. Salve-o em arquivo para guardar
          ou levar para outra máquina; carregue o arquivo de volta para continuar de onde
          parou. Carregar substitui o progresso atual.
        </p>
        <div class="row">
          <button
            onClick={salvarProgresso}
            title="baixa um .json com níveis, rascunhos, dicas e marcas de ciclos"
          >
            Salvar progresso
          </button>
          <button
            onClick={() => inputArquivo?.click()}
            title="restaura o progresso de um .json salvo antes — substitui o atual"
          >
            Carregar progresso
          </button>
          <input
            type="file"
            accept=".json,application/json"
            hidden
            ref={inputArquivo}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file !== undefined) void carregarProgresso(file);
              e.currentTarget.value = ""; // escolher o mesmo arquivo de novo precisa reabrir o diálogo
            }}
          />
        </div>
      </section>

      <section class="panel">
        <h2>aparência</h2>
        <p class="hint">
          os mesmos controles do cabeçalho e do rodapé — de lá eles continuam até serem
          removidos.
        </p>
        <div class="opcoes-prefs">
          <label class="opcao">
            <span>tema</span>
            <select
              title="tema"
              value={props.theme}
              onChange={(e) => props.setTheme(e.currentTarget.value as Theme)}
            >
              <option value="dark">escuro</option>
              <option value="light">claro</option>
            </select>
          </label>
          <label class="opcao">
            <span>layout</span>
            <select
              title="layout"
              value={props.layout}
              onChange={(e) => props.setLayout(e.currentTarget.value as Layout)}
            >
              <option value="colunas">editor cheio</option>
              <option value="lateral">lateral</option>
            </select>
          </label>
          <label class="opcao">
            <span>crt</span>
            <select
              title="crt"
              value={props.crt}
              onChange={(e) => props.setCrt(e.currentTarget.value as Crt)}
            >
              <option value="on">crt ligado</option>
              <option value="off">crt desligado</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
