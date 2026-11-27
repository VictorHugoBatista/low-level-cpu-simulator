; c3 — else if: uma cadeia de decisões, uma flag por degrau
;
; A mesma lógica em C:
;
;     int classe;
;     if (x == 0) {
;         classe = 0;
;     } else if (x < 100) {
;         classe = 1;
;     } else {
;         classe = 2;
;     }
;
; Cada degrau da cadeia vira um par (comparação, desvio): o primeiro
; if testa igualdade (a flag Z acende quando o valor é zero), o
; segundo testa magnitude (CMP + JC). Quem não desvia em nenhum
; degrau cai no else final.
;
; instruções que você precisa: LDA, JZ (desvia se Z=1), CMP #imediato,
; JC (desvia se C=1), LDA #imediato, STA, HLT e rótulos.

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
