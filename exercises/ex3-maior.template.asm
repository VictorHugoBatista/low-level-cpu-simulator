; ex3 — o maior de dois: leia os dois valores e grave o maior
;
; A RAM já vem com um valor em $0300 e outro em $0301. Grave o maior deles
; em $0302 (se forem iguais, qualquer um serve — é o mesmo valor).
;
; A dica da máquina: CMP calcula A − M só para acender as flags — A não
; muda. C=1 significa "não houve borrow", ou seja, A ≥ M.
;
; instruções que você precisa: LDA, CMP, JC, STA, HLT

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
