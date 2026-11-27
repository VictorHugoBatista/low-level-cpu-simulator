; d4 — desafio final: BFS — marque todo nó alcançável
;
; Um grafo de 8 nós (0..7) está na matriz de adjacência em $0400: 8 bytes
; por linha, e a célula matriz[u][v] — o byte em $0400 + 8*u + v — vale 1
; quando existe aresta de u para v. O nó de partida está em $0030.
;
; Marque em $0500..$0507 (visited) os nós alcançáveis a partir da origem:
; visited[origem] = 1 e visited[v] = 1 para todo v alcançável. O BFS usa
; a fila do nível 1 — em $0508..$050F, com head em $0031 e tail em $0032,
; agora sem dar volta: cada nó entra na fila no máximo uma vez (o visited
; marca ANTES de enfileirar), então 8 posições bastam. Use $0033 para v e
; $0034 para u.
;
; A mesma lógica em C:
;
;     head = tail = 0;
;     visited[origem] = 1;
;     fila[tail++] = origem;
;     while (head != tail) {              // enquanto a fila tiver gente
;         int u = fila[head++];           // a onda avança em anéis
;         for (int v = 0; v < 8; v++) {
;             if (matriz[u][v] == 1 && !visited[v]) {
;                 visited[v] = 1;
;                 fila[tail++] = v;
;             }
;         }
;     }
;
; Dá para ver a onda no painel de memória: rode passo a passo e acompanhe
; visited acendendo em anéis em volta da origem. O 8*u da linha da matriz
; sai de três SHL — multiplicar por 2 três vezes é multiplicar por 8.
;
; instruções que você precisa: tudo do nível 1 (fila com head/tail), mais
; SHL para o 8*u, TAX, CMP, JZ/JNZ/JNC/JC, INC, DEC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
