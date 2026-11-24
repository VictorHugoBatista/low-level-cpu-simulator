; ex1 — soma: leia os dois valores pre-colocados e grave a soma
;
; A RAM já vem com um valor em $0300 e outro em $0301 (o verificador troca os
; valores a cada teste). Seu programa tem que somar os dois e gravar em $0302.
; Atenção: a MOS-6508 é de 8 bits — a soma "dá a volta" quando passa de 255.
;
; instruções que você precisa: LDA (carrega), ADD (soma), STA (grava), HLT (para)

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
