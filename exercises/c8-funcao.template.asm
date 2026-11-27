; c8 — desafio final: a função inteira, com tudo junto
;
; A RAM já vem com o ponteiro para o array em $30/$31 e com n em $0032.
; O array tem n structs Aluno em sequência, cada um com 2 bytes
; (nota, peso). O programa principal abaixo (pronto, não mexa) chama a
; função e grava o retorno em $0350. Falta você escrever a função
; somanotas: ela recebe o ponteiro e n, devolve a soma das notas em A
; e termina com RTS.
;
; A mesma lógica em C:
;
;     struct Aluno {
;         int nota;    // base + 0
;         int peso;    // base + 1
;     };
;
;     // contrato: ponteiro v em $30/$31, n em $0032, retorno em A
;     int soma_notas(struct Aluno *v, int n) {
;         int s = 0;   // rascunho em $0033
;         int i = 0;   // rascunho em $0034
;         while (i < n) {
;             s = s + v[i].nota;
;             i = i + 1;
;         }
;         return s;
;     }
;
; Ela junta tudo o que a trilha ensinou: while (c4), struct acessada
; por ponteiro (c7), array percorrido (c6) e chamada de função (ex5).
; O endereço de v[i].nota é base + 2*i — cada struct ocupa 2 bytes.
; SHL desloca A um bit à esquerda (A ← A×2); TAY copia A para Y; e o
; modo indireto lda ($30),y lê o byte apontado com o deslocamento Y.
;
; OBSERVE no painel de barramentos: o JSR grava o retorno na stack —
; dois writes em $01xx — e o RTS lê de volta.
;
; instruções que você precisa: LDA/STA, CMP, JC, SHL, TAY,
; LDA ($30),Y, ADD, INC, JMP, RTS (e LDA de volta antes do RTS)

        .org $0200

        jsr somanotas   ; chama a função
        sta $0350       ; o retorno sai em A
        hlt

somanotas:  rts         ; TODO: complete a função ANTES do rts —
                        ; zere os rascunhos $0033 (s) e $0034 (i),
                        ; teste i < n no topo, calcule 2*i com SHL,
                        ; leia v[i].nota com lda ($30),y, some em s
                        ; e devolva s em A antes do RTS
