; ex1 — soma (solução de referência)

        .org $0200

        lda $0300       ; A = primeiro valor
        add $0301       ; A = A + segundo valor
        sta $0302       ; grava o resultado
        hlt
