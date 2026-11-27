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
import c1Template from "../../exercises/c1-variaveis.template.asm?raw";
import c1Solution from "../../exercises/c1-variaveis.solucao.asm?raw";
import c2Template from "../../exercises/c2-se.template.asm?raw";
import c2Solution from "../../exercises/c2-se.solucao.asm?raw";
import c3Template from "../../exercises/c3-se-senao.template.asm?raw";
import c3Solution from "../../exercises/c3-se-senao.solucao.asm?raw";
import c4Template from "../../exercises/c4-loop.template.asm?raw";
import c4Solution from "../../exercises/c4-loop.solucao.asm?raw";
import c5Template from "../../exercises/c5-string.template.asm?raw";
import c5Solution from "../../exercises/c5-string.solucao.asm?raw";
import c6Template from "../../exercises/c6-array.template.asm?raw";
import c6Solution from "../../exercises/c6-array.solucao.asm?raw";
import c7Template from "../../exercises/c7-struct.template.asm?raw";
import c7Solution from "../../exercises/c7-struct.solucao.asm?raw";
import c8Template from "../../exercises/c8-funcao.template.asm?raw";
import c8Solution from "../../exercises/c8-funcao.solucao.asm?raw";
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
  /** A mesma lógica do nível escrita em C — presente nos níveis da trilha "De C para
   * assembly", onde o ponto é ver a frase do C desmontada em instruções. */
  cCode?: string;
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
    name: 'string "MOS-6502" termina em 0',
    preset: [
      { addr: 0x0400, value: 0x4d },
      { addr: 0x0401, value: 0x4f },
      { addr: 0x0402, value: 0x53 },
      { addr: 0x0403, value: 0x2d },
      { addr: 0x0404, value: 0x36 },
      { addr: 0x0405, value: 0x35 },
      { addr: 0x0406, value: 0x30 },
      { addr: 0x0407, value: 0x32 },
      { addr: 0x0408, value: 0x00 },
    ],
    expectTerminal: "MOS-6502",
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

