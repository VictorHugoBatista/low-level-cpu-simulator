; c1 — variáveis (solução de referência)
; x = x + 1: lê de $0300, soma 1 e grava de volta em $0300

        .org $0200

        lda $0300       ; A = x (lê a variável)
        add #$01        ; A = x + 1 (calcula o lado direito)
        sta $0300       ; x = A (sobrescreve a variável)
        hlt
