# low-level-cpu-simulator

Simulador didático de um computador von Neumann de 8 bits — a **MOS-6508** — com barramentos,
memória primária e secundária e um assembler próprio. Inspirado na série "Como Computadores
Funcionam?" do Fabio Akita ([episódio 80](https://www.youtube.com/watch?v=8G80nuEyDN4)).

O plano completo está em [PLAN.md](PLAN.md); a tabela de opcodes congelada, em
[docs/ISA.md](docs/ISA.md); o guia do assembler, em [docs/asm.md](docs/asm.md); a
arquitetura do software, em [ARCHITECTURE.md](ARCHITECTURE.md); regras para agentes de
código, em [AGENTS.md](AGENTS.md).

**Status**: M1 a M4 concluídos — núcleo (barramentos, RAM, CPU microprogramada, boot por
vetor de reset), assembler com CLI, dashboard no navegador (Vite + SolidJS) e memória
secundária: disco em setores com controlador em $F000 e terminal em $E800, com boot pelo
setor 0 (o loader do disco carrega e dispara o programa).

## Dashboard no navegador

```
npm run dev        # desenvolvimento, com recarga
npm run build:web  # build de produção em dist/
npm run preview    # serve o build localmente
```

Painéis: controles (Reset, Passo de 1 clock, Passo de 1 instrução, Run/Pause com
velocidade ajustável e Boot do disco), registradores em hex/binário, hex dump da memória
com regiões coloridas e célula do último acesso acesa, monitor de barramentos com
histórico, terminal de saída ($E800) e listing do programa com o PC apontando a linha
corrente (clique numa linha para marcar breakpoint). O painel "fonte" deixa escrever e
editar o próprio programa, com montagem na hora (Ctrl+Enter) e download do `.asm`. A aba
"referência" traz o de-para completo de opcodes em hexa (gerado da tabela congelada), o
mapa de memória, os modos de endereçamento e a explicação de cada exemplo. Carrega
`.asm` (montado no próprio navegador), `.bin` e `.disk`; o exemplo `hello-disk` grava o
loader no setor 0 e o programa "Ola, MOS-6508!" no setor 1, bootando pelo disco.

### GitHub Pages

O workflow `.github/workflows/deploy.yml` publica a cada push na `main`: roda os testes, o
typecheck, o `vite build` e publica `dist/` com `actions/deploy-pages`. **Já está ativo:**
<https://victorhugobatista.github.io/low-level-cpu-simulator/> (Pages com origem
"GitHub Actions"; o `base` do Vite aponta para o subcaminho `/low-level-cpu-simulator/`).

## CLI

```
npm run build
node dist-cli/cli/lcs.js assemble examples/soma.asm            # gera soma.bin + soma.lst
node dist-cli/cli/lcs.js mkdisk hello.disk hello.bin --lba 1   # empacota um .disk
node dist-cli/cli/lcs.js run boot.bin --disk hello.disk        # roda com disco montado
node dist-cli/cli/lcs.js run --disk bootavel.disk              # boota do setor 0
node dist-cli/cli/lcs.js run examples/soma.bin --trace         # loga cada transferência
node dist-cli/cli/lcs.js run examples/soma.bin --step          # um clock por Enter
```

O formato do `.disk` e os registradores do controlador estão em
[docs/disk-format.md](docs/disk-format.md).

Requisito: Node 18 ou mais recente. O núcleo (`src/` exceto `cli/` e `web/`) é isomórfico:
não usa API de Node, então o mesmo código roda no terminal e no navegador.
