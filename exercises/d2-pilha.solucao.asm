; d2 — pilha manual (solução de referência)
; empurra $0400..$0403 para a pilha da página $05 e faz pop de volta: sai invertido

        .org $0200

        lda #$ff
        sta $0030       ; sp = $ff — o topo da página $05
        lda #$00
        sta $0031       ; i = 0
empurra:
        lda $0031       ; i
        cmp #$04
        jc puxa         ; i >= 4 → tudo empurrado, hora do pop
        tax             ; X = i
        lda $0400,x     ; A = a[i]
        ldx $0030       ; X = sp
        sta $0500,x     ; push: pilha[sp] = a[i]
        dec $0030       ; sp--
        inc $0031       ; i++
        jmp empurra
puxa:
        lda #$00
        sta $0031       ; i = 0
volta:
        lda $0031
        cmp #$04
        jc fim          ; i >= 4 → o array está invertido
        inc $0030       ; pop: o SP sobe antes de ler
        ldx $0030       ; X = sp
        lda $0500,x     ; A = o byte do topo
        ldx $0031       ; X = i
        sta $0400,x     ; a[i] = topo
        inc $0031       ; i++
        jmp volta
fim:    hlt
