; ex6 — string no terminal: percorra uma string que não é sua
;
; A RAM já vem com uma string em $0400, terminada em $00 (o verificador
; troca a string a cada teste). Percorra os bytes e imprima cada caractere
; no terminal escrevendo em $E800 — no mapa de memória, escrever lá é
; imprimir. Quando encontrar o $00, pare.
;
; O ponteiro mora em DOIS bytes da página zero ($30 = baixo, $31 = alto),
; e o modo indireto lê "o byte apontado": lda (ptr),y — com Y=0, lê o byte
; do próprio ponteiro. INC ptr avança o byte baixo (só vale dentro de uma
; página de 256 bytes — e $0400 está longe da borda).
;
; instruções que você precisa: LDA, STA, LDA (ptr),Y, INC, JZ, JMP, HLT

        .org $0200
        .equ ptr, $30

        lda #$00
        sta ptr         ; ponteiro = $0400 (baixo)
        lda #$04
        sta $31         ; ponteiro = $0400 (alto)
        ldy #$00        ; Y=0: (ptr),Y lê o byte apontado

loop:   hlt             ; TODO: leia o byte apontado (lda (ptr),y),
                        ; desvie se for $00, imprima com sta $e800,
                        ; avance com inc ptr e volte ao loop
