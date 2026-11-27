; s4 — buffer overflow (solução de referência)
; copia com o teste do limite no topo: no máximo 7 bytes + terminador

        .org $0200

        lda #$00
        sta $0030       ; i = 0
laco:   lda $0030       ; i
        cmp #$07        ; o buffer só tem 7 posições úteis
        jc encheu       ; i >= 7 → não cabe mais nada: trunca
        tax             ; X = i
        lda $0400,x     ; o byte da fonte
        jz termina      ; $00: a fonte acabou — grava o terminador e para
        sta $0500,x     ; destino[i] = byte
        inc $0030       ; i++
        jmp laco
termina: sta $0500,x    ; A já é $00 — o terminador na posição i
        hlt
encheu: lda #$00
        sta $0507       ; trunca: o terminador na última posição do buffer
        hlt
