import { describe, expect, it } from "vitest";
import { assemble } from "../src/asm/assembler.js";
import { INSTRS } from "../src/web/components/reference.js";

// Os exemplos de uso da tabela "instruções → opcodes" são conteúdo didático que o
// aluno copia para o editor: cada snippet precisa montar sem erro, como qualquer
// examples/*.asm. Se a página ensinar errado, o teste falha.
describe("exemplos de uso da página de referência", () => {
  it("cada instrução da ISA tem um exemplo", () => {
    expect(INSTRS.length).toBe(33);
    expect(INSTRS.map((i) => i.mnemonic)).toEqual([...new Set(INSTRS.map((i) => i.mnemonic))]);
  });

  for (const instr of INSTRS) {
    it(`${instr.mnemonic} monta`, () => {
      const r = assemble(instr.use);
      expect(r.bytes.length).toBeGreaterThan(0);
    });
  }
});
