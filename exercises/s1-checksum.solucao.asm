; s1 — checksum XOR (solução de referência)
; XOR acumulado dos 8 bytes de $0400..$0407

        .org $0200

        lda #$00
        sta $0030       ; checksum = 0
        sta $0031       ; i = 0
laco:   lda $0031       ; i
        cmp #$08
        jc fim          ; i >= 8 → o bloco acabou
        tax             ; X = i
        lda $0400,x     ; A = bloco[i]
        xor $0030       ; A = checksum XOR bloco[i]
        sta $0030       ; checksum = A
        inc $0031       ; i++
        jmp laco
fim:    hlt             ; o checksum ficou em $0030
