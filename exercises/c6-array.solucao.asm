; c6 — array (solução de referência)
; soma dos 8 elementos de $0400..$0407

        .org $0200

        lda #$00
        sta $0030       ; s = 0
        sta $0031       ; i = 0
loop:   lda $0031       ; A = i
        cmp #$08        ; compara i com o tamanho do array
        jc fim          ; i >= 8 → o while acabou
        tax             ; X = i (o CMP não mexeu em A)
        lda $0030       ; A = s
        add $0400,x     ; A = s + a[i] — o modo indexado
        sta $0030       ; s = s + a[i]
        inc $0031       ; i = i + 1
        jmp loop
fim:    hlt             ; a resposta fica em $0030
