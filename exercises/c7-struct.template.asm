; c7 — struct: campo é um deslocamento fixo a partir da base
;
; A RAM já vem com dois structs Ponto: p[0] em $0400 e p[1] em $0403
; (x, y e soma de cada um; o verificador troca os valores a cada teste).
; Para cada struct, calcule soma = x + y e grave no próprio campo soma.
;
; A mesma lógica em C:
;
;     struct Ponto {
;         int x;      // base + 0
;         int y;      // base + 1
;         int soma;   // base + 2
;     };
;
;     struct Ponto p[2];   // p[0] em $0400, p[1] em $0403
;
;     p[0].soma = p[0].x + p[0].y;
;     p[1].soma = p[1].x + p[1].y;
;
; Um struct é um bloco de bytes com layout fixo: cada campo fica em
; "base + offset". Acessar p[0].x é ler $0400; acessar p[1].y é ler
; $0404 — a base andou 3 bytes (o tamanho do struct), os offsets
; continuam os mesmos.
;
; instruções que você precisa: LDA, ADD, STA, HLT

        .org $0200

        hlt             ; TODO: duas somas — uma por struct:
                        ; p[0].soma = p[0].x + p[0].y e
                        ; p[1].soma = p[1].x + p[1].y
