# AGENTS.md

Guia para agentes de código (e para humanos com pressa) trabalhando neste repositório.
Contexto completo: [ARCHITECTURE.md](ARCHITECTURE.md) · plano de marcos: [PLAN.md](PLAN.md) ·
contratos congelados: [docs/ISA.md](docs/ISA.md), [docs/asm.md](docs/asm.md),
[docs/disk-format.md](docs/disk-format.md).

## Regra de ouro: nada direto na `main`

**Nunca faça commit ou push direto na `main`.** O fluxo é sempre:

1. Crie branch a partir da `main` atualizada (`git checkout main && git pull && git checkout -b <nome>`).
2. Faça as alterações na branch, com testes passando localmente.
3. Commit com mensagem convencional (`feat:`, `fix:`, `docs:`, `chore:` + descrição curta).
4. `git push -u origin <nome>`.
5. Abra o PR com `gh pr create` — título no formato do commit e corpo dizendo **o quê**
   mudou e **por quê**.
6. Espere o CI do PR ficar verde (testes + typecheck + build).
7. **O merge é do dono do projeto** — o agente não mescla por conta própria, a menos que o
   pedido seja explícito ("abre o PR e faz o merge").

Nome de branch: `<tipo>/<assunto>` em kebab-case — `feat/microops-stx`, `fix/listing-pad`,
`docs/agents-md`. Uma branch, um assunto; não empilhe marcos inteiros numa branch só.

A `main` precisa estar sempre deployável: o workflow de deploy publica o site no Pages a
cada push nela, depois de rodar testes e typecheck. **A regra é aplicada por proteção de
branch**: a `main` exige o check `checks` do CI (neste PR mesmo) e rejeita push direto —
inclusive do dono do projeto.

## Setup e comandos

```
npm install          # Node 18+
npm test             # vitest (199 testes no momento)
npm run typecheck    # tsc --noEmit
npm run build        # CLI → dist-cli/
npm run build:web    # site → dist/ (Vite)
npm run dev          # dev server do dashboard em /low-level-cpu-simulator/
```

Antes de commitar: `npm test` e `npm run typecheck` passando. Os dois, sempre.

## Regras de arquitetura (resumo — detalhes em ARCHITECTURE.md)

1. **Núcleo isomórfico**: `src/core`, `src/bus`, `src/cpu`, `src/memory`, `src/storage`,
   `src/runtime` e `src/asm` **não importam** `node:*`, DOM nem Solid. APIs de plataforma
   só em `src/cli` e `src/web`.
2. **Componentes só falam com barramentos.** A ULA não conhece a RAM; o controlador de
   disco não conhece a CPU; o `runtime/` (Machine) é quem fia tudo junto.
3. **Tabela de opcodes tem fonte única**: `src/cpu/opcodes.ts` espelha `docs/ISA.md`.
   Assembler e CPU derivam dela; a página de referência gera os hexas de `opcodeFor` —
   nunca escreva hexa de opcode em outro lugar.
4. **Erro é erro**: opcode inválido, setor inexistente, endereço sem dispositivo, desvio
   fora de alcance — sempre erro claro, nunca NOP silencioso.
5. **Uma micro-operação por clock**; T0 é sempre o fetch do opcode; write-back é tick
   separado.
6. **Simulador didático**: quando dois caminhos são possíveis, escolha o que torna o
   funcionamento visível (trace, painéis) sobre o que é mais rápido ou sofisticado.

## Estilo de código

- TypeScript `strict`, ESM; **imports relativos sempre com extensão `.js`** (NodeNext).
- Sem novas dependências de runtime sem justificativa no PR (hoje: `solid-js` só).
- UI em SolidJS com reatividade fine-grained; memória virtualizada; sem router.
- Prosa de docs, comentários e mensagens em **português do Brasil**; termos técnicos
  canônicos em inglês (fetch, bus, stack, breakpoint, carry).
- Testes obrigatórios para qualquer mudança de comportamento — inclusive para bugs: o
  teste que reproduz o bug entra junto com o conserto.

## Coisas para NUNCA fazer

- Commit ou push direto na `main`.
- Force push em qualquer branch compartilhada.
- Mudar a ISA congelada (`docs/ISA.md` / `opcodes.ts`) sem nota de revisão e sem atualizar
  assembler, CPU e página de referência no mesmo PR.
- Desabilitar ou furar o CI para passar.
- Substituir o histórico do barramento, os erros explícitos ou o isomorfismo do núcleo por
  atalhos de conveniência.
