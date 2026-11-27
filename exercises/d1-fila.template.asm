; d1 — fila circular: desenfileire tudo, na ordem
;
; A RAM já vem com o buffer circular em $0500..$0507 (8 posições), o head
; em $0030 e o tail em $0031 — índices de 0 a 7. head aponta para a frente
; da fila (de onde os bytes saem); tail fica logo atrás do último byte
; (onde eles entram). head == tail significa fila vazia. Os índices andam
; para frente e VOLTAM A 0 ao passar de 7 — é a volta do buffer circular.
;
; Seu programa: desenfileire todos os elementos, na ordem FIFO, gravando
; cada um em $0400 em diante (use $0032 como contador da saída). Um dos
; testes tem uma fila que deu a volta no buffer: head = 6, tail = 2.
;
; A mesma lógica em C:
;
;     // q em $0500, head em $0030, tail em $0031, saída em $0400
;     while (head != tail) {
;         out[n++] = q[head];        // sai da frente
;         head = (head + 1) % 8;     // a volta do buffer circular
;     }
;
; Na máquina não existe "fila": existe um array e dois índices que seguem
; uma convenção. Toda fila de impressão, buffer de teclado e agendador de
; processos é isto — array + head + tail + a volta do módulo 8.
;
; instruções que você precisa: LDA/STA, CMP, JZ, os modos indexados
; $0500,X e $0400,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
