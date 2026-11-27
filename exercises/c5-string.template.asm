; c5 — string: percorra, teste caractere, conte
;
; A RAM já vem com uma string em $0400, terminada em $00 (o verificador
; troca a string a cada teste). Conte quantos caracteres 'a' ($61) ela tem
; e grave o total em $0032 — NÃO em $0030/$0031: esses dois bytes são o
; ponteiro da string (baixo e alto), e o contador precisaria de outro
; endereço para não atravessar o ponteiro.
;
; A mesma lógica em C:
;
;     int count = 0;      // mora em $0032
;     char *p = s;
;     while (*p != '\0') {
;         if (*p == 'a') count++;
;         p++;
;     }
;
; Aqui o while não tem contador: quem decide o fim é o $00 no fim da
; string. E o corpo tem um if dentro do while — compare o byte apontado
; com $61 e conte só quando for igual. Cuidado: o ponteiro avança EM
; TODA volta, contando ou não.
;
; O programa abaixo já prepara o ponteiro ($30/$31), o Y e o contador;
; falta você escrever o laço a partir do rótulo loop.
;
; instruções que você precisa: LDA (ptr),Y, JZ, CMP #imediato, JNZ
; (desvia se Z=0), INC, JMP, HLT

        .org $0200
        .equ ptr, $30

        lda #$00
        sta ptr         ; ponteiro = $0400 (baixo)
        lda #$04
        sta $31         ; ponteiro = $0400 (alto)
        ldy #$00        ; Y=0: (ptr),Y lê o byte apontado
        lda #$00
        sta $0032       ; count = 0

loop:   hlt             ; TODO: leia o byte apontado (lda (ptr),y),
                        ; desvie no $00 (jz fim), compare com $61,
                        ; conte com inc $0032 quando igual, avance
                        ; o ponteiro em TODA volta e volte ao loop
