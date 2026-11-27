; d3 — árvore binária de busca: encontre o valor descendo da raiz
;
; A árvore mora em $0400, 3 bytes por nó: valor, índice do filho esquerdo,
; índice do filho direito — e $FF significa "não existe". A propriedade da
; busca: tudo à esquerda do nó é menor que ele, tudo à direita é maior.
;
; A RAM já vem com: o índice do nó raiz em $0030 e o valor procurado em
; $0031. Grave 1 em $0032 se o valor existe na árvore, ou 0 se o caminho
; acabou sem encontrá-lo.
;
; A mesma lógica em C:
;
;     struct No { int valor; int esq; int dir; };  // nó i em $0400 + 3*i
;
;     int atual = raiz;
;     int achou = 0;
;     while (atual != 0xff && !achou) {
;         if (alvo == no[atual].valor) {
;             achou = 1;
;         } else if (alvo < no[atual].valor) {
;             atual = no[atual].esq;   // menor: desce à esquerda
;         } else {
;             atual = no[atual].dir;   // maior: desce à direita
;         }
;     }
;
; Seguir ponteiro aqui é aritmética: o nó i começa em $0400 + 3*i — e
; 3*i é i + 2*i, com o 2*i saindo de um SHL. Comparado com a varredura do
; c6, que olha TODOS os elementos, a busca na árvore olha um nó por nível.
;
; instruções que você precisa: LDA/STA, CMP, JZ, JC, SHL, ADD, TAX, os
; modos indexados $0400,X / $0401,X / $0402,X e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
