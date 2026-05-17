import { NextRequest, NextResponse } from "next/server";
import { getGanZhi } from "./calendar_engine";
import { getFullGuaInfo, getRelation } from "./liuyao_engine";

export async function POST(req: NextRequest) {
  try {
    const { binary_list } = await req.json();

    if (!binary_list || binary_list.length !== 6) {
      return NextResponse.json({ error: "Invalid binary_list" }, { status: 400 });
    }

    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

    const ganZhi = getGanZhi(now);
    const { day_stem, day_branch, month_branch } = ganZhi;

    const benBinary = binary_list.map((x: number) => [7, 9].includes(x) ? "1" : "0").join("");
    const benInfo = getFullGuaInfo(benBinary, day_stem, day_branch, month_branch);

    const bianBinary = binary_list.map((x: number) => [6, 7].includes(x) ? "1" : "0").join("");
    const bianInfo = getFullGuaInfo(bianBinary, day_stem, day_branch, month_branch);

    if (bianInfo && benInfo) {
      const palaceElement = benInfo.palace_element;
      bianInfo.yaos.forEach(yao => {
        yao.relation = getRelation(palaceElement, yao.element);
      });
    }

    const result = {
      timestamp,
      gan_zhi: ganZhi,
      ben_gua: benInfo,
      bian_gua: benBinary !== bianBinary ? bianInfo : null,
      raw_scores: binary_list,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
