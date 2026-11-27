; s2 — cifra XOR (solução de referência)
; cada byte de $0400 XOR a chave de $0030 → $0500, com terminador $00

        .org $0200

        lda #$00
        sta $0032       ; i = 0
laco:   lda $0032       ; i
        cmp $0031       ; compara com n
        jc fora         ; i >= n → acabou a mensagem
        tax             ; X = i
        lda $0400,x     ; o byte em claro
        xor $0030       ; A = claro XOR chave
        sta $0500,x     ; cifrado[i] = A (o XOR não mexe em X)
        inc $0032       ; i++
        jmp laco
fora:   ldx $0032       ; X = n
        lda #$00
        sta $0500,x     ; o terminador logo depois do último cifrado
        hlt
