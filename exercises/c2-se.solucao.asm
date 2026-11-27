; c2 — if / else (solução de referência)
; CMP deixa C=1 quando A >= operando: cair direto é o caminho do if
; (x >= 100); JNC leva ao else (x < 100).

        .org $0200

        lda $0300       ; A = x
        cmp #$64        ; compara x com 100 ($64) — só flags, A intacto
        jnc baixo       ; C=0 → x < 100 → else
        lda #$01        ; caminho do if: classe = 1
        sta $0301
        hlt
baixo:  lda #$00        ; else: classe = 0
        sta $0301
        hlt