const HELLO: ExerciseDef[] = [
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
      "que some os dois e grave o resultado em $0302, terminando com HLT. A MOS-6502 é de 8 bits: " +
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
      "da MOS-6502: C=1 significa 'não houve borrow', ou seja, o valor comparado era menor ou " +
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

/**
 * A trilha "De C para assembly": cada nível pega uma construção básica do C (atribuição,
 * if/else, cadeia else if, while) e mostra como ela se desmonta em endereços, flags e
 * desvios da MOS-6502. O campo cCode guarda o trecho em C que o nível traduz.
 */
const c1Cases: ExerciseCase[] = [
  { name: "5 → 6", preset: [{ addr: 0x0300, value: 5 }], expect: [{ addr: 0x0300, value: 6 }] },
  { name: "0 → 1", preset: [{ addr: 0x0300, value: 0 }], expect: [{ addr: 0x0300, value: 1 }] },
  { name: "255 → 0 (a volta de 8 bits)", preset: [{ addr: 0x0300, value: 255 }], expect: [{ addr: 0x0300, value: 0 }] },
  { name: "199 → 200", preset: [{ addr: 0x0300, value: 199 }], expect: [{ addr: 0x0300, value: 200 }] },
];

const c2Cases: ExerciseCase[] = [
  { name: "200 ≥ 100 → 1", preset: [{ addr: 0x0300, value: 200 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "100 ≥ 100 → 1 (limite do >=)", preset: [{ addr: 0x0300, value: 100 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "99 < 100 → 0", preset: [{ addr: 0x0300, value: 99 }], expect: [{ addr: 0x0301, value: 0 }] },
  { name: "0 < 100 → 0", preset: [{ addr: 0x0300, value: 0 }], expect: [{ addr: 0x0301, value: 0 }] },
];

const c3Cases: ExerciseCase[] = [
  { name: "0 == 0 → classe 0", preset: [{ addr: 0x0300, value: 0 }], expect: [{ addr: 0x0301, value: 0 }] },
  { name: "42 < 100 → classe 1", preset: [{ addr: 0x0300, value: 42 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "99 < 100 → classe 1 (limite do <)", preset: [{ addr: 0x0300, value: 99 }], expect: [{ addr: 0x0301, value: 1 }] },
  { name: "100 ≥ 100 → classe 2", preset: [{ addr: 0x0300, value: 100 }], expect: [{ addr: 0x0301, value: 2 }] },
  { name: "255 ≥ 100 → classe 2", preset: [{ addr: 0x0300, value: 255 }], expect: [{ addr: 0x0301, value: 2 }] },
];

const c4Cases: ExerciseCase[] = [
  { name: "n=5 → soma 0..4 = 10", preset: [{ addr: 0x0300, value: 5 }], expect: [{ addr: 0x0030, value: 10 }] },
  { name: "n=0 → while não roda: soma 0", preset: [{ addr: 0x0300, value: 0 }], expect: [{ addr: 0x0030, value: 0 }] },
  { name: "n=1 → soma só do 0 = 0", preset: [{ addr: 0x0300, value: 1 }], expect: [{ addr: 0x0030, value: 0 }] },
  { name: "n=10 → soma 0..9 = 45", preset: [{ addr: 0x0300, value: 10 }], expect: [{ addr: 0x0030, value: 45 }] },
];

const c5Cases: ExerciseCase[] = [
  {
    name: 'string "banana" tem 3 a',
    preset: [
      { addr: 0x0400, value: 0x62 }, // b
      { addr: 0x0401, value: 0x61 }, // a
      { addr: 0x0402, value: 0x6e }, // n
      { addr: 0x0403, value: 0x61 }, // a
      { addr: 0x0404, value: 0x6e }, // n
      { addr: 0x0405, value: 0x61 }, // a
      { addr: 0x0406, value: 0x00 },
    ],
    expect: [{ addr: 0x0032, value: 3 }],
  },
  {
    name: 'string "xyz" tem 0 a',
    preset: [
      { addr: 0x0400, value: 0x78 },
      { addr: 0x0401, value: 0x79 },
      { addr: 0x0402, value: 0x7a },
      { addr: 0x0403, value: 0x00 },
    ],
    expect: [{ addr: 0x0032, value: 0 }],
  },
  {
    name: 'string "a" tem 1 a',
    preset: [
      { addr: 0x0400, value: 0x61 },
      { addr: 0x0401, value: 0x00 },
    ],
    expect: [{ addr: 0x0032, value: 1 }],
  },
  {
    name: 'string "abracadabra" tem 5 a',
    preset: [
      { addr: 0x0400, value: 0x61 }, // a
      { addr: 0x0401, value: 0x62 }, // b
      { addr: 0x0402, value: 0x72 }, // r
      { addr: 0x0403, value: 0x61 }, // a
      { addr: 0x0404, value: 0x63 }, // c
      { addr: 0x0405, value: 0x61 }, // a
      { addr: 0x0406, value: 0x64 }, // d
      { addr: 0x0407, value: 0x61 }, // a
      { addr: 0x0408, value: 0x62 }, // b
      { addr: 0x0409, value: 0x72 }, // r
      { addr: 0x040a, value: 0x61 }, // a
      { addr: 0x040b, value: 0x00 },
    ],
    expect: [{ addr: 0x0032, value: 5 }],
  },
];

const c6Cases: ExerciseCase[] = [
  {
    name: "1..8 soma 36",
    preset: [
      { addr: 0x0400, value: 1 },
      { addr: 0x0401, value: 2 },
      { addr: 0x0402, value: 3 },
      { addr: 0x0403, value: 4 },
      { addr: 0x0404, value: 5 },
      { addr: 0x0405, value: 6 },
      { addr: 0x0406, value: 7 },
      { addr: 0x0407, value: 8 },
    ],
    expect: [{ addr: 0x0030, value: 36 }],
  },
  {
    name: "só o primeiro elemento: 10",
    preset: [
      { addr: 0x0400, value: 10 },
      { addr: 0x0401, value: 0 },
      { addr: 0x0402, value: 0 },
      { addr: 0x0403, value: 0 },
      { addr: 0x0404, value: 0 },
      { addr: 0x0405, value: 0 },
      { addr: 0x0406, value: 0 },
      { addr: 0x0407, value: 0 },
    ],
    expect: [{ addr: 0x0030, value: 10 }],
  },
  {
    name: "200 + 100 = 44 (a volta de 8 bits)",
    preset: [
      { addr: 0x0400, value: 200 },
      { addr: 0x0401, value: 100 },
      { addr: 0x0402, value: 0 },
      { addr: 0x0403, value: 0 },
      { addr: 0x0404, value: 0 },
      { addr: 0x0405, value: 0 },
      { addr: 0x0406, value: 0 },
      { addr: 0x0407, value: 0 },
    ],
    expect: [{ addr: 0x0030, value: 44 }],
  },
  {
    name: "4×255 = 1020 → 252",
    preset: [
      { addr: 0x0400, value: 255 },
      { addr: 0x0401, value: 255 },
      { addr: 0x0402, value: 255 },
      { addr: 0x0403, value: 255 },
      { addr: 0x0404, value: 0 },
      { addr: 0x0405, value: 0 },
      { addr: 0x0406, value: 0 },
      { addr: 0x0407, value: 0 },
    ],
    expect: [{ addr: 0x0030, value: 252 }],
  },
];

const c7Cases: ExerciseCase[] = [
  {
    name: "p[0]=(10,20) → 30 e p[1]=(1,2) → 3",
    preset: [
      { addr: 0x0400, value: 10 }, // p[0].x
      { addr: 0x0401, value: 20 }, // p[0].y
      { addr: 0x0403, value: 1 },  // p[1].x
      { addr: 0x0404, value: 2 },  // p[1].y
    ],
    expect: [
      { addr: 0x0402, value: 30 }, // p[0].soma
      { addr: 0x0405, value: 3 },  // p[1].soma
    ],
  },
  {
    name: "p[0]=(200,100) → 44 (volta de 8 bits) e p[1]=(0,0) → 0",
    preset: [
      { addr: 0x0400, value: 200 },
      { addr: 0x0401, value: 100 },
      { addr: 0x0403, value: 0 },
      { addr: 0x0404, value: 0 },
    ],
    expect: [
      { addr: 0x0402, value: 44 },
      { addr: 0x0405, value: 0 },
    ],
  },
  {
    name: "p[0]=(5,5) → 10 e p[1]=(255,1) → 0",
    preset: [
      { addr: 0x0400, value: 5 },
      { addr: 0x0401, value: 5 },
      { addr: 0x0403, value: 255 },
      { addr: 0x0404, value: 1 },
    ],
    expect: [
      { addr: 0x0402, value: 10 },
      { addr: 0x0405, value: 0 },
    ],
  },
];

const c8Cases: ExerciseCase[] = [
  {
    name: "n=0 → soma 0 (o while não roda)",
    preset: [
      { addr: 0x0030, value: 0x00 }, // ponteiro = $0400 (baixo)
      { addr: 0x0031, value: 0x04 }, // ponteiro = $0400 (alto)
      { addr: 0x0032, value: 0 },    // n = 0
    ],
    expect: [{ addr: 0x0350, value: 0 }],
  },
  {
    name: "n=1, nota 10 (peso ignorado) → 10",
    preset: [
      { addr: 0x0030, value: 0x00 },
      { addr: 0x0031, value: 0x04 },
      { addr: 0x0032, value: 1 },
      { addr: 0x0400, value: 10 }, // v[0].nota
      { addr: 0x0401, value: 255 }, // v[0].peso
    ],
    expect: [{ addr: 0x0350, value: 10 }],
  },
  {
    name: "n=3, notas 5+200+50 = 255",
    preset: [
      { addr: 0x0030, value: 0x00 },
      { addr: 0x0031, value: 0x04 },
      { addr: 0x0032, value: 3 },
      { addr: 0x0400, value: 5 },
      { addr: 0x0401, value: 1 },
      { addr: 0x0402, value: 200 },
      { addr: 0x0403, value: 2 },
      { addr: 0x0404, value: 50 },
      { addr: 0x0405, value: 3 },
    ],
    expect: [{ addr: 0x0350, value: 255 }],
  },
  {
    name: "n=2, notas 200+100 = 300 → 44 (8 bits)",
    preset: [
      { addr: 0x0030, value: 0x00 },
      { addr: 0x0031, value: 0x04 },
      { addr: 0x0032, value: 2 },
      { addr: 0x0400, value: 200 },
      { addr: 0x0401, value: 9 },
      { addr: 0x0402, value: 100 },
      { addr: 0x0403, value: 9 },
    ],
    expect: [{ addr: 0x0350, value: 44 }],
  },
];

const C_LOGICA: ExerciseDef[] = [
  {
    id: "c1-variaveis",
    title: "variáveis: x = x + 1",
    theory:
      "No C, 'x = x + 1' parece uma equação, mas não é: significa 'calcule o lado direito e " +
      "sobrescreva x'. A variável é um endereço de memória, e a atribuição é uma instrução de " +
      "escrita — STA. A máquina separa a frase em três instruções: LDA lê a variável para A, " +
      "ADD calcula em cima de A, STA grava o resultado de volta no MESMO endereço, apagando o " +
      "valor antigo. Depois do STA, o valor anterior de x não existe mais.",
    statement:
      "A variável x está em $0300, com um valor de entrada. Implemente exatamente o 'x = x + 1' " +
      "do C: leia x, some 1 e grave o resultado de volta em $0300, terminando com HLT. O valor " +
      "antigo precisa sumir — o teste confere o próprio $0300 depois.",
    cCode: "int x = entrada;   // x mora em $0300\nx = x + 1;        // lê, soma 1, sobrescreve",
    template: c1Template,
    solution: c1Solution,
    hints: [
      "Três instruções: LDA $0300 traz x para A; ADD #$01 soma 1 em A; STA $0300 grava de volta no mesmo endereço.",
      "STA é o '=' do C: calcula o lado direito primeiro (LDA + ADD), e só depois grava. Inverter a ordem destrói o valor antes de somar.",
      "O teste 255 → 0 mostra a volta de 8 bits: rode passo a passo e veja A passar por 255, voltar a 0 — é o overflow que o C de 8 bits também teria.",
    ],
    cases: c1Cases,
  },
  {
    id: "c2-se",
    title: "if / else: quem decide é a flag",
    theory:
      "No C, o if avalia uma condição e escolhe um bloco. No hardware, a comparação e a escolha " +
      "são instruções separadas: CMP compara A com um valor sem mudar A e deixa o veredito nas " +
      "flags — C=1 significa 'A >= operando' (não houve borrow), C=0 significa 'A < operando'. " +
      "O desvio condicional lê a flag: JNC desvia quando C=0. Não existe 'o if': existe um fluxo " +
      "que ou cai reto no bloco de baixo, ou desvia para um rótulo.",
    statement:
      "A variável x está em $0300. Implemente o if/else do trecho em C: se x >= 100, grave 1 em " +
      "$0301; senão, grave 0 em $0301. Compare com CMP #$64 (100 em hexa) e decida com um desvio " +
      "que lê C. O caso x = 100 decide o limite: >= cai no bloco do if.",
    cCode:
      "int classe;\nif (x >= 100) {\n    classe = 1;\n} else {\n    classe = 0;\n}\n// resultado em $0301",
    template: c2Template,
    solution: c2Solution,
    hints: [
      "LDA $0300 carrega x; CMP #$64 compara com 100 sem mexer em A; C=1 quando x >= 100.",
      "JNC desvia quando C=0 — ou seja, para o else (x < 100). Quem NÃO desvia cai no bloco do if: LDA #$01, STA $0301, HLT.",
      "Os dois blocos terminam em HLT: se o caminho do if esquecer o HLT, ele escorrega para dentro do bloco do else e grava por cima.",
    ],
    cases: c2Cases,
  },
  {
    id: "c3-se-senao",
    title: "cadeia else if",
    theory:
      "A cadeia else if do C é uma escada: cada degrau testa uma condição, e quem desvia em " +
      "algum degrau escapa do resto. No assembly, cada degrau é um par (comparação, desvio) " +
      "com um rótulo próprio. Igualdade usa a flag Z: LDA acende Z quando o valor é zero, " +
      "então 'x == 0' vira JZ logo depois do LDA. Magnitude usa a flag C: CMP + JC. O bloco " +
      "que sobra no fluxo reto, sem desviar em degrau nenhum, é o else final.",
    statement:
      "A variável x está em $0300. Implemente a cadeia do trecho em C: se x == 0, grave 0 em " +
      "$0301; senão, se x < 100, grave 1; senão, grave 2. Três blocos, dois desvios — o " +
      "else-if do meio é o caminho que sobra no meio do programa.",
    cCode:
      "int classe;\nif (x == 0) {\n    classe = 0;\n} else if (x < 100) {\n    classe = 1;\n} else {\n    classe = 2;\n}\n// resultado em $0301",
    template: c3Template,
    solution: c3Solution,
    hints: [
      "O primeiro if não precisa de CMP: LDA $0300 acende Z quando x é 0, e JZ zero logo em seguida desvia — é assim que 'x == 0' fica barato.",
      "Depois do JZ (que não mexe nas flags), CMP #$64 compara x com 100; JC grande desvia quando x >= 100. O trecho que sobra no meio é o else-if: LDA #$01, STA $0301, HLT.",
      "Cuide da ordem: o JZ tem que vir antes do CMP, senão ele leria as flags do CMP em vez do LDA — cada desvio lê a flag da instrução imediatamente anterior.",
    ],
    cases: c3Cases,
  },
  {
    id: "c4-loop",
    title: "while: teste no topo, corpo, e a volta",
    theory:
      "O while do C tem três partes que o assembly também tem, só que nomeadas: o teste no " +
      "topo (ler o contador, comparar com a condição, desviar para fora), o corpo, e o JMP de " +
      "volta ao teste. A condição 'i < n' vira CMP $0300 com i em A: C=1 significa 'i >= n', " +
      "que é exatamente a hora de sair — JC para o fim. 'i = i + 1' nem precisa de A: INC " +
      "incrementa o byte direto na memória. O teste no topo é o que garante o comportamento " +
      "do C: com n = 0, o corpo nunca roda.",
    statement:
      "n está em $0300 (entrada). Implemente o while do trecho em C usando s em $0030 e i em " +
      "$0031: enquanto i < n, faça s = s + i e i = i + 1. Quando o while termina, a resposta " +
      "já está em $0030 — é lá que o teste vai conferir. Com n = 0, o corpo não pode rodar " +
      "uma vez sequer.",
    cCode:
      "int s = 0;      // mora em $0030\nint i = 0;      // mora em $0031\nwhile (i < n) { // n mora em $0300\n    s = s + i;\n    i = i + 1;\n}",
    template: c4Template,
    solution: c4Solution,
    hints: [
      "Antes do loop, zere as duas variáveis: LDA #$00, STA $0030 (s) e STA $0031 (i) — o C inicializa os dois 'int' com 0.",
      "O teste do while fica no topo do rótulo loop: LDA $0031 (i), CMP $0300 (n), JC fim — C=1 significa i >= n, exatamente a saída de while (i < n).",
      "O corpo termina com JMP loop, sem ele o while roda uma vez só e vira if. Dentro do corpo: s = s + i (LDA $0030, ADD $0031, STA $0030) e INC $0031 para i = i + 1.",
    ],
    cases: c4Cases,
  },
  {
    id: "c5-string",
    title: "string: contar caracteres",
    theory:
      "Uma string em C é um array de chars com um terminador '\\0' no fim. Na máquina, é um " +
      "bloco de bytes com um $00 marcando o fim — e é ele quem decide quando o while para: " +
      "não há contador, há terminador. '*p' é ler o byte apontado: lda (ptr),y. '*p == " +
      "caractere' é um CMP com o código ASCII e um JNZ: igualdade usa a flag Z. E 'p++' é um " +
      "INC no ponteiro — em TODA volta do laço, contando ou não, senão o programa fica preso " +
      "no mesmo byte.",
    statement:
      "Há uma string terminada em $00 em $0400 (o teste troca a string). Conte quantos " +
      "caracteres 'a' ($61) ela tem e grave o total em $0032 — não em $0030/$0031, que são " +
      "o ponteiro da string (baixo e alto). O programa já prepara o ponteiro, o Y e o " +
      "contador — falta o laço. A string 'banana' tem 3; 'xyz' tem 0.",
    cCode:
      "int count = 0;      // mora em $0032\nchar *p = s;        // mora em $30/$31\nwhile (*p != '\\0') {\n    if (*p == 'a') count++;\n    p++;\n}",
    template: c5Template,
    solution: c5Solution,
    hints: [
      "O corpo do laço: lda (ptr),y → jz fim (o $00 liga Z e encerra) → cmp #$61 ('a' em hexa) → jnz avanca (não é 'a', não conta) → inc $0032 → avanca: inc ptr, jmp loop.",
      "O inc ptr fica DEPOIS do desvio de contagem, no rótulo avanca — ele roda em toda volta, com 'a' ou sem. Se ficar só dentro do if, a string nunca anda.",
      "Cuidado com a página zero: $0030 e $0031 já são o ponteiro (baixo e alto). O contador tem que morar em outro byte — $0032. Duas variáveis, endereços diferentes: é assim que colisão de dados aparece.",
    ],
    cases: c5Cases,
  },
  {
    id: "c6-array",
    title: "array: a[i] é um endereço calculado",
    theory:
      "Um array em C é um bloco de elementos do mesmo tamanho lado a lado na memória — aqui " +
      "com sizeof(int) = 1 byte. 'a[i]' significa 'o byte em base + i', e a MOS-6502 tem uma " +
      "instrução que faz essa conta sozinha: o modo indexado $hhhh,X, cujo endereço efetivo é " +
      "base + X. Você põe o índice em X com TAX (A→X) e escreve lda $0400,x — o X entra na " +
      "conta do endereço, não no dado. O while continua o mesmo do c4: teste no topo, corpo, " +
      "e a volta.",
    statement:
      "Há um array de 8 bytes em $0400..$0407 (o teste troca os valores). Some todos os " +
      "elementos e grave o total em $0030, com s em $0030 e i em $0031. O teste da parada " +
      "é fixo: while (i < 8). A soma dá a volta em módulo 256 — 200 + 100 = 44.",
    cCode:
      "int a[8];    // mora em $0400..$0407\nint s = 0;   // mora em $0030\nint i = 0;   // mora em $0031\nwhile (i < 8) {\n    s = s + a[i];\n    i = i + 1;\n}",
    template: c6Template,
    solution: c6Solution,
    hints: [
      "Antes do laço, zere as duas variáveis (LDA #$00, STA $0030 e $0031). No topo do loop: lda $0031 (i), cmp #$08, jc fim — C=1 significa i >= 8.",
      "No corpo: tax põe i em X; lda $0030 (s), add $0400,x soma o elemento a[i] — o endereço é $0400 + X; sta $0030 grava s de volta; inc $0031 incrementa i.",
      "O CMP não mexe em A: depois de comparar i com 8, A ainda é i — é por isso que o TAX vem logo depois do JC, sem recarregar.",
    ],
    cases: c6Cases,
  },
  {
    id: "c7-struct",
    title: "struct: campo é base + offset",
    theory:
      "Um struct em C é um bloco de bytes com layout fixo: cada campo mora em 'base + " +
      "offset', e os offsets nunca mudam — x é sempre base + 0, y é sempre base + 1, soma " +
      "é sempre base + 2. O que muda entre um struct e outro é só a base: p[1] começa em " +
      "$0400 + 3, porque o struct inteiro ocupa 3 bytes. Acessar um campo, então, é ler ou " +
      "escrever um endereço absoluto que você calcula na cabeça: base + offset.",
    statement:
      "Há dois structs Ponto na RAM: p[0] em $0400 e p[1] em $0403 — em cada um, x no " +
      "primeiro byte, y no segundo e soma no terceiro (o teste troca os valores). Para cada " +
      "struct, calcule soma = x + y e grave no próprio campo soma: $0402 e $0405. São as " +
      "mesmas três instruções, com a base deslocada.",
    cCode:
      "struct Ponto {\n    int x;      // base + 0\n    int y;      // base + 1\n    int soma;   // base + 2\n};\n\nstruct Ponto p[2];  // p[0] em $0400, p[1] em $0403\n\np[0].soma = p[0].x + p[0].y;\np[1].soma = p[1].x + p[1].y;",
    template: c7Template,
    solution: c7Solution,
    hints: [
      "O primeiro struct: lda $0400 (x), add $0401 (y), sta $0402 (soma). O segundo é o mesmo padrão com todos os endereços +3: $0403, $0404, $0405.",
      "Não existe 'p[0]' nem 'p[1]' na máquina — existe o endereço. Para o compilador, escrever p[1].y é somar base + sizeof(struct) + offset antes de gerar o código.",
      "Confira no painel de memória: os três bytes de cada struct ficam lado a lado, e a soma sobrescreve o terceiro byte do próprio struct.",
    ],
    cases: c7Cases,
  },
  {
    id: "c8-funcao",
    title: "desafio final: a função completa",
    theory:
      "A função completa junta tudo o que a trilha ensinou: JSR/RTS com contrato de dados " +
      "(ex5), while com teste no topo (c4), ponteiro indireto com deslocamento (ex6) e " +
      "struct acessada por base + offset (c7). O endereço de v[i].nota é base + 2*i, porque " +
      "cada struct ocupa 2 bytes — e 2*i na máquina é um SHL (deslocar um bit à esquerda " +
      "multiplica por 2), seguido de TAY para virar índice do lda ($30),y. O resultado volta " +
      "em A, como o contrato combinou, e quem guarda é quem chamou.",
    statement:
      "Há um ponteiro para o array em $30/$31 e n em $0032; o array tem n structs Aluno em " +
      "$0400, cada um com nota (base + 0) e peso (base + 1). Escreva a função somanotas: " +
      "ela percorre o array, soma as notas (ignore o peso) e devolve o total em A, " +
      "terminando com RTS. O programa principal já chama e grava o retorno em $0350. Use " +
      "$0033 para s e $0034 para i. Com n = 0, devolva 0 sem percorrer nada.",
    cCode:
      "struct Aluno {\n    int nota;    // base + 0\n    int peso;    // base + 1\n};\n\n// contrato: ponteiro v em $30/$31, n em $0032, retorno em A\nint soma_notas(struct Aluno *v, int n) {\n    int s = 0;   // rascunho em $0033\n    int i = 0;   // rascunho em $0034\n    while (i < n) {\n        s = s + v[i].nota;   // base + 2*i\n        i = i + 1;\n    }\n    return s;\n}",
    template: c8Template,
    solution: c8Solution,
    hints: [
      "Comece a função zerando os rascunhos: LDA #$00, STA $0033 (s) e STA $0034 (i). No topo do loop: lda $0034 (i), cmp $0032 (n), jc fora — C=1 significa i >= n.",
      "O endereço de v[i].nota é base + 2*i: depois do JC, A ainda é i — shl dobra (A = 2*i), tay copia para Y, e lda ($30),y lê o byte em ponteiro + Y.",
      "Feche o corpo com add $0033, sta $0033 (s = s + nota), inc $0034 e jmp loop. No rótulo fora, devolva: lda $0033 e rts — o RTS desempilha o endereço que o JSR gravou.",
    ],
    cases: c8Cases,
  },
];

export const EXERCISES: ExerciseDef[] = [...HELLO, ...C_LOGICA];

/**
 * Uma trilha é uma coleção ordenada de exercícios: os níveis se desbloqueiam em sequência
 * dentro dela. O exercício em si não sabe de trilha — o progresso segue por id, então o
 * mesmo exercício pode entrar em mais de uma trilha.
 */
export interface TrackDef {
  id: string;
  title: string;
  description: string;
  exercises: ExerciseDef[];
}

export const TRACKS: TrackDef[] = [
  {
    id: "hello-world",
    title: "Hello World",
    description:
      "Do primeiro LDA/ADD/STA até Fibonacci: os sete exercícios de fixação, em ordem crescente de dificuldade.",
    exercises: HELLO,
  },
  {
    id: "c-para-asm",
    title: "De C para assembly",
    description:
      "Como as construções do C — variáveis, if/else, loops, strings, arrays, structs e uma função completa — se traduzem em endereços, flags e desvios: cada nível mostra a mesma lógica escrita nas duas linguagens.",
    exercises: C_LOGICA,
  },
];
