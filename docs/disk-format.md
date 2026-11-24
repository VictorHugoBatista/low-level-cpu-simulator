# Formato .disk — memória secundária da MOS-6502

Arquivo **bruto**: N setores de 256 bytes, setor 0 primeiro, sem cabeçalho. Um arquivo de
10 KiB é uma imagem de 40 setores; bytes que sobraram no último setor valem $00.

## Controlador (0xF000–0xF0FF)

I/O programado por bloco, sem DMA: o programa configura e dispara, e o controlador copia o
setor inteiro — cada byte copiado passa pelo barramento e aparece no trace.

| Endereço | Registrador | Função |
|---|---|---|
| 0xF000 | `CMD` | 0 ocioso · 1 ler setor (disco → RAM) · 2 gravar setor (RAM → disco) |
| 0xF001 | `LBA` | número do setor (8 bits → discos de até 256 setores, 64 KiB) |
| 0xF002 | `ADDR_LO` | byte baixo do endereço na RAM |
| 0xF003 | `ADDR_HI` | byte alto do endereço na RAM |

Executar um comando apaga o `CMD` de volta para 0. Comando desconhecido, setor inexistente
ou endereço que aponta para o próprio controlador são erros, nunca NOP silencioso.

## Fluxo de boot

1. A máquina (papel de BIOS) copia o setor 0 para $0200, aponta o vetor de reset (0xFFFC)
   para lá e reseta.
2. O loader do setor 0 configura `LBA`/`ADDR_LO`/`ADDR_HI` do programa (ex.: setor 1 →
   $0300) e escreve 1 em `CMD`.
3. O loader desvia para a entrada do programa com um `JMP` absoluto.

É o mesmo papel que MBR/bootloader cumprem num PC real: a memória secundária só vira
execução através de uma cópia para a memória primária.
