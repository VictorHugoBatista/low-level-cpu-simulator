; c7 — struct (solução de referência)
; soma = x + y para dois structs em $0400 e $0403

        .org $0200

        lda $0400       ; p[0].x — base + 0
        add $0401       ; + p[0].y — base + 1
        sta $0402       ; p[0].soma — base + 2

        lda $0403       ; p[1].x — a base andou 3 bytes (o struct inteiro)
        add $0404       ; + p[1].y — os offsets continuam os mesmos
        sta $0405       ; p[1].soma — base + 2
        hlt
