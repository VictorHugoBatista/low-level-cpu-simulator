import type { Accessor } from "solid-js";
import { hex2, hex4 } from "../../core/bytes.js";
import type { RegSnapshot } from "../store.js";

const bin8 = (v: number): string => v.toString(2).padStart(8, "0");

function ByteRow(props: { name: string; value: number; wide?: boolean }) {
  return (
    <tr>
      <td class="reg">{props.name}</td>
      <td>{props.wide ? `$${hex4(props.value)}` : `$${hex2(props.value)}`}</td>
      <td class="bin">{props.wide ? "—" : bin8(props.value)}</td>
      <td>{props.value}</td>
    </tr>
  );
}

export function RegistersPanel(props: { regs: Accessor<RegSnapshot> }) {
  const r = () => props.regs();
  return (
    <>
      <table class="registers">
        <thead>
          <tr>
            <th></th>
            <th>hex</th>
            <th>binário</th>
            <th>dec</th>
          </tr>
        </thead>
        <tbody>
          <ByteRow name="PC" value={r().pc} wide />
          <ByteRow name="A" value={r().a} />
          <ByteRow name="X" value={r().x} />
          <ByteRow name="Y" value={r().y} />
          <ByteRow name="SP" value={r().sp} />
          <ByteRow name="IR" value={r().ir} />
          <ByteRow name="MAR" value={r().mar} wide />
          <ByteRow name="MDR" value={r().mdr} />
          <tr>
            <td class="reg">T</td>
            <td colspan="3">passo {r().t} do sequenciador</td>
          </tr>
          <tr class="flags">
            <td class="reg">P</td>
            <td colspan="3">
              <span classList={{ flag: true, on: r().c }}>C</span>
              <span classList={{ flag: true, on: r().z }}>Z</span>
              <span classList={{ flag: true, on: r().n }}>N</span>
              <span classList={{ flag: true, on: r().v }}>V</span>
              <span class="bin"> {bin8(r().p)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
