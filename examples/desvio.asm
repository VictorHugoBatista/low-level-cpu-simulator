; desvio.asm — desvios condicionais do M1
; SUB que zera A liga a flag Z; o JZ desvia para "igual" e grava 1 em $0300

        .org $0200

        lda #$05
        sub #$05        ; A = 0 → Z = 1
        jz igual        ; desvia para frente
        lda #$00        ; (nunca executa)
        sta $0300
        jmp fim
igual:  lda #$01
        sta $0300       ; M[$0300] = 1
fim:    hlt
