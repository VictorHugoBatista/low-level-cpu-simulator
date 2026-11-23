# Arquitetura — Simulador AK-8

Este documento descreve a arquitetura **real do software implementado** (marcos M1–M4 +
dashboard), as regras de dependência que seguram o projeto e os contratos congelados.
O porquê didático e o plano de marcos estão em [PLAN.md](PLAN.md).

## Visão geral

O projeto é um simulador didático de um computador von Neumann de 8 bits (a "AK-8"), com
três camadas que compartilham o mesmo núcleo:

| Camada | Onde | O que é |
|---|---|---|
| Núcleo | `src/core`, `src/bus`, `src/cpu`, `src/memory`, `src/storage`, `src/runtime` | A máquina: barramentos, CPU microprogramada, memória, dispositivos. **Isomórfico** — não importa Node nem DOM. |
| Assembler | `src/asm` | Fonte `.asm` → bytes + listing. Também isomórfico. |
| Interfaces | `src/cli`, `src/web` | CLI em Node (`lcs`) e dashboard no navegador (SolidJS + Vite). Únicos lugares com APIs de plataforma. |

A regra que organiza tudo: **cada componente do núcleo só conhece os barramentos, nunca
outro componente**. A ULA não sabe que a RAM existe; o controlador de disco não sabe que a
CPU existe. Essa restrição é o que impede o código de virar um monólito disfarçado de
simulador.

## O modelo da máquina

### Fluxo de execução (um tick)

```
        UI (CLI ou navegador)
              │  tick() / run()
              ▼
   ┌─────────────────────┐
   │        Clock        │  conta ciclos
   └──────────┬──────────┘
              │ Machine.tick(): 1 clock = 1 micro-operação
              ▼
   ┌─────────────────────┐
   │        Cpu          │  registradores (A X Y SP PC P)
   │                     │  internos: IR MAR MDR TMP T
   │  T0: fetch opcode   │  ← microprograma: uma micro-op por clock
   │  T1..: micro-ops    │
   └──────────┬──────────┘
              │ readByte / writeByte
              ▼
   ┌─────────────────────┐
   │      SystemBus      │  endereços 16 bits · dados 8 bits · sinais READ/WRITE
   │  + log de TODAS as  │  ← matéria-prima do tracer e do monitor da UI
   │    transferências   │
   └──────────┬──────────┘
              │ roteamento por faixa de endereço (última região mapeada vence)
              ▼
   ┌────────┬──────────┬──────────────────┐
   ▼        ▼          ▼                  ▼
   Ram      Terminal   DiskController     (região sem dispositivo
  64 KiB    $E800      $F000              = erro, nunca silêncio)
```

Pontos fixos do modelo:

- **Uma micro-operação por clock.** T0 de toda instrução é o fetch do opcode
  (`MAR←PC; MDR←M[PC]; PC++; IR←MDR`); o resto vem do microprograma da instrução.
  Instruções diferentes custam números diferentes de ciclos, como numa CPU real.
- **Toda transferência passa pelo barramento e fica registrada** com ciclo, endereço,
  dado e sinal. O histórico tem teto (`historyLimit`, 8192 + folga) para sessões longas
  no navegador não vazarem memória.
- **Boot por vetor de reset.** A máquina nunca "recebe um PC de presente": `reset()` lê
  $FFFC/FD pelo barramento. `loadProgram` grava o programa e aponta o vetor para ele;
  `bootFromDisk` faz o papel de BIOS (setor 0 → $0200, vetor, reset).
- **Erro é erro.** Opcode inválido, instrução congelada não implementada, acesso a
  endereço sem dispositivo, setor inexistente, desvio fora de alcance — tudo lança erro
  claro, nunca NOP silencioso.

### Mapa de memória

| Faixa | Uso |
|---|---|
| $0000–$00FF | página zero |
| $0100–$01FF | stack |
| $0200–$DFFF | RAM do usuário |
| $E800–$E8FF | terminal (escrever byte = imprime caractere) |
| $F000–$F0FF | controlador de disco |
| $FF00–$FFFF | RAM do topo (vetores de reset $FFFC/FD e interrupção $FFFE/FF) |

## Módulos do núcleo

