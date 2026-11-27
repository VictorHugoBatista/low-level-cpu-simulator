; d4 — BFS (solução de referência)
; marca em visited ($0500..$0507) todo nó alcançável a partir da origem

        .org $0200

        lda #$00
        sta $0031       ; head = 0
        sta $0032       ; tail = 0
        sta $0033       ; v = 0
zera:
        lda #$00
        ldx $0033       ; X = v
        sta $0500,x     ; visited[v] = 0
        inc $0033
        lda $0033
        cmp #$08
        jnc zera        ; v < 8 → zera o próximo

        ldx $0030       ; X = origem
        lda #$01
        sta $0500,x     ; visited[origem] = 1
        lda #$00
        tax
        lda $0030
        sta $0508,x     ; fila[tail] = origem (o tail é 0)
        inc $0032       ; tail = 1

laco:
        lda $0031       ; head
        cmp $0032       ; tail
        jz fim          ; head == tail → a fila esvaziou: BFS acabou
        lda $0031
        tax
        lda $0508,x     ; u = fila[head]
        sta $0034
        inc $0031       ; head = head + 1
        lda #$00
        sta $0033       ; v = 0
interno:
        lda $0034       ; u
        shl
        shl
        shl             ; A = 8 × u
        add $0033       ; + v → A = 8*u + v
        tax
        lda $0400,x     ; matriz[u][v]
        jz proximo      ; sem aresta u→v → próximo v
        lda $0033
        tax             ; X = v
        lda $0500,x     ; visited[v]
        jz visita       ; ainda não visitado → visita agora
proximo:
        inc $0033
        lda $0033
        cmp #$08
        jnc interno     ; v < 8 → próximo vizinho
        jmp laco        ; acabaram os vizinhos de u → volta ao principal
visita:
        lda #$01
        sta $0500,x     ; visited[v] = 1
        lda $0032       ; tail
        tax
        lda $0033
        sta $0508,x     ; fila[tail] = v
        inc $0032       ; tail = tail + 1
        jmp proximo
fim:    hlt
