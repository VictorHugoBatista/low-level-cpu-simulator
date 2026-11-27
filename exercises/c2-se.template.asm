; c2 — if / else: quem decide é a flag, não o programador
;
; A mesma lógica em C:
;
;     int classe;
;     if (x >= 100) {
;         classe = 1;
;     } else {
;         classe = 0;
;     }
;
; No hardware não existe "if": existe CMP, que compara A com um valor
; SEM mudar A e deixa o veredito nas flags — e um desvio condicional,
; que só desvia se a flag mandar. C=1 significa "A >= operando"
; (não houve borrow); C=0 significa "A < operando".
;
; instruções que você precisa: LDA, CMP #imediato, JNC (desvia se C=0),
; LDA #imediato, STA, HLT — e rótulos para os dois caminhos.

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
