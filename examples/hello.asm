; hello.asm — o PROGRAMA que mora no setor 1 do disco (entrada em $0300)
; imprime "Ola, AK-8!" no terminal ($E800) e para.
; Sem X/Y no núcleo ainda, o eco é desenrolado — no M5 isto vira um loop com indexação.

        .org $0300

        lda #'O'
        sta $e800
        lda #'l'
        sta $e800
        lda #'a'
        sta $e800
        lda #','
        sta $e800
        lda #' '
        sta $e800
        lda #'A'
        sta $e800
        lda #'K'
        sta $e800
        lda #'-'
        sta $e800
        lda #'8'
        sta $e800
        lda #'!'
        sta $e800
        lda #'\n'
        sta $e800
        hlt
