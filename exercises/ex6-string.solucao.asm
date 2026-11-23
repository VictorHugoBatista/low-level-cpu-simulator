; ex6 — string no terminal (solução de referência)

        .org $0200
        .equ ptr, $30

        lda #$00
        sta ptr         ; ponteiro = $0400 (baixo)
        lda #$04
        sta $31         ; ponteiro = $0400 (alto)
        ldy #$00        ; Y=0: (ptr),Y lê o byte apontado

loop:   lda (ptr),y     ; A = M[ponteiro]
        jz fim          ; $00 encerra a string
        sta $e800       ; escrever no terminal é imprimir
        inc ptr         ; avança o ponteiro
        jmp loop
fim:    hlt
