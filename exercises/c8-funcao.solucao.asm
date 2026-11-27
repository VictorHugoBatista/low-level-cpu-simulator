; c8 — desafio final (solução de referência)
; somanotas: percorre n structs de 2 bytes e devolve a soma das notas em A

        .org $0200

        jsr somanotas
        sta $0350       ; o retorno sai em A
        hlt

somanotas:
        lda #$00
        sta $0033       ; s = 0
        sta $0034       ; i = 0
loop:   lda $0034       ; A = i
        cmp $0032       ; compara i com n
        jc fora         ; i >= n → o while acabou
        shl             ; A = 2*i (o CMP não mexeu em A; cada struct
        tay             ; ocupa 2 bytes) → Y = 2*i
        lda ($30),y     ; A = v[i].nota — base + 0 do struct
        add $0033       ; A = s + nota
        sta $0033       ; s = s + v[i].nota
        inc $0034       ; i = i + 1
        jmp loop
fora:   lda $0033       ; return s — devolve em A
        rts
