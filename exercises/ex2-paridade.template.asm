; ex2 — par ou ímpar: leia o valor pre-colocado e classifique
;
; A RAM já vem com um valor em $0300. Grave 1 em $0301 se ele for ímpar,
; ou 0 em $0301 se for par. A dica da máquina: SHR derruba o bit 0 de A
; na flag C — C=1 significa "o número era ímpar", e quem decide o desvio
; é a flag, não o programador.
;
; instruções que você precisa: LDA, SHR, JC (desvia se C=1), LDA #imediato, STA, HLT

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
