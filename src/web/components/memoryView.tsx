import { For, createMemo, createSignal } from "solid-js";
import { hex2, hex4 } from "../../core/bytes.js";
import type { Store } from "../store.js";

const REGIONS: Array<{ start: number; end: number; name: string; cls: string }> = [
  { start: 0x0000, end: 0x00ff, name: "página zero", cls: "r-zp" },
  { start: 0x0100, end: 0x01ff, name: "stack", cls: "r-stack" },
  { start: 0x0200, end: 0xdfff, name: "RAM", cls: "r-ram" },
  { start: 0xe800, end: 0xe8ff, name: "terminal", cls: "r-term" },
  { start: 0xf000, end: 0xf0ff, name: "disco", cls: "r-disk" },
  { start: 0xfffc, end: 0xffff, name: "vetores", cls: "r-vec" },
];

const regionOf = (addr: number): string =>
  REGIONS.find((r) => addr >= r.start && addr <= r.end)?.cls ?? "r-none";

const asciiOf = (v: number): string =>
  v >= 0x20 && v < 0x7f ? String.fromCharCode(v) : "·";

const ROWS = 20;
const COLS = 16;

/** Hex dump virtualizado: só as linhas visíveis são lidas e renderizadas. */
export function MemoryView(props: { store: Store }) {
  const s = props.store;
  const [start, setStart] = createSignal(0x0200);
  const [jump, setJump] = createSignal("");

  const rows = createMemo(() => {
    void s.memVersion();
    const base = start();
    const out: Array<Array<{ addr: number; value: number }>> = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Array<{ addr: number; value: number }> = [];
      for (let c = 0; c < COLS; c++) {
        const addr = (base + r * COLS + c) & 0xffff;
        row.push({ addr, value: s.machine.ram.read(addr) });
      }
      out.push(row);
    }
    return out;
  });

  const go = (): void => {
    const v = parseInt(jump().replace(/^\$/, ""), 16);
    if (!Number.isNaN(v)) setStart((v & 0xfff0) & 0xffff);
  };

  return (
    <section class="panel">
      <h2>memória</h2>
      <div class="row">
        <input
          class="jump"
          placeholder="$0200"
          value={jump()}
          onChange={(e) => setJump(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button onClick={go}>ir</button>
        <button onClick={() => setStart((v) => (v - 0x100) & 0xffff)}>−$100</button>
        <button onClick={() => setStart((v) => (v + 0x100) & 0xffff)}>+$100</button>
        <For each={REGIONS}>
          {(r) => (
            <button class={r.cls} onClick={() => setStart(r.start & 0xfff0)}>
              {r.name}
            </button>
          )}
        </For>
      </div>
      <table class="memgrid">
        <tbody>
          <For each={rows()}>
            {(row) => (
              <tr>
                <td class="addr">{hex4(row[0].addr)}</td>
                <For each={row}>
                  {(cell) => (
                    <td
                      class={`cell ${regionOf(cell.addr)} ${cell.addr === s.lastAccess() ? "hot" : ""}`}
                      title={`$${hex4(cell.addr)}`}
                    >
                      {hex2(cell.value)}
                    </td>
                  )}
                </For>
                <td class="ascii">{row.map((c) => asciiOf(c.value)).join("")}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </section>
  );
}
