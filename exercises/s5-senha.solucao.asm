; s5 — autenticação (solução de referência)
; acumula as diferenças num OR e só decide no fim: sempre 8 voltas do laço

        .org $0200

        lda #$00
        sta $0031       ; dif = 0
        sta $0032       ; i = 0
laco:   lda $0032       ; i
        cmp #$08
        jc fim          ; i >= 8 → comparou os 8 bytes
        tax             ; X = i
        lda $0400,x     ; o byte da senha armazenada
        xor $0410,x     ; $00 se o byte da tentativa é igual
        ora $0031       ; acumula: qualquer diferença sobrevive ao OR
        sta $0031
        inc $0032       ; i++
        jmp laco
fim:    lda $0031       ; o acumulador de diferenças
        jnz negado      ; Z do próprio LDA: 0 = nenhum byte diferente
        lda #$01
        sta $0030       ; a tentativa bate com a senha
        hlt
negado: lda #$00
        sta $0030
        hlt
