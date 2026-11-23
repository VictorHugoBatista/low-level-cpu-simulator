import ex1Template from "../../exercises/ex1-soma.template.asm?raw";
import ex1Solution from "../../exercises/ex1-soma.solucao.asm?raw";
import ex2Template from "../../exercises/ex2-paridade.template.asm?raw";
import ex2Solution from "../../exercises/ex2-paridade.solucao.asm?raw";
import ex3Template from "../../exercises/ex3-maior.template.asm?raw";
import ex3Solution from "../../exercises/ex3-maior.solucao.asm?raw";
import ex4Template from "../../exercises/ex4-multiplica.template.asm?raw";
import ex4Solution from "../../exercises/ex4-multiplica.solucao.asm?raw";
import ex5Template from "../../exercises/ex5-dobra.template.asm?raw";
import ex5Solution from "../../exercises/ex5-dobra.solucao.asm?raw";
import ex6Template from "../../exercises/ex6-string.template.asm?raw";
import ex6Solution from "../../exercises/ex6-string.solucao.asm?raw";
import ex7Template from "../../exercises/ex7-fib.template.asm?raw";
import ex7Solution from "../../exercises/ex7-fib.solucao.asm?raw";
import type { ExerciseCase } from "../runtime/exercise.js";

/**
 * A série de exercícios de fixação, em ordem. Cada nível tem uma base teórica breve, um
 * enunciado e uma sequência de casos de teste: valores pre-colocados em endereços de
 * origem e os valores esperados nos endereços de destino — cada caso roda numa máquina
 * fresca, então o programa do aluno é testado contra valores diferentes.
 *
 * Módulo de dados puro: sem Solid, sem DOM — os testes do vitest importam daqui para
 * garantir que toda solução de referência passa nos próprios casos e que nenhum template
 * passa sem trabalho.
 */

export interface ExerciseDef {
  id: string;
  title: string;
  /** Base teórica breve: o conceito que o nível fixa, no vocabulário do painel "referência". */
  theory: string;
  /** Enunciado do problema: o que o verificador espera, com os endereços exatos. */
  statement: string;
  template: string;
  solution: string;
  hints: string[];
  cases: ExerciseCase[];
}

const ex1Cases: ExerciseCase[] = [
  {
    name: "10 + 32 = 42",
    preset: [
      { addr: 0x0300, value: 10 },
      { addr: 0x0301, value: 32 },
    ],
    expect: [{ addr: 0x0302, value: 42 }],
  },
  {
    name: "200 + 55 = 255",
    preset: [
      { addr: 0x0300, value: 200 },
      { addr: 0x0301, value: 55 },
    ],
    expect: [{ addr: 0x0302, value: 255 }],
  },
  {
    name: "128 + 128 = 0 (a volta de 8 bits)",
    preset: [
      { addr: 0x0300, value: 128 },
      { addr: 0x0301, value: 128 },
    ],
    expect: [{ addr: 0x0302, value: 0 }],
  },
];

