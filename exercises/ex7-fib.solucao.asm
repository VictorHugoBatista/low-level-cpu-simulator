; ex7 — Fibonacci (solução de referência)

        .org $0200

        lda #$00
        sta $0301       ; a = fib(0) = 0 (o resultado)
        lda #$01
        sta $0031       ; b = 1
        lda $0300
        sta $0030       ; contador = n

loop:   lda $0030
        jz fim          ; contador chegou a zero: a = fib(n)
        lda $0301       ; t = a + b
        add $0031
        sta $0032
        lda $0031       ; a = b
        sta $0301
        lda $0032       ; b = t
        sta $0031
        dec $0030
        jmp loop
fim:    hlt
