; ex5 — função dobra (solução de referência)

        .org $0200

        lda $0300
        jsr dobra
        sta $0301
        lda $0302
        jsr dobra
        sta $0303
        hlt

dobra:  sta $0030       ; guarda A num rascunho
        add $0030       ; A = A + A = 2 × A
        rts             ; volta para quem chamou
