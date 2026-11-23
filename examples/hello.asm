; hello.asm — o PROGRAMA que mora no setor 1 do disco (entrada em $0300)
; imprime "Ola, AK-8!" no terminal ($E800) e para. Agora com loop de verdade:
; o ponteiro da string mora na página zero ($30/$31) e caminha com INC.
; (a string não pode cruzar uma página de 256 bytes — o INC só carrega o byte baixo)

        .org $0300

        .equ ptr, $30

        lda #<msg       ; byte baixo do endereço da string → ponteiro
        sta ptr
        lda #>msg       ; byte alto
        sta $31
        ldy #$00        ; (ptr),Y com Y=0 lê o byte apontado
loop:
        lda (ptr),y     ; A = M[ponteiro]
        jz fim          ; $00 encerra a string
        sta $e800       ; imprime o caractere
        inc ptr         ; avança o ponteiro
        jmp loop
fim:    hlt

msg:    .ascii "Ola, AK-8!\n"
        .db 0