| Módulo | Responsabilidade | Pontos-chave |
|---|---|---|
| `core/bytes.ts` | `Byte`/`Word`, máscaras, complemento de dois, helpers hex | sem estado |
| `core/clock.ts` | contador de ciclos | sem estado |
| `core/constants.ts` | mapa de memória (stack, terminal, disco, vetores) | fonte única dos endereços |
| `bus/bus.ts` | `SystemBus` + `BusDevice` + `BusTransaction` | registra tudo; `setCycleProvider` liga o log ao clock |
| `memory/ram.ts` | memória primária (Uint8Array) | acesso em 1 ciclo; `load` para programas e setores |
| `memory/memoryMap.ts` | roteia endereço → dispositivo | sobreposição: última região mapeada vence (é assim que o disco/terminal convivem com a RAM) |
| `memory/terminal.ts` | E/S memory-mapped $E800 | buffer de caracteres com teto |
| `memory/diskController.ts` | I/O programado por bloco em $F000 | `CMD`/`LBA`/`ADDR_LO`/`ADDR_HI`; cada byte copiado passa pelo barramento; guard de reentrância (endereço apontando para o próprio controlador) |
| `storage/diskImage.ts` | imagem `.disk` bruta em setores de 256 B | flag `dirty` (o CLI salva de volta); `fromBytes` completa o último setor |
| `cpu/registers.ts` | registradores + flags como accessors | internos (`IR`/`MAR`/`MDR`/`TMP`/`T`) são o que torna o fetch visível |
| `cpu/alu.ts` | operações puras com flags (C, V corretos) | não conhece memória nem barramento |
| `cpu/opcodes.ts` | **a tabela de opcodes congelada em código** | fonte única: CPU, assembler e a página de referência derivam dela |
| `cpu/microops.ts` | micro-operações + `MICROPROGRAMS` (por opcode implementado) | micro-ops são closures sem estado próprio — todo estado vive nos registradores |
| `cpu/decoder.ts` | `microprogramFor(opcode)` | erro claro para opcode inválido ou congelado-não-implementado |
| `cpu/cpu.ts` | o sequenciador | `tick()` executa exatamente uma micro-op; `reset(bus)` lê o vetor |
| `runtime/machine.ts` | a fiação de tudo | único lugar que conhece RAM + dispositivos + CPU juntos; API: `tick`, `run`, `reset`, `loadProgram`, `bootFromDisk`, `insertDisk` |

### Como adicionar uma instrução (o caminho do M5)

1. Ela já está congelada em `docs/ISA.md` (contrato) e espelhada em `src/cpu/opcodes.ts`.
2. Escrever o microprograma em `src/cpu/microops.ts` (`MICROPROGRAMS[opcode]`), composto
   pelas micro-op factories — operandos sempre via barramento, write-back sempre tick
   separado.
3. Teste em `tests/` (golden bytes do assembler + execução com flags).
4. A página de referência apaga a célula sozinha (ela detecta microprograma existente).

## Assembler

Pipeline: `lexer → parser → pass1 → pass2 → { origin, bytes, listing, entries }`.

| Etapa | O que faz | Regras que valem contrato |
|---|---|---|
| `lexer.ts` | tokens por linha física | comentários `;`; números dec/hex `$`/bin `%`/caractere `'A'`; strings com escapes |
| `parser.ts` | linhas → `Statement` (rótulo, mnemônico, diretiva, argumento) | gramática de operandos: `#term`, `(term),Y`, `term,X`, `term` |
| `pass1.ts` | endereça, mede, define símbolos, **escolhe o modo** | literais/constantes `.equ` ≤ $FF → zero page; rótulos → absoluto (ou relativo em desvios); `.org` move o PC; `.db`/`.dw`/`.ascii` resolvem na hora (sem referência para frente) |
| `pass2.ts` | resolve símbolos (todas já definidas), emite bytes + listing | offset de desvio = alvo − (endereço + 2), com alcance −128..127; buracos de `.org` viram $00 |
| `emitter.ts` | buffer esparso → bloco contíguo + listing formatado | listing = endereço, bytes, fonte, tabela de símbolos |

Erros são **coletados e reportados todos de uma vez** no formato
`arquivo:linha:coluna: mensagem` (`AsmError`) — o assembler nunca para no primeiro.

