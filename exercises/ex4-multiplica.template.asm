; ex4 — multiplicação por somas repetidas
;
; A RAM já vem com n em $0300 e m em $0301. Calcule n × m somando m a si
; mesmo n vezes e grave o resultado em $0302 (8 bits, com a volta de 256).
;
; Um loop de verdade: um contador na página zero ($0030), DEC nele a cada
; volta, e JZ (desvia se Z=1) para sair quando ele chega a zero. O JZ lê
; as flags que o LDA acendeu — quem decide continuar é a flag.
;
; instruções que você precisa: LDA, STA, ADD, DEC (M ← M−1 na memória),
; JZ, JMP, HLT

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
