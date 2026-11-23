; ex5 — função dobra: a mesma rotina chamada duas vezes
;
; A RAM já vem com um valor em $0300 e outro em $0302. O programa principal
; abaixo (pronto) chama a função dobra para cada um e grava os resultados
; em $0301 e $0303. Falta você escrever a função!
;
; JSR empilha o endereço de retorno na stack ($0100+SP) e desvia; RTS
; desempilha e volta. A função recebe o valor em A e devolve o dobro em A.
; Um rascunho na página zero ($0030) resolve: STA $0030 guarda A para a
; própria função poder somar A com A.
;
; OBSERVE no painel de barramentos: o JSR grava o retorno na stack — dois
; writes em $01xx — e o RTS lê de volta. É assim que "chamar e voltar" existe.

        .org $0200

        lda $0300
        jsr dobra       ; chama a função
        sta $0301
        lda $0302
        jsr dobra       ; a MESMA rotina, de novo
        sta $0303
        hlt

dobra:  rts             ; TODO: complete a função ANTES do rts
