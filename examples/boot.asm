; boot.asm — o LOADER que mora no setor 0 do disco
; A máquina boota copiando o setor 0 para $0200 e desviando para lá; este loader então
; lê o setor 1 do disco para $0300 (via controlador em $F000) e dispara o programa.

        .org $0200

        lda #$01
        sta $f001       ; DISK_LBA = 1
        lda #$00
        sta $f002       ; DISK_ADDR_LO = $00
        lda #$03
        sta $f003       ; DISK_ADDR_HI = $03 → destino $0300
        lda #$01
        sta $f000       ; DISK_CMD = 1 (ler setor: 256 bytes → $0300)
        jmp $0300       ; dispara o programa que veio do disco
