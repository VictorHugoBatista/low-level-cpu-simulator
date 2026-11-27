; s4 — buffer overflow: copie respeitando o limite
;
; A RAM já vem com: uma string terminada em $00 em $0400 (pode ser mais longa
; do que o destino!) e um canário $42 em $0508 — o primeiro byte DEPOIS do
; buffer de destino, que é $0500..$0507 (8 bytes: 7 úteis + terminador).
;
; Copie a string para o buffer de $0500 — no máximo 7 bytes + o $00 final.
; Se a fonte for maior que isso, trunque. O canário precisa sobreviver
; intocado: quem escreve além do buffer corrompe o que o vizinho guardava.
;
; A mesma lógica em C:
;
;     char destino[8];                 // 7 úteis + terminador
;     int i = 0;
;     while (fonte[i] != '\0' && i < 7) {   // o teste do LIMITE no topo
;         destino[i] = fonte[i];
;         i = i + 1;
;     }
;     destino[i] = '\0';
;
; Este é o esqueleto de todo estouro de buffer: a cópia que confia no
; terminador (ou no tamanho) que vem de fora. O teste confere o buffer E o
; canário — o que sobrescreveu $0508 falha.
;
; instruções que você precisa: LDA/STA, CMP, JC, JZ, TAX, os modos indexados
; $0400,X e $0500,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
