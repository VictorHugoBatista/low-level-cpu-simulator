; s5 — autenticação: compare sem vazar
;
; A RAM já vem com: a senha armazenada de 8 bytes em $0400..$0407 e a
; tentativa de 8 bytes em $0410..$0417. Grave 1 em $0030 se a tentativa é
; IGUAL à senha, byte a byte, ou 0 se algum byte difere.
;
; A mesma lógica em C:
;
;     // senha em $0400, tentativa em $0410, resultado em $0030
;     unsigned char dif = 0;
;     for (int i = 0; i < 8; i++) {
;         dif = dif | (senha[i] ^ tentativa[i]);   // acumula, sem desviar
;     }
;     resultado = (dif == 0);   // só decide no FIM
;
; A tentação é sair no primeiro byte diferente — mas o loop que sai cedo
; roda MENOS CICLOS quanto mais no começo está o erro. Quem medir os ciclos
; adivinha quantos bytes acertou, byte a byte. A comparação que olha os 8
; bytes sempre leva o mesmo tempo: não tem nada para vazar. Rode as duas
; versões e compare o marcador de ciclos do painel de desempenho.
;
; Na prática autentica-se o HASH da senha, nunca a senha em claro — o s1
; mostrou como calculá-lo.
;
; instruções que você precisa: LDA/STA, XOR, ORA, CMP, JC, JNZ, TAX, os
; modos indexados $0400,X e $0410,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
