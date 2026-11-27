; c4 — while: teste no topo, corpo, e a volta
;
; A mesma lógica em C:
;
;     int s = 0;          // soma, mora em $0030
;     int i = 0;          // contador, mora em $0031
;     while (i < n) {     // n é a entrada, em $0300
;         s = s + i;
;         i = i + 1;
;     }
;
; O while vira três peças: o teste no topo (ler i, comparar com n,
; desviar para fora se i >= n), o corpo, e um JMP de volta ao teste
; no fim do corpo. Sem o JMP, o while vira um if que roda uma vez.
;
; instruções que você precisa: LDA/STA, ADD, CMP, JC (desvia se C=1),
; INC (incrementa um byte direto na memória), JMP, HLT.

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
