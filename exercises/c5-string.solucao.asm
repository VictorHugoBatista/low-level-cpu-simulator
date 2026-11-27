; c5 — string (solução de referência)
; conta os 'a' ($61) da string em $0400 — contador em $0032, longe do
; ponteiro ($30/$31), que é outro par de bytes da página zero

        .org $0200
        .equ ptr, $30

        lda #$00
        sta ptr         ; ponteiro = $0400 (baixo)
        lda #$04
        sta $31         ; ponteiro = $0400 (alto)
        ldy #$00        ; Y=0: (ptr),Y lê o byte apontado
        lda #$00
        sta $0032       ; count = 0

loop:   lda (ptr),y     ; A = *p
        jz fim          ; $00 encerra a string
        cmp #$61        ; compara com 'a' ($61)
        jnz avanca      ; não é 'a' → só avança
        inc $0032       ; é 'a' → count++
avanca: inc ptr         ; p++ — em toda volta
        jmp loop
fim:    hlt             ; a resposta fica em $0032
