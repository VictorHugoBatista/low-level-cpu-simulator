; c6 — array: a[i] é um endereço calculado
;
; A RAM já vem com um array de 8 bytes em $0400..$0407 (o verificador
; troca os valores a cada teste). Some todos os elementos e grave o
; total em $0030.
;
; A mesma lógica em C:
;
;     int a[8];    // mora em $0400..$0407
;     int s = 0;   // mora em $0030
;     int i = 0;   // mora em $0031
;     while (i < 8) {
;         s = s + a[i];
;         i = i + 1;
;     }
;
; "a[i]" não existe como instrução: existe o modo indexado — o endereço
; efetivo é base + X. Você põe o índice em X (TAX copia A para X) e
; escreve lda $0400,x / add $0400,x: o endereço deslocado pelo X.
; E lembre do c2: CMP não mexe em A — depois do teste do while, A ainda
; é i, pronto para virar índice.
;
; instruções que você precisa: LDA/STA, CMP #imediato, JC (desvia se
; C=1), TAX, ADD $hhhh,X (o modo indexado), INC, JMP, HLT

        .org $0200

        hlt             ; TODO: zere s ($0030) e i ($0031) antes do
                        ; laço; no topo, teste i < 8 com CMP #$08;
                        ; no corpo, some a[i] com o modo indexado
                        ; ($0400,X) e incremente i
