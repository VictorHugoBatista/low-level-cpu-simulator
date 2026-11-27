; d3 — árvore binária de busca (solução de referência)
; desce da raiz comparando: menor desce à esquerda, maior desce à direita

        .org $0200

laco:   lda $0030       ; o nó corrente
        cmp #$ff        ; $ff = "não existe" — o caminho acabou
        jz ausente
        shl             ; A = 2 × nó
        add $0030       ; + nó → A = 3 × nó (cada nó ocupa 3 bytes)
        tax             ; X = o deslocamento do nó
        lda $0031       ; o valor procurado
        cmp $0400,x     ; compara com o valor do nó
        jz achou
        jc direita      ; alvo > valor → desce à direita
        lda $0401,x     ; alvo < valor → desce à esquerda
        sta $0030
        jmp laco
direita:
        lda $0402,x
        sta $0030
        jmp laco
achou:
        lda #$01
        sta $0032
        hlt
ausente:
        lda #$00
        sta $0032
        hlt
