; d2 — pilha manual: inverta um array
;
; A RAM já vem com 4 bytes em $0400..$0403. Você tem uma pilha sua na
; página $05, com o SP em $0030 começando em $FF — a MESMA convenção da
; stack do hardware (que mora na página $01):
;
;     push: grava em $0500+SP e faz SP−−     (o PHA do hardware)
;     pop:  faz SP++ e lê de $0500+SP        (o PLA do hardware)
;
; Seu programa: empurre os 4 bytes para a pilha e depois pop de volta
; para $0400..$0403. Quem entrou por último sai primeiro — o array sai
; invertido. Use $0031 como índice do array.
;
; A mesma lógica em C:
;
;     int sp = 0xff;                  // o topo da página $05
;     for (int i = 0; i < 4; i++) {   // push: grava e desce
;         pilha[sp] = a[i];
;         sp = sp - 1;
;     }
;     for (int i = 0; i < 4; i++) {   // pop: sobe e lê
;         sp = sp + 1;
;         a[i] = pilha[sp];
;     }
;
; OBSERVE no painel de memória: sua pilha cresce de $05FF para baixo,
; exatamente como a stack do hardware cresce de $01FF. PHA e PLA não fazem
; nada que o programa não possa fazer à mão — a stack do hardware é só a
; mesma convenção, embutida em duas instruções.
;
; instruções que você precisa: LDA/STA, os modos indexados $0400,X e
; $0500,X, CMP, JC, INC, DEC, TAX e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
