; ex2 — par ou ímpar (solução de referência)

        .org $0200

        lda $0300
        shr             ; o bit 0 vai para a flag C
        jc impar        ; C=1 → o valor era ímpar
        lda #$00        ; C=0 → par
        sta $0301
        hlt
impar:  lda #$01
        sta $0301
        hlt
