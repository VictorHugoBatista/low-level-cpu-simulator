; ex3 — o maior de dois (solução de referência)

        .org $0200

        lda $0300
        cmp $0301       ; C=1 se $0300 ≥ $0301
        jc primeiro     ; o primeiro era o maior (ou igual)
        lda $0301       ; senão o segundo é o maior
        sta $0302
        hlt
primeiro:
        lda $0300
        sta $0302
        hlt
