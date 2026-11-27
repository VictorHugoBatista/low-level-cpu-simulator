; c3 — else if (solução de referência)
; três blocos, dois desvios: o fluxo que sobra é o else-if do meio

        .org $0200

        lda $0300       ; A = x (o LDA acende Z quando x == 0)
        jz zero         ; if (x == 0)
        cmp #$64        ; compara x com 100 ($64)
        jc grande       ; C=1 → x >= 100 → else final
        lda #$01        ; else-if: x < 100 → classe = 1
        sta $0301
        hlt
grande: lda #$02        ; else: x >= 100 → classe = 2
        sta $0301
        hlt
zero:   lda #$00        ; x == 0 → classe = 0
        sta $0301
        hlt
