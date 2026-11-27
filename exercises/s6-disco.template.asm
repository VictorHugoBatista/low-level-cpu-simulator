; s6 — desafio final: confie no setor só depois de verificar
;
; O setor 1 do disco tem 16 bytes de dados nos offsets 0..15 e um checksum
; no offset 16 — a soma dos dados, que dá a volta em módulo 256 (a mesma
; volta do ADD de 8 bits). Dados que passaram do caminho sem corromper somam
; exatamente o checksum que viajou junto.
;
; Seu programa, em três atos:
;
;   1. leia o setor 1 para $0400 — o controlador é I/O programado em $F000:
;      escreva o LBA em $F001, o endereço em $F002 (baixo) e $F003 (alto),
;      e dispare escrevendo 1 em $F000 (o setor inteiro chega de uma vez);
;   2. calcule a soma dos 16 primeiros bytes de $0400 e compare com o byte
;      em $0410;
;   3. se bater, grave 1 em $0030 e copie os 16 dados para $0500..$050F;
;      se NÃO bater, grave 0 em $0030 e NÃO copie nada — dados corrompidos
;      não entram no sistema.
;
; A mesma lógica em C:
;
;     ler_disco(1, $0400);            // o controlador copia o setor todo
;     unsigned char soma = 0;
;     for (int i = 0; i < 16; i++) {
;         soma = soma + dados[i];     // a volta de 8 bits é o módulo 256
;     }
;     if (soma == dados_checksum) {   // o offset 16 do setor
;         resultado = 1;
;         copiar(dados, destino, 16);
;     } else {
;         resultado = 0;              // detectou: rejeita e segue de pé
;     }
;
; Nota de honestidade intelectual: soma mod 256 detecta erro acidental, mas
; um atacante que conhece o esquema ajusta os dados e o checksum juntos —
; para isso existe checksum com chave (MAC) e hash criptográfico.
;
; instruções que você precisa: tudo o que a trilha ensinou — os registradores
; $F000..$F003 do disco, laço com contador, ADD, CMP, JZ/JNZ, TAX, os modos
; indexados $0400,X e $0500,X, INC e JMP

        .org $0200

        hlt             ; TODO: apague esta linha e escreva seu programa
