; ex7 — DESAFIO: Fibonacci
;
; A RAM já vem com n em $0300. Calcule fib(n) — fib(0)=0, fib(1)=1,
; fib(n) = fib(n−1) + fib(n−2) — e grave em $0301. Valores de teste ficam
; dentro de um byte (fib(12)=144 é o maior que cabe).
;
; Você vai precisar de tudo: loop com contador, um ponteiro de estado na
; página zero e flags. Uma boa forma: três rascunhos — $0030 = contador,
; $0031 = b (o próximo), $0032 = temporário — e o resultado crescendo em
; $0301. A cada volta: t = a + b; a = b; b = t.
;
; Se travar, revele as dicas na ordem. O painel de barramentos mostra cada
; micro-operação — acompanhar o loop clock a clock é a melhor depuração.

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
