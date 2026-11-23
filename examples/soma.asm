; soma.asm — soma 2 + 3 e grava o resultado em $0300
; primeiro cliente do assembler: os bytes devem bater com tests/soma.test.ts

        .org $0200

        lda #$02        ; A = 2
        add #$03        ; A = A + 3 = 5
        sta $0300       ; M[$0300] = A
        hlt             ; para a máquina
