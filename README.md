# low-level-cpu-simulator

Simulador didático de um computador von Neumann de 8 bits — a **AK-8** — com barramentos,
memória primária e secundária e um assembler próprio. Inspirado na série "Como Computadores
Funcionam?" do Fabio Akita ([episódio 80](https://www.youtube.com/watch?v=8G80nuEyDN4)).

O plano completo está em [PLAN.md](PLAN.md); a tabela de opcodes congelada, em
[docs/ISA.md](docs/ISA.md).

**Status**: M1 concluído — barramentos, RAM, CPU com as 8 instruções do marco e a prova da
soma (2+3) rodando direto e clock a clock.

## Comandos

```
npm install
npm test            # roda os testes (vitest)
npm run typecheck   # tsc --noEmit
```

Requisito: Node 18 ou mais recente. O núcleo (`src/` exceto `cli/` e `web/`) é isomórfico:
não usa API de Node, para rodar igual no navegador quando o dashboard (M3) existir.
