; s3 — cifra de César: a aritmética modular do espaço da mensagem
;
; A RAM já vem com: a chave (o deslocamento, 0 a 25) em $0030 e a mensagem de
; n bytes em $0400 — só MAIÚSCULAS de A a Z, com n em $0031. Cifre para $0500
; em diante, com um $00 terminador logo depois do último byte.
;
; A mesma lógica em C:
;
;     // chave em $0030, n em $0031, claro em $0400, cifrado em $0500
;     for (int i = 0; i < n; i++) {
;         int c = claro[i] + chave;        // 'A' é $41, 'Z' é $5a
;         if (c > 'Z') {
;             c = c - 26;                  // a volta ao alfabeto
;         }
;         cifrado[i] = c;
;     }
;     cifrado[n] = '\0';
;
; O alfabeto é um espaço fechado: 'Z' + 1 volta para 'A' — a aritmética é
; módulo 26 dentro da faixa $41..$5a. E a lição de segurança: com só 25
; chaves possíveis, um invasor testa todas em segundos — o tamanho do
; espaço de chaves é o que sustenta uma cifra.
;
; instruções que você precisa: LDA/STA, ADD, SUB, CMP, JC/JNC, JZ, TAX, os
; modos indexados $0400,X e $0500,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
