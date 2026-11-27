; s6 — desafio final (solução de referência)
; lê o setor 1, soma os 16 dados e só os usa se o checksum bater

        .org $0200

        lda #$01
        sta $f001       ; lba = 1
        lda #$00
        sta $f002       ; endereço $0400 (baixo)...
        lda #$04
        sta $f003       ; ...(alto)
        lda #$01
        sta $f000       ; dispara: o setor inteiro chega em $0400..$04ff

        lda #$00
        sta $0031       ; soma = 0
        sta $0032       ; i = 0
soma:   lda $0032       ; i
        cmp #$10        ; 16 bytes de dados
        jc confere
        tax             ; X = i
        lda $0400,x     ; o byte do setor
        add $0031       ; soma += dado (a volta de 8 bits é o módulo 256)
        sta $0031
        inc $0032       ; i++
        jmp soma
confere:
        lda $0410       ; o checksum gravado no setor
        cmp $0031       ; ...bater com a soma?
        jz valida
        lda #$00        ; não bate: rejeita — não confie no que veio do disco
        sta $0030
        hlt
valida: lda #$01
        sta $0030       ; integridade confirmada
        lda #$00
        sta $0032       ; i = 0
copia:  lda $0032
        cmp #$10
        jc fim
        tax             ; X = i
        lda $0400,x     ; o dado verificado
        sta $0500,x     ; destino[i] = dado
        inc $0032       ; i++
        jmp copia
fim:    hlt
