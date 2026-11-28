import { describe, expect, it } from "vitest";
import { createStore } from "../src/web/store.js";

describe("createStore — loadAsm normaliza o fonte carregado", () => {
  it("converte CRLF e CR solto para LF: o textarea normaliza na exibição, mas a camada de destaque renderiza o texto bruto", () => {
    const s = createStore();
    s.loadAsm(".org $0200\r\nlda #$01\r\nhlt\r\n", "crlf.asm");
    expect(s.source()).toBe(".org $0200\nlda #$01\nhlt\n");
  });

  it("não altera fonte já em LF e não sobe como rascunho do exercício ativo", () => {
    const s = createStore();
    s.loadAsm(".org $0200\nhlt\n", "lf.asm");
    expect(s.source()).toBe(".org $0200\nhlt\n");
    expect(s.sourceDirty()).toBe(false);
  });
});
