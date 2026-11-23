# low-level-cpu-simulator

Simulador didático de um computador von Neumann de 8 bits — a **AK-8** — com barramentos,
memória primária e secundária e um assembler próprio. Inspirado na série "Como Computadores
Funcionam?" do Fabio Akita ([episódio 80](https://www.youtube.com/watch?v=8G80nuEyDN4)).

O plano completo está em [PLAN.md](PLAN.md); a tabela de opcodes congelada, em
[docs/ISA.md](docs/ISA.md); o guia do assembler, em [docs/asm.md](docs/asm.md).

**Status**: M1 e M2 concluídos — núcleo (barramentos, RAM, CPU microprogramada, boot por
vetor de reset) e assembler com CLI. A prova da soma: `examples/soma.asm` monta exatamente
os bytes que o núcleo executa nos testes.

## Comandos

```
npm install
npm test            # testes (vitest)
npm run typecheck   # tsc --noEmit
npm run build       # emite o CLI em dist/
```

## CLI

```
npm run build
node dist/cli/lcs.js assemble examples/soma.asm      # gera soma.bin + soma.lst
node dist/cli/lcs.js run examples/soma.bin --trace   # roda, logando cada transferência
node dist/cli/lcs.js run examples/soma.bin --step    # um clock por Enter
```

Requisito: Node 18 ou mais recente. O núcleo (`src/` exceto `cli/` e o futuro `web/`) é
isomórfico: não usa API de Node, para rodar igual no navegador quando o dashboard (M3)
existir.
