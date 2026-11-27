; c1 — variáveis: o que é "x = x + 1" para a máquina
;
; Em C, uma variável mora em um endereço de memória. Aqui a variável x
; é o byte em $0300 — ele já está lá: é a entrada do programa.
;
; A mesma lógica em C:
;
;     x = x + 1;      // lê x, soma 1, sobrescreve x
;
; A máquina não tem essa frase pronta: são três instruções separadas —
; uma lê a variável, uma calcula e uma grava de volta no MESMO endereço.
; "=" em C não é equação da matemática: é calcula o lado direito e
; sobrescreve.
;
; instruções que você precisa: LDA, ADD #imediato, STA, HLT

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
