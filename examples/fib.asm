; fib.asm — Fibonacci rolando em $0300/$0301: 8 iterações, fib(9) = 34 em $0301
; o contador vive na página zero e o DEC o decrementa direto na memória

        .org $0200

        lda #$00
        sta $0300       ; x = fib(0)
        lda #$01
        sta $0301       ; y = fib(1)
        lda #$08
        sta $10         ; contador de iterações restantes

loop:
        lda $0300       ; A = x
        add $0301       ; A = x + y
        tay             ; guarda t = x + y em Y
        lda $0301       ; A = y
        sta $0300       ; x = y
        tya             ; A = t
        sta $0301       ; y = t
        dec $10         ; contador-1 (Z liga quando chega a 0)
        jnz loop        ; repete enquanto contador > 0
        hlt             ; $0301 = fib(9) = 34
