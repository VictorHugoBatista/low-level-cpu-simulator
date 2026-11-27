; c4 — while (solução de referência)
; soma de 0..n-1: while (i < n) { s = s + i; i = i + 1; }

        .org $0200

        lda #$00
        sta $0030       ; s = 0
        sta $0031       ; i = 0
loop:
        lda $0031       ; A = i
        cmp $0300       ; compara i com n
        jc fim          ; C=1 → i >= n → sai do while
        lda $0030       ; corpo: s = s + i
        add $0031
        sta $0030
        inc $0031       ; i = i + 1, direto na memória
        jmp loop        ; volta ao teste
fim:    hlt             ; a resposta fica em $0030 (a variável s)