const ex2Cases: ExerciseCase[] = [
  { name: "$0A (10) é par → 0", preset: [{ addr: 0x0300, value: 10 }], expect: [{ addr: 0x0301, value: 0 }] },
  { name: "$07 (7) é ímpar → 1", preset: [{ addr: 0x0300, value: 7 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "$FF (255) é ímpar → 1", preset: [{ addr: 0x0300, value: 255 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "$00 (0) é par → 0", preset: [{ addr: 0x0300, value: 0 }], expect: [{ addr: 0x0301, value: 0 }] },
];

const ex3Cases: ExerciseCase[] = [
  {
    name: "maior(3, 9) = 9",
    preset: [
      { addr: 0x0300, value: 3 },
      { addr: 0x0301, value: 9 },
    ],
    expect: [{ addr: 0x0302, value: 9 }],
  },
  {
    name: "maior(250, 4) = 250",
    preset: [
      { addr: 0x0300, value: 250 },
      { addr: 0x0301, value: 4 },
    ],
    expect: [{ addr: 0x0302, value: 250 }],
  },
  {
    name: "maior(7, 7) = 7",
    preset: [
      { addr: 0x0300, value: 7 },
      { addr: 0x0301, value: 7 },
    ],
    expect: [{ addr: 0x0302, value: 7 }],
  },
];

const ex4Cases: ExerciseCase[] = [
  {
    name: "3 × 4 = 12",
    preset: [
      { addr: 0x0300, value: 3 },
      { addr: 0x0301, value: 4 },
    ],
    expect: [{ addr: 0x0302, value: 12 }],
  },
  {
    name: "13 × 7 = 91",
    preset: [
      { addr: 0x0300, value: 13 },
      { addr: 0x0301, value: 7 },
    ],
    expect: [{ addr: 0x0302, value: 91 }],
  },
  {
    name: "5 × 0 = 0 (somar zero n vezes)",
    preset: [
      { addr: 0x0300, value: 5 },
      { addr: 0x0301, value: 0 },
    ],
    expect: [{ addr: 0x0302, value: 0 }],
  },
  {
    name: "0 × 9 = 0 (cuidado com o contador zero)",
    preset: [
      { addr: 0x0300, value: 0 },
      { addr: 0x0301, value: 9 },
    ],
    expect: [{ addr: 0x0302, value: 0 }],
  },
];

const ex5Cases: ExerciseCase[] = [
  {
    name: "dobra(5) = 10 e dobra(200) = 400 → 144 (8 bits)",
    preset: [
      { addr: 0x0300, value: 5 },
      { addr: 0x0302, value: 200 },
    ],
    expect: [
      { addr: 0x0301, value: 10 },
      { addr: 0x0303, value: 144 },
    ],
  },
  {
    name: "dobra(0) = 0 e dobra(1) = 2",
    preset: [
      { addr: 0x0300, value: 0 },
      { addr: 0x0302, value: 1 },
    ],
    expect: [
      { addr: 0x0301, value: 0 },
      { addr: 0x0303, value: 2 },
    ],
  },
  {
    name: "dobra(127) = 254 e dobra(128) = 256 → 0",
    preset: [
      { addr: 0x0300, value: 127 },
      { addr: 0x0302, value: 128 },
    ],
    expect: [
      { addr: 0x0301, value: 254 },
      { addr: 0x0303, value: 0 },
    ],
  },
];

const ex6Cases: ExerciseCase[] = [
  {
    name: 'string "AK-8" termina em 0',
    preset: [
      { addr: 0x0400, value: 0x41 },
      { addr: 0x0401, value: 0x4b },
      { addr: 0x0402, value: 0x2d },
      { addr: 0x0403, value: 0x38 },
      { addr: 0x0404, value: 0x00 },
    ],
    expectTerminal: "AK-8",
  },
  {
    name: 'string "oi" termina em 0',
    preset: [
      { addr: 0x0400, value: 0x6f },
      { addr: 0x0401, value: 0x69 },
      { addr: 0x0402, value: 0x00 },
    ],
    expectTerminal: "oi",
  },
  {
    name: 'string "x" (um caractere só)',
    preset: [
      { addr: 0x0400, value: 0x78 },
      { addr: 0x0401, value: 0x00 },
    ],
    expectTerminal: "x",
  },
];

const ex7Cases: ExerciseCase[] = [
  { name: "fib(0) = 0", preset: [{ addr: 0x0300, value: 0 }], expect: [{ addr: 0x0301, value: 0 }] },
  { name: "fib(1) = 1", preset: [{ addr: 0x0300, value: 1 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "fib(7) = 13", preset: [{ addr: 0x0300, value: 7 }], expect: [{ addr: 0x0301, value: 13 }] },
  { name: "fib(12) = 144", preset: [{ addr: 0x0300, value: 12 }], expect: [{ addr: 0x0301, value: 144 }] },
];

export const EXERCISES: ExerciseDef[] = [
  {
    id: "ex1-soma",
    title: "soma de dois valores",
    theory:
      "A memória é a mesa de trabalho da máquina: o programa lê bytes de endereços e escreve " +
      "bytes em endereços, sempre pelos barramentos. LDA carrega um byte de um endereço para " +
      "o registrador A; ADD soma ao A o byte de outro endereço (ou um imediato #n); STA grava " +
      "o A de volta em um endereço. O painel de barramentos mostra cada byte indo e vindo — " +
      "aconteceu um LDA? o byte apareceu no barramento de dados.",
    statement:
      "Os valores de entrada já estão na RAM: um em $0300 e outro em $0301. Escreva um programa " +
      "que some os dois e grave o resultado em $0302, terminando com HLT. A AK-8 é de 8 bits: " +
      "a soma dá a volta em módulo 256 (o último teste prova isso).",
    template: ex1Template,
    solution: ex1Solution,
    hints: [
      "Três instruções bastam entre o .org e o HLT: LDA $0300, depois ADD $0301, depois STA $0302.",
      "ADD soma o CONTEÚDO de um endereço ao A corrente — não recarregue A com LDA antes do ADD, senão a soma se perde.",
      "Rode passo a passo e acompanhe A no painel de registradores: ele deve passar por 10, 42 e então o STA grava em $0302.",
    ],
    cases: ex1Cases,
  },
  {
    id: "ex2-paridade",
    title: "par ou ímpar (flags e desvio)",
    theory:
      "A ULA calcula e as flags anotam o que aconteceu: Z (resultado zero), N (bit 7 aceso), " +
      "C (carry) e V (overflow). Nada no programa 'sabe' o resultado — quem decide um desvio " +
      "condicional é uma flag. SHR desloca A um bit para a direita e o bit 0 que sai vai para " +
      "a flag C. Em binário, o bit 0 é exatamente o que distingue ímpar de par.",
    statement:
      "Há um valor em $0300. Grave 1 em $0301 se ele for ímpar, ou 0 em $0301 se for par. " +
      "Dica da arquitetura: SHR derruba o bit 0 de A na flag C; JC desvia quando C=1.",
    template: ex2Template,
    solution: ex2Solution,
    hints: [
      "LDA $0300, depois SHR: o bit 0 do valor agora está na flag C. Use JC para separar os dois caminhos.",
      "Cada caminho grava seu valor com LDA #imediato + STA $0301 e termina em HLT — são dois blocos pequenos, um com rótulo para o JC mirar.",
      "Os quatro casos de teste passam por 0 e 255: se seu programa der errado só nesses, confira o que acontece quando A já começa zero ou é todo 1s.",
    ],
    cases: ex2Cases,
  },
  {
    id: "ex3-maior",
    title: "o maior de dois (comparação)",
    theory:
      "CMP é um SUB que joga fora o resultado e fica só com as flags — A não muda. A convenção " +
      "da AK-8: C=1 significa 'não houve borrow', ou seja, o valor comparado era menor ou " +
      "igual a A. Comparação sem sinal: $FA (250) é maior que $04 (4), apesar do bit 7 aceso — " +
      "a flag N diria 'negativo' se fosse aritmética com sinal, mas C compara magnitude.",
    statement:
      "Há um valor em $0300 e outro em $0301. Grave o maior deles em $0302. Se forem iguais, " +
      "tanto faz — o valor é o mesmo. Compare com CMP e decida com JC.",
    template: ex3Template,
    solution: ex3Solution,
    hints: [
      "LDA $0300 carrega o candidato; CMP $0301 compara sem mudar A; JC desvia quando C=1 ($0300 ≥ $0301).",
      "Os dois caminhos são quase iguais: cada um carrega seu endereço com LDA, grava em $0302 e dá HLT.",
      "O caso de empate (7, 7) tem C=1: ele cai no caminho de '$0300 ≥ $0301' — e está certo, pois os dois são iguais.",
    ],
    cases: ex3Cases,
  },
  {
    id: "ex4-multiplica",
    title: "multiplicação por somas (loop)",
    theory:
      "A CPU não tem multiplicação — quem multiplica é o software, somando n vezes. Um loop " +
      "precisa de três peças: um acumulador (o resultado), um contador na memória e um teste " +
      "de parada. DEC faz M ← M − 1 direto na memória e acende Z quando chega a zero; JZ desvia " +
      "lendo a flag que o DEC (ou o LDA antes dele) acendeu. O rascunho mora na página zero " +
      "($0030) porque lá as instruções são um byte mais curtas.",
    statement:
      "Há n em $0300 e m em $0301. Calcule n × m somando m ao resultado, n vezes, e grave em " +
      "$0302. Cuidado com o caso n=0: o resultado deve ser 0 sem executar nenhuma soma — " +
      "verifique o contador ANTES de somar.",
    template: ex4Template,
    solution: ex4Solution,
    hints: [
      "Comece zerando $0302 (resultado) e copiando n para $0030 (contador). O corpo do loop soma $0301 ao $0302 e decrementa $0030.",
      "Teste o contador no TOPO do loop: LDA $0030 acende Z se ele já for zero, e JZ sai — é assim que n=0 não soma nada.",
      "DEC acende Z quando chega a zero, mas o JZ do topo lê as flags do LDA $0030 — as duas estratégias funcionam; só não misture as flags de instruções diferentes na mesma decisão.",
    ],
    cases: ex4Cases,
  },
  {
    id: "ex5-dobra",
    title: "função dobra (stack e JSR)",
    theory:
      "Uma função é um bloco de código que qualquer parte do programa pode chamar: JSR empilha " +
      "o endereço de retorno na stack (página $0100, que cresce de $01FF para baixo) e desvia; " +
      "RTS desempilha e volta exatamente de onde veio. O contrato de dados é combinado pelo " +
      "programador: esta função recebe o valor em A e devolve o dobro em A. Stack não é abstração: " +
      "no painel de barramentos você vê os dois writes em $01xx do JSR e os reads do RTS.",
    statement:
      "Há um valor em $0300 e outro em $0302. O programa principal (pronto, não mexa) chama a " +
      "função dobra duas vezes e grava os resultados em $0301 e $0303. Escreva a função: ela " +
      "recebe o valor em A, devolve 2×A em A e termina com RTS. Um rascunho em $0030 resolve " +
      "o 'A ← A + A'.",
    template: ex5Template,
    solution: ex5Solution,
    hints: [
      "A função precisa de duas cópias de A para somá-las: STA $0030 guarda a primeira, ADD $0030 soma a cópia de volta. Depois RTS.",
      "O A entra já carregado (o LDA é do programa principal) — a função não deve fazer LDA de endereço nenhum.",
      "Rode passo a passo e olhe SP no painel de registradores: ele muda no JSR (empilha 2 bytes) e volta no RTS.",
    ],
    cases: ex5Cases,
  },
  {
    id: "ex6-string",
    title: "string no terminal (ponteiro indireto)",
    theory:
      "O terminal é memória: escrever um byte em $E800 imprime o caractere correspondente — " +
      "para a máquina, é só mais um write no barramento. Para percorrer dados cujo endereço " +
      "muda em tempo de execução existe o modo indireto pós-indexado: um ponteiro de 2 bytes " +
      "na página zero ($30 baixo, $31 alto) e a instrução lda (ptr),y — com Y=0, ela lê o byte " +
      "apontado. A string termina em $00, e o LDA acende Z exatamente nesse byte: o terminador " +
      "é quem decide o fim do loop.",
    statement:
      "Há uma string terminada em $00 em $0400 (muda a cada teste). Percorra os bytes a partir " +
      "do ponteiro $30/$31 (apontando para $0400) e escreva cada caractere em $E800 até encontrar " +
      "o $00 — sem imprimi-lo.",
    template: ex6Template,
    solution: ex6Solution,
    hints: [
      "O corpo do loop é: lda (ptr),y → jz fim (Z=1 quando o byte é $00) → sta $e800 → inc ptr → jmp loop.",
      "jz logo depois do lda lê as flags do próprio LDA: o byte $00 é o único que acende Z, então o desvio só acontece no terminador.",
      "Se aparecer lixo no terminal, veja o painel de barramentos: o endereço do write deve andar $0400, $0401, $0402... se andou mais, o INC aconteceu fora de ordem; se repetiu, falta o JMP no fim do corpo.",
    ],
    cases: ex6Cases,
  },
  {
    id: "ex7-fib",
    title: "desafio: Fibonacci",
    theory:
      "O teste final combina tudo: loop com contador, estado em rascunhos da página zero, " +
      "soma e flags. Fibonacci é uma recorrência — cada valor depende dos dois anteriores — " +
      "então o programa precisa carregar a dupla (a, b) para a frente a cada volta: " +
      "t = a + b; a = b; b = t. Note que 'variável' aqui significa 'endereço de memória com " +
      "papel combinado': a máquina só tem endereços, bytes e fluxo de desvio.",
    statement:
      "Há n em $0300. Calcule fib(n) — fib(0)=0, fib(1)=1, fib(n)=fib(n−1)+fib(n−2) — e grave " +
      "em $0301. Use rascunhos na página zero (contador, b e temporário). Os testes passam por " +
      "n=0, n=1, n=7 e n=12 — n=0 tem que sair sem dar nenhuma volta no loop.",
    template: ex7Template,
    solution: ex7Solution,
    hints: [
      "Inicie o estado antes do loop: $0301 = 0 (a, que é também o resultado), $0031 = 1 (b), $0030 = n (contador).",
      "O corpo da volta: t = a + b em $0032 (LDA $0301, ADD $0031, STA $0032); depois a = b ($0301 ← $0031) e b = t ($0031 ← $0032). A ordem importa: calcule t ANTES de mexer em a e b.",
      "O teste de parada é igual ao do ex4: LDA $0030 no topo do loop e JZ para sair quando o contador chega a zero — é isso que faz n=0 devolver 0 sem nenhuma volta.",
    ],
    cases: ex7Cases,
  },
];
