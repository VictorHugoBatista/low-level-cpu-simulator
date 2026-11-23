# Guia do assembler AK-8

O assembler gera exatamente os bytes da tabela congelada em `docs/ISA.md` — ele nunca
"inventa" opcode. O binário roda na máquina; o fonte nunca é interpretado direto.

## Sintaxe das linhas

```
[rótulo:] [instrução [operando]] [; comentário]
```

Instruções e diretivas são case-insensitive; símbolos (rótulos e constantes) são
case-sensitive. Números: decimal (`123`), hex (`$2000`), binário (`%1010`) e caractere
(`'A'`, com escapes `'\n'`, `'\t'`, `'\0'`).

## Operandos e modos

| Forma | Modo escolhido |
|---|---|
| `#$nn` | imediato |
| valor ≤ `$FF` (literal ou constante) | zero page, quando a instrução tem esse modo |
| `$hhhh` ou rótulo | absoluto |
| `$hhhh,X` | indexado |
| `($nn),Y` | indireto pós-indexado |
| rótulo em desvio (`JZ`, `JNZ`...) | relativo (o assembler calcula o offset −128..127) |

Regras fixas: **rótulos sempre resolvem para absoluto** (endereços de programa ficam fora
da página zero), e constantes `.equ` pequenas caem no zero page como um literal.

## Diretivas

| Diretiva | Efeito |
|---|---|
| `.org $0200` | define o endereço corrente (padrão: `$0200`) |
| `.equ nome, valor` | define constante; precisa vir antes do uso |
| `.db 1, $ff, 'A'` | bytes crus (valores já definidos, sem referência para frente) |
| `.dw $1234` | words little-endian |
| `.ascii "Oi\n"` | string com escapes `\n`, `\t`, `\\`, `\"` |

## Saídas

- **`.bin`** — bytes crus, começando na origem (primeiro endereço emitido; buracos criados
  por `.org` viram `$00`). Rodar: `lcs run programa.bin --origin 0x0200`.
- **`.lst`** — endereço, bytes e fonte de cada linha, mais a tabela de símbolos no fim.

## Erros

Todos os erros encontrados são reportados de uma vez, no formato
`arquivo:linha:coluna: mensagem` — por exemplo `soma.asm:5:9: símbolo já definido: loop`.
Opcodes fora da tabela da ISA são erro, e instruções congeladas mas ainda não implementadas
no núcleo montam normalmente e dão erro claro na hora de executar.
