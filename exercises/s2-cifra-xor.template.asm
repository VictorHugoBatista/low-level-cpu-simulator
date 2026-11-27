; s2 — cifra XOR: esconda a mensagem
;
; A RAM já vem com: a chave de 1 byte em $0030, a mensagem de n bytes em $0400
; (n em $0031). Cifre a mensagem com XOR — cada byte claro XOR a chave — e
; grave em $0500 em diante, com um $00 terminador logo depois do último byte.
;
; A mesma lógica em C:
;
;     // chave em $0030, n em $0031, claro em $0400, cifrado em $0500
;     for (int i = 0; i < n; i++) {
;         cifrado[i] = claro[i] ^ chave;
;     }
;     cifrado[n] = '\0';
;
; Duas pérolas: XOR é involutivo — aplicar de novo com a mesma chave devolve
; o original — e o cifrado não tem terminador confiável (o $00 da mensagem
; vira outro byte), então o tamanho viaja junto com a cifra. É por isso que
; o exercício recebe n pronto.
;
; instruções que você precisa: LDA/STA, XOR, CMP, JC, TAX, os modos indexados
; $0400,X e $0500,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
