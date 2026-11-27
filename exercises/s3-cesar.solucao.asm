; s3 — cifra de César (solução de referência)
; soma a chave e dá a volta no alfabeto quando passa de 'Z'

        .org $0200

        lda #$00
        sta $0032       ; i = 0
laco:   lda $0032       ; i
        cmp $0031       ; compara com n
        jc fora         ; i >= n → acabou a mensagem
        tax             ; X = i
        lda $0400,x     ; a letra ($41..$5a)
        add $0030       ; + chave
        cmp #$5b        ; passou de 'Z' ($5a)?
        jnc pronto      ; não: já é letra
        sub #$1a        ; sim: −26 dá a volta ao alfabeto
pronto: sta $0500,x
        inc $0032       ; i++
        jmp laco
fora:   ldx $0032       ; X = n
        lda #$00
        sta $0500,x     ; o terminador logo depois do último cifrado
        hlt
