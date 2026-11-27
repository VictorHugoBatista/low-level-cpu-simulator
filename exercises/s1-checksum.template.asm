; s1 — checksum XOR: detecte um byte fora do lugar
;
; A RAM já vem com um bloco de 8 bytes em $0400..$0407. Calcule o checksum do
; bloco — o XOR de todos os bytes, um a um — e grave em $0030.
;
; A mesma lógica em C:
;
;     unsigned char checksum = 0;
;     for (int i = 0; i < 8; i++) {
;         checksum = checksum ^ bloco[i];
;     }
;
; O XOR é a redundância mais barata que existe: qualquer byte que mudar no
; caminho muda o valor final — é assim que memória e disco detectam erro.
; Dois casos a favor da lição: dois bytes iguais se cancelam (x XOR x = 0),
; e um bloco todo de zeros vale zero.
;
; instruções que você precisa: LDA/STA, XOR, CMP, JC, TAX, os modos indexados
; $0400,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
