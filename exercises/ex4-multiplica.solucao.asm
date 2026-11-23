; ex4 — multiplicação por somas repetidas (solução de referência)

        .org $0200

        lda #$00
        sta $0302       ; resultado = 0
        lda $0300
        sta $0030       ; contador = n (rascunho na página zero)
loop:   lda $0030       ; flags: Z=1 quando o contador chega a zero
        jz fim
        lda $0302
        add $0301       ; resultado += m
        sta $0302
        dec $0030       ; contador -= 1
        jmp loop
fim:    hlt
