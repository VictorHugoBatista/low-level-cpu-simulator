# Plano — Simulador de CPU em baixo nível

Referência: a playlist "Como Computadores Funcionam?" do Fabio Akita, em especial o vídeo
"[Akitando] #80 — O Guia +Hardcore de Introdução à COMPUTAÇÃO"
(<https://www.youtube.com/watch?v=8G80nuEyDN4>). A série constrói a computação de baixo para
cima: transistor, porta lógica, flip-flop, registrador, ULA, barramentos, memória, ciclo de
busca e execução e, por fim, assembly. O simulador reproduz esse percurso em software: cada
peça que o Akita desenha no quadro vira um componente separado aqui, e o objetivo didático é
poder enxergar cada byte trafegando por cada barramento a cada ciclo de clock.

> **Status**: passos 1 e 2 concluídos — ISA congelada, núcleo M1 e assembler M2 com o CLI
> (`lcs assemble` / `lcs run`); a prova da soma monta exatamente os bytes que o M1 executa.
> Próximo: M3, o dashboard no navegador.

## A máquina-alvo: AK-8

Um computador von Neumann de 8 bits, com espírito 6502 (a CPU do NES, que o Akita usa no
episódio 81), mas com um conjunto de instruções próprio, enxuto (~30 instruções), para que
cada camada caiba na cabeça e no código. Nada aqui é invisível: não existe operação sem um
barramento carregando o byte correspondente.

| Peça | Definição |
|---|---|
| Barramento de endereços | 16 bits → 64 KiB de espaço linear |
| Barramento de dados | 8 bits |
| Barramento de controle | sinais `READ`, `WRITE`, `CLK`, `RESET`, `HALT` (e `IRQ` na fase de interrupções) |
| CPU | registradores + ULA + unidade de controle com sequenciador de micro-operações |
| Memória primária | RAM de 64 KiB, acesso em 1 ciclo |
| Memória secundária | imagem de disco em setores de 256 B, acessada por um controlador de I/O mapeado em memória |
| E/S | terminal memory-mapped (escrever um byte imprime o caractere) |
| Interface | dashboard no navegador com o estado da memória e dos registradores sempre visível, e execução direta ou clock a clock |

### Registradores

Visíveis ao programador: `A`, `X`, `Y` (8 bits), `SP` (stack, 8 bits, stack na página
0x0100), `PC` (16 bits) e `P` de flags (`Z` zero, `N` negativo, `C` carry, `V` overflow).
Internos, para o ciclo de máquina: `IR` (instrução), `MAR` (endereço), `MDR` (dado) e `T`
(passo do sequenciador). Os registradores internos são o que torna o fetch visível: dá para
assistir `PC` → barramento de endereços → `MAR`, e memória → barramento de dados → `MDR` →
`IR`.

### Ciclo de máquina

Cada instrução é uma lista de micro-operações. O sequenciador executa uma micro-operação por
ciclo de clock, e toda micro-operação que move um dado declara por qual barramento ele passa.
Exemplo de `LDA $2000`: T0–T1 fetch do opcode, T2 decode, T3 fetch do byte baixo do
endereço, T4 fetch do byte alto, T5 leitura da RAM em $2000 pelo barramento de dados, T6
carga em `A` e flags. Instruções diferentes gastam números diferentes de ciclos, como numa
CPU real.

### ULA

`ADD`, `SUB`, `AND`, `ORA`, `XOR`, `NOT`, `SHL`, `SHR`, `CMP`, `INC`, `DEC`, sempre
atualizando `Z`, `N`, `C` e `V`. A ULA não fala com a memória: quem coloca e tira operandos
dos barramentos é o sequenciador, igual ao desenho do vídeo.

### Mapa de memória

| Faixa | Uso |
|---|---|
| 0x0000–0x00FF | página zero (endereçamento curto) |
| 0x0100–0x01FF | stack |
| 0x0200–0xDFFF | RAM do usuário (programa e dados) |
| 0xE800–0xE8FF | terminal de saída |
| 0xF000–0xF0FF | controlador de disco |
| 0xFFFC–0xFFFF | vetores de reset (`FFFC/FD`) e de interrupção (`FFFE/FF`) |

O vetor de reset copia o espírito do 6502: ligar a máquina não "roda o arquivo", ela lê o
vetor e desvia, e quem prepara esse vetor é o boot.

### Memória secundária: disco e boot

O disco é um arquivo `.disk` de N setores de 256 B (formato bruto, setor 0 primeiro). O
controlador expõe quatro registradores em 0xF000:

| Endereço | Registrador | Função |
|---|---|---|
| 0xF000 | `CMD` | 0 ocioso, 1 ler setor, 2 gravar setor |
| 0xF001 | `LBA` | número do setor |
| 0xF002 | `ADDR_LO` | byte baixo do endereço na RAM |
| 0xF003 | `ADDR_HI` | byte alto do endereço na RAM |

Escrever 1 em `CMD` copia o setor inteiro para a RAM (I/O programado por bloco, sem DMA —
DMA fica como extensão futura). O fluxo clássico: uma rotina de boot em assembly, gravada no
setor 0, lê os setores do programa do disco para a RAM, escreve o vetor de reset em 0xFFFC e
dispara. É o mesmo papel que o bootloader cumpre num PC real, e é a ponte didática entre as
duas memórias.

### Conjunto de instruções (rascunho)

| Grupo | Instruções |
|---|---|
| Carga/armazenamento | `LDA`, `LDX`, `LDY`, `STA`, `STX`, `STY`, `TAX`, `TXA`, `TAY`, `TYA` |
| Aritmética e lógica | `ADD`, `SUB`, `AND`, `ORA`, `XOR`, `NOT`, `SHL`, `SHR`, `CMP`, `INC`, `DEC` |
| Stack | `PHA`, `PLA`, `JSR`, `RTS` |
| Desvio | `JMP`, `JZ`, `JNZ`, `JC`, `JNC`, `JN` |
| Sistema | `NOP`, `HLT` |

Modos de endereçamento: imediato (`#$nn`), absoluto (`$hhhh`), página zero (`$nn`),
indexado (`$nn,X` / `$hhhh,X`), indireto pós-indexado (`($nn),Y`) e relativo (labels). A
tabela definitiva de opcodes vive num único arquivo (`docs/ISA.md` + tabela no código), para
nunca divergir do assembler.

## Assembler

Programa em assembly é cidadão de primeira classe: o simulador lê `.asm`, monta para binário
e executa o binário — nunca interpreta o texto direto, para respeitar a fronteira entre
montador e máquina que o vídeo enfatiza.

- Pipeline: lexer → parser → duas passadas (1ª mede tamanhos, 2ª resolve labels) → emissor.
- Sintaxe: `[label:] [MNEMONIC [operand]] [; comentário]`, números em decimal (`123`),
  hex (`$2000`) e imediato (`#$0A`).
- Diretivas: `.org`, `.db`, `.dw`, `.ascii`, `.equ`.
- Saídas: `prog.bin` (bytes para a RAM) e `prog.lst` (endereço, bytes, fonte) para conferência
  manual, do jeito que se depurava assembly de verdade.
- Erros com arquivo, linha e coluna ("linha 12: label duplicada: loop").

## Execução e interface

A interface principal é um dashboard no navegador. O núcleo do simulador é um módulo puro
que avança exatamente um clock por chamada e não conhece nem Node nem DOM, então o mesmo
código roda na web, no CLI e nos testes.

### Dashboard (requisito)

- **Controles de execução**: Reset, Run/Pause e Passo. O Passo avança exatamente um clock
  (não uma instrução): a barra de espaço vira o relógio da máquina, como no vídeo. O modo
  direto (Run) tem velocidade ajustável, de 1 clock por segundo até o máximo que o navegador
  aguentar, e para em `HLT` ou num breakpoint.
- **Painel de registradores**: `PC`, `A`, `X`, `Y`, `SP`, `P` (flags com os bits acesos),
  `IR`, `MAR`, `MDR` e o passo `T` do sequenciador, todos em hex e binário.
- **Vista da memória**: hex dump dos 64 KiB com salto para endereço e as regiões do mapa
  coloridas (página zero, stack, RAM, terminal, disco, vetores), com virtualização — só as
  linhas visíveis são renderizadas, para o Run não engasgar. A célula do último byte lido
  ou escrito acende a cada clock, e a região do terminal aparece como texto legível ao lado.
- **Monitor de barramentos**: endereço, dado e sinais de controle correntes, mais o histórico
  rolável das micro-operações já executadas — a versão clicável do quadro do Akita.
- **Painel do programa**: listing do assembly carregado com o `PC` apontando a linha
  corrente; clicar numa linha cria ou remove breakpoint.
- **Carga de programas**: upload de `.asm` (montado no próprio navegador pelo mesmo
  assembler), `.bin` e `.disk`.

### CLI (ferramenta de CI e terminal)

Ferramenta `lcs` (low-level cpu simulator), para scripts, CI e quem estiver no terminal:

```
lcs assemble examples/soma.asm -o build/soma.bin    # monta + listing
lcs run build/soma.bin --trace                       # roda do reset, loga micro-ops
lcs run --disk build/hello.disk --trace              # boot pelo disco
lcs run ... --step                                   # 1 clock por Enter
lcs run ... --break 0x2000                           # para no breakpoint
```

O `--trace` imprime, ciclo a ciclo, os valores de `PC`, `IR`, `MAR`, `MDR`, os sinais de
controle e o byte nos barramentos — o mesmo dado que o dashboard mostra, só que em texto.

### Publicação no GitHub Pages

O app é 100% cliente — o núcleo isomórfico garante que nada exige servidor —, então o build
estático do Vite é hospedável no Pages sem adaptação. Um workflow do GitHub Actions roda
`vitest` e `vite build` a cada push na main e publica a pasta `dist/` com `actions/deploy-pages`.
Duas anotações de configuração: `base` do Vite aponta para o subcaminho do repositório
(`/low-level-cpu-simulator/`), e o app é single page sem router, o que dispensa qualquer
truque com 404.html.

## Linguagem

TypeScript com vitest nos testes, Vite como bundler e **SolidJS** na interface. A escolha do
framework atende ao tipo de carga deste projeto: no modo Run, o dashboard muda milhares de
vezes por segundo, e a reatividade fine-grained do Solid (sem virtual DOM) atualiza só o
sinal que mudou — cada registrador, cada flag e cada célula de memória visível é um signal,
não um diff de árvore inteira. React e Preact resolveriam, mas pagariam diff de VDOM nessa
frequência; Svelte 5 é a alternativa com o mesmo perfil. O núcleo continua isomórfico por
exigência do requisito de navegador: nenhuma API de Node dentro de `core/`, `bus/`, `cpu/`,
`memory/`, `storage/` e `asm/`. Se mais tarde fizer falta performance nativa (não vai, para
64 KiB e MHz simulados), o núcleo é portável para Rust mantendo os testes como
especificação.

## Estrutura do projeto

```
src/
  core/      Byte, Word, Clock, sinais de controle
  bus/       AddressBus, DataBus, ControlBus e quem pode falar neles
  cpu/       registers, alu, decoder, controlUnit (micro-ops por instrução)
  memory/    ram, memoryMap, terminal, diskController
  storage/   diskImage (leitura/gravação de .disk em setores)
  asm/       lexer, parser, pass1, pass2, emitter, listing
  runtime/   machine (fiação de tudo), executor, tracer, breakpoints
  cli/       comandos assemble/run
  web/       dashboard SolidJS + Vite: controles, registradores, vista de memória, barramentos, listing
docs/        ISA.md, memory-map.md, disk-format.md, asm.md
examples/    soma.asm, fib.asm, hello.asm, boot.asm, hello-disk.asm
tests/       unitários por componente + golden tests de montagem
.github/     CI de testes e deploy automático para o GitHub Pages
```

Cada componente só conhece os barramentos, nunca outro componente: a ULA não sabe que a RAM
existe, e o disco não sabe que a CPU existe. Essa restrição é o que impede o código de virar
um monólito disfarçado de simulador.

## Marcos

| Marco | Entrega | Como sei que está pronto |
|---|---|---|
| M1 Núcleo | barramentos, RAM, CPU com 8 instruções, clock com step/run/dump | soma 2+3 em binário cru, resultado conferido no dump |
| M2 Assembler | pipeline completo, labels, diretivas, listing, CLI | soma.asm e desvio.asm montam, os bytes batem com a tabela e rodam (fib espera o ADD absoluto do M5) |
| M3 Dashboard no navegador | controles Run/Pause/Reset e Passo de clock, painel de registradores, vista da memória, monitor de barramentos, carga de .asm/.bin, deploy no GitHub Pages | a soma 2+3 roda direto e clock a clock na URL do Pages, com o byte acendendo na memória a cada ciclo |
| M4 Disco e E/S | imagem .disk, controlador, terminal, vetor de reset | hello-disk.asm boota do disco e imprime no terminal do dashboard |
| M5 ISA completa | X/Y, stack, JSR/RTS, modos indexados, flags C/N/V | programa com função recursiva e loops roda certo |
| M6 Trace e docs | histórico de micro-ops no dashboard e no CLI; ISA, mapa de memória, formato do disco, guia do assembler | exemplos comentados rodam sem consultar o código |

Tamanhos aproximados em linhas de código: M1 ~800, M2 ~700, M3 ~900, M4 ~400, M5 ~400, M6
~300 de trace e o resto documentação. Cada marco fecha com testes passando, não com
"funciona na minha máquina".

## Decisões tomadas (e as alternativas descartadas)

- **ISA própria de 8 bits em vez de clone 6502**: um 6502 completo tem 151 opcodes e seis
  modos de endereçamento por grupo — realismo demais para o objetivo. A ISA própria mantém o
  portinha aberto para um modo "6502" futuro, já que a estrutura de barramentos e micro-ops
  é a mesma.
- **Disco por blocos com I/O programado em vez de DMA**: o bootloader em assembly fica
  curto e o conceito de controlador aparece sem o custo de arbitragem de barramento.
- **Binário na RAM via vetor de reset em vez de "carregar e pular"**: liga o simulador ao
  comportamento real de boot e deixa o disco como memória secundária de verdade, não como
  parâmetro de linha de comando disfarçado.
- **Dashboard no navegador como interface principal, CLI como ferramenta de CI**: exibir
  memória, registradores e barramentos atualizando a cada clock é natural numa página web, e
  o passo de um clock por vez é a unidade de avanço em qualquer interface — o CLI mantém o
  mesmo núcleo isomórfico, sem custo extra.
- **SolidJS em vez de React ou DOM puro**: no modo Run o dashboard muda milhares de vezes
  por segundo, e a reatividade fine-grained atualiza só o signal que mudou. Svelte 5 teria
  desempenho equivalente; React e Preact pagariam diff de VDOM à toa.
- **GitHub Pages por GitHub Actions**: o app é todo cliente-side, então um build estático do
  Vite publicado a cada push na main cobre a hospedagem — sem servidor, sem custo, com os
  testes de portão no mesmo workflow.

## Por onde começar

1. Congelar a tabela de opcodes em `docs/ISA.md` (é o contrato entre assembler e CPU).
2. M1: `core/`, `bus/`, `memory/ram`, `cpu/` com as 8 instruções do marco, e o teste da soma.
3. `examples/soma.asm` como primeiro cliente do assembler do M2.