Dois detalhes que preservam o contrato: o assembler **monta qualquer instrução congelada**
(mesmo as que o núcleo ainda não executa — o erro vem na hora de rodar), e o opcode nunca
é inventado: vem de `opcodeFor()` da tabela única.

## Interfaces

### CLI (`src/cli/lcs.ts`) — o único arquivo que importa `node:*`

- `lcs assemble arq.asm [-o out.bin] [--lst out.lst]` — monta + listing.
- `lcs mkdisk out.disk payload.bin [--lba N] [--setores N]` — empacota imagem.
- `lcs run [bin] [--disk x.disk] [--origin] [--trace] [--step] [--max]` — roda direto ou
  clock a clock; com `--disk` e sem `.bin`, boota do setor 0; disco alterado é gravado de
  volta; saída do terminal impressa no fim.

Build: `tsc -p tsconfig.build.json` → `dist-cli/` (exclui `src/web`).

### Web (`src/web/`) — SolidJS + Vite

- **`store.ts`** é a única ponte núcleo↔UI: envolve a `Machine` em signals. Nada da UI
  vaza para dentro do núcleo.
  - Loop de execução em `requestAnimationFrame` com orçamento de clocks por frame
    (velocidade 1 Hz…1 kHz; "Máximo" = 20.000 clocks/frame). Breakpoints são checados no
    loop contra o PC — o núcleo nem sabe que eles existem.
  - Passo de instrução = tick até `T` zerar de novo (o t do sequenciador).
  - `memVersion` (contador) invalida a vista de memória a cada sync — a RAM não é reativa,
    e é de propósito.
- **Painéis** (`components/`): `Controls` (arquivo, exemplos, transporte, boot, velocidade),
  `Editor` (fonte com numeração, Ctrl+Enter monta e carrega, download do `.asm`),
  `RegistersPanel`, `ProgramView` (listing estruturado + breakpoints por clique),
  `BusMonitor` (transferência corrente + histórico), `TerminalPanel`, `MemoryView`
  (hex dump **virtualizado** — só as linhas visíveis são lidas e renderizadas; regiões
  coloridas; célula do último acesso acesa), `ReferencePage` (crédito à aula do Akita,
  resumo da máquina, mapa, modos e o **de-para de opcodes gerado de `opcodeFor`** — a
  página não tem hexa escrito nela).
- Navegação por abas (máquina/referência) por estado — **single page, sem router**, o que
  dispensa qualquer truque de 404 no GitHub Pages.

## Contratos congelados (documentação normativa)

| Documento | Conteúdo |
|---|---|
| `docs/ISA.md` | tabela v1 de opcodes, custos em ciclos, flags, semântica (borrow, stack, vetores) |
| `docs/asm.md` | sintaxe do assembler, regras de escolha de modo, formato de erros |
| `docs/disk-format.md` | formato `.disk` e os registradores do controlador |

Mudar qualquer um deles exige revisão explícita no fim do arquivo.

## Build, testes e deploy

- **Typecheck**: `tsconfig.json` (NodeNext, DOM + JSX Solid, `noEmit`) cobre núcleo, CLI,
  web e testes. **Emissão**: `tsconfig.build.json` → `dist-cli/` sem `src/web`.
- **Testes** (vitest, `vitest.config.ts` próprio para não carregar o plugin Solid): 46
  testes em 7 arquivos — ULA, barramento/mapa, CPU (branches, JMP, erros), máquina (vetor,
  HLT idempotente, teto), assembler (golden bytes, integração, erros) e disco/E-S
  (terminal, controlador, **prova M4: boot → "Ola, AK-8!" no terminal em 111 ciclos**).
- **Deploy**: `.github/workflows/deploy.yml` — push na `main` roda testes + typecheck +
  `vite build` e publica `dist/` via `actions/deploy-pages`. `base` do Vite fixado no
  subcaminho `/low-level-cpu-simulator/`.

## Limites conhecidos (deliberados)

- Interrupções (IRQ, vetor $FFFE) desenhadas no mapa, ainda sem execução.
- LBA de 8 bits: discos de até 256 setores (64 KiB).
- Sem page-cross penalty nos modos indexados e sem DMA — escolhas didáticas documentadas.
- A UI não tem testes automatizados de DOM (o núcleo, sim); a verificação da UI é o build
  + uso manual.
