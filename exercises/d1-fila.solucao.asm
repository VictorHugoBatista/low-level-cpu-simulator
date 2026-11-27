; d1 — fila circular (solução de referência)
; despeja a fila em $0500 (head $0030, tail $0031) para $0400 em diante

        .org $0200

laco:   lda $0030       ; head
        cmp $0031       ; tail
        jz fim          ; head == tail → a fila esvaziou
        lda $0030
        tax             ; X = head
        lda $0500,x     ; o byte da frente da fila
        ldx $0032       ; X = o contador da saída
        sta $0400,x     ; saída[contador] = frente
        inc $0032       ; próxima posição da saída
        inc $0030       ; head anda
        lda $0030
        cmp #$08        ; head chegou ao fim do buffer?
        jnc laco        ; ainda não: segue o laço
        lda #$00        ; chegou: volta a 0 — a volta do buffer
        sta $0030
        jmp laco
fim:    hlt             ; o que saiu está em $0400 em diante
