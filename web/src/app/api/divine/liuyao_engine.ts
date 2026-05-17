// liuyao_engine.ts - 移植自 liuyao_logic.py

export interface YaoData {
  line: number;
  stem: string;
  branch: string;
  element: string;
  relation: string;
  liu_shen: string;
  is_shi: boolean;
  is_ying: boolean;
  yao_type: "陽" | "陰";
  status: string;
}

export interface GuaInfo {
  name: string;
  palace: string;
  palace_element: string;
  shi_yao: number;
  ying_yao: number;
  gua_type: string;
  yaos: YaoData[];
  shen_sha: string[];
}

const TRIGRAMS: Record<string, { name: string; element: string; nature: string }> = {
  '000': { name: '坤', element: '土', nature: '地' },
  '111': { name: '乾', element: '金', nature: '天' },
  '010': { name: '坎', element: '水', nature: '水' },
  '101': { name: '離', element: '火', nature: '火' },
  '100': { name: '震', element: '木', nature: '雷' },
  '110': { name: '兌', element: '金', nature: '澤' },
  '001': { name: '艮', element: '土', nature: '山' },
  '011': { name: '巽', element: '木', nature: '風' },
};

const ELEMENTS: Record<string, string> = {
  '子': '水', '亥': '水', '寅': '木', '卯': '木',
  '巳': '火', '午': '火', '辰': '土', '戌': '土',
  '丑': '土', '未': '土', '申': '金', '酉': '金',
};

const NA_JIA_INNER: Record<string, string[]> = {
  '乾': ['子','寅','辰'], '坎': ['寅','辰','午'], '艮': ['辰','午','申'],
  '震': ['子','寅','辰'], '巽': ['丑','亥','酉'], '離': ['卯','丑','亥'],
  '坤': ['未','巳','卯'], '兌': ['巳','卯','丑'],
};

const STEM_INNER: Record<string, string> = {
  '乾':'甲','坤':'乙','艮':'丙','兌':'丁','坎':'戊','離':'己','震':'庚','巽':'辛',
};

const NA_JIA_OUTER: Record<string, string[]> = {
  '乾': ['午','申','戌'], '坎': ['申','戌','子'], '艮': ['戌','子','寅'],
  '震': ['午','申','戌'], '巽': ['未','巳','卯'], '離': ['酉','未','巳'],
  '坤': ['丑','亥','酉'], '兌': ['亥','酉','未'],
};

const STEM_OUTER: Record<string, string> = {
  '乾':'壬','坤':'癸','艮':'丙','兌':'丁','坎':'戊','離':'己','震':'庚','巽':'辛',
};

const SHENG_KE: Record<string, { 生: string; 剋: string }> = {
  '金': { '生': '水', '剋': '木' }, '水': { '生': '木', '剋': '火' },
  '木': { '生': '火', '剋': '土' }, '火': { '生': '土', '剋': '金' },
  '土': { '生': '金', '剋': '水' },
};

const HEX_NAMES: Record<string, Record<string, string>> = {
  '天': {'天':'乾為天','澤':'天澤履','火':'天火同人','雷':'天雷無妄','風':'天風姤','水':'天水訟','山':'天山遁','地':'天地否'},
  '澤': {'天':'澤天夬','澤':'兌為澤','火':'澤火革','雷':'澤雷隨','風':'澤風大過','水':'澤水困','山':'澤山咸','地':'澤地萃'},
  '火': {'天':'火天大有','澤':'火澤睽','火':'離為火','雷':'火雷噬嗑','風':'火風鼎','水':'火水未濟','山':'火山旅','地':'火地晉'},
  '雷': {'天':'雷天大壯','澤':'雷澤歸妹','火':'雷火豐','雷':'震為雷','風':'雷風恆','水':'雷水解','山':'雷山小過','地':'雷地豫'},
  '風': {'天':'風天小畜','澤':'風澤中孚','火':'風火家人','雷':'風雷益','風':'巽為風','水':'風水渙','山':'風山漸','地':'風地觀'},
  '水': {'天':'水天需','澤':'水澤節','火':'水火既濟','雷':'水雷屯','風':'水風井','水':'坎為水','山':'水山蹇','地':'水地比'},
  '山': {'天':'山天大畜','澤':'山澤損','火':'山火賁','雷':'山雷頤','風':'山風蠱','水':'山水蒙','山':'艮為山','地':'山地剝'},
  '地': {'天':'地天泰','澤':'地澤臨','火':'地火明夷','雷':'地雷復','風':'地風升','水':'地水師','山':'地山謙','地':'坤為地'},
};

const LIU_CHONG: Record<string, string> = {
  '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
  '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳',
};

function getHexagramName(binaryStr: string): string {
  const lower = TRIGRAMS[binaryStr.slice(0, 3)];
  const upper = TRIGRAMS[binaryStr.slice(3)];
  return HEX_NAMES[upper.nature][lower.nature];
}

export function getRelation(palaceElement: string, yaoElement: string): string {
  if (palaceElement === yaoElement) return '兄弟';
  if (SHENG_KE[yaoElement]['生'] === palaceElement) return '父母';
  if (SHENG_KE[palaceElement]['生'] === yaoElement) return '子孫';
  if (SHENG_KE[palaceElement]['剋'] === yaoElement) return '妻財';
  if (SHENG_KE[yaoElement]['剋'] === palaceElement) return '官鬼';
  return '未知';
}

function getLiuShen(dayStem: string): string[] {
  const order = ['青龍','朱雀','勾陳','騰蛇','白虎','玄武'];
  const startMap: Record<string, number> = {
    '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2,
    '己': 3, '庚': 4, '辛': 4, '壬': 5, '癸': 5,
  };
  const start = startMap[dayStem] ?? 0;
  return Array.from({ length: 6 }, (_, i) => order[(start + i) % 6]);
}

function getShenSha(dayStem: string, dayBranch: string): string[] {
  const sha: string[] = [];
  const yimaGroup: Record<string, string> = {
    '申':'寅','子':'寅','辰':'寅','寅':'申','午':'申','戌':'申',
    '巳':'亥','酉':'亥','丑':'亥','亥':'巳','卯':'巳','未':'巳',
  };
  if (yimaGroup[dayBranch]) sha.push(`驛馬-${yimaGroup[dayBranch]}`);

  const guiMap: Record<string, string[]> = {
    '甲':['丑','未'],'戊':['丑','未'],'庚':['丑','未'],
    '乙':['子','申'],'己':['子','申'],
    '丙':['亥','酉'],'丁':['亥','酉'],
    '壬':['巳','卯'],'癸':['巳','卯'],'辛':['午','寅'],
  };
  if (guiMap[dayStem]) guiMap[dayStem].forEach(g => sha.push(`貴人-${g}`));

  const taohuaGroup: Record<string, string> = {
    '寅':'卯','午':'卯','戌':'卯','申':'酉','子':'酉','辰':'酉',
    '亥':'子','卯':'子','未':'子','巳':'午','酉':'午','丑':'午',
  };
  if (taohuaGroup[dayBranch]) sha.push(`桃花-${taohuaGroup[dayBranch]}`);

  return sha;
}

function findPalaceAndShi(binaryStr: string): { palace: string; palace_element: string; shi: number; ying: number; type: string } | null {
  const palaces = ['乾','兌','離','震','巽','坎','艮','坤'];
  const trigramToBinary = Object.fromEntries(Object.entries(TRIGRAMS).map(([k, v]) => [v.name, k]));

  for (const pName of palaces) {
    const base = trigramToBinary[pName];
    const family: { bin: string; shi: number; type: string }[] = [];
    const curr = base.split('').concat(base.split(''));

    family.push({ bin: curr.join(''), shi: 6, type: '本宮' });
    curr[0] = curr[0] === '0' ? '1' : '0';
    family.push({ bin: curr.join(''), shi: 1, type: '一世' });
    curr[1] = curr[1] === '0' ? '1' : '0';
    family.push({ bin: curr.join(''), shi: 2, type: '二世' });
    curr[2] = curr[2] === '0' ? '1' : '0';
    family.push({ bin: curr.join(''), shi: 3, type: '三世' });
    curr[3] = curr[3] === '0' ? '1' : '0';
    family.push({ bin: curr.join(''), shi: 4, type: '四世' });
    curr[4] = curr[4] === '0' ? '1' : '0';
    family.push({ bin: curr.join(''), shi: 5, type: '五世' });
    curr[3] = curr[3] === '0' ? '1' : '0';
    family.push({ bin: curr.join(''), shi: 4, type: '遊魂' });
    curr[0] = base[0]; curr[1] = base[1]; curr[2] = base[2];
    family.push({ bin: curr.join(''), shi: 3, type: '歸魂' });

    const match = family.find(m => m.bin === binaryStr);
    if (match) {
      const shi = match.shi;
      return {
        palace: pName,
        palace_element: TRIGRAMS[base].element,
        shi,
        ying: shi <= 3 ? shi + 3 : shi - 3,
        type: match.type,
      };
    }
  }
  return null;
}

export function getFullGuaInfo(binaryStr: string, dayStem: string, dayBranch: string, monthBranch: string): GuaInfo | null {
  const palaceInfo = findPalaceAndShi(binaryStr);
  if (!palaceInfo) return null;

  const lowerTri = TRIGRAMS[binaryStr.slice(0, 3)].name;
  const upperTri = TRIGRAMS[binaryStr.slice(3)].name;

  const allBranches = [...NA_JIA_INNER[lowerTri], ...NA_JIA_OUTER[upperTri]];
  const liuShen = getLiuShen(dayStem);

  const yaos: YaoData[] = allBranches.map((branch, i) => {
    const stem = i < 3 ? STEM_INNER[lowerTri] : STEM_OUTER[upperTri];
    const element = ELEMENTS[branch];
    const relation = getRelation(palaceInfo.palace_element, element);

    const status: string[] = [];
    if (branch === LIU_CHONG[monthBranch]) status.push('月破');
    if (branch === LIU_CHONG[dayBranch]) status.push('日沖');
    if (branch === dayBranch) status.push('日建');
    if (branch === monthBranch) status.push('月建');

    return {
      line: i + 1,
      stem,
      branch,
      element,
      relation,
      liu_shen: liuShen[i],
      is_shi: (i + 1) === palaceInfo.shi,
      is_ying: (i + 1) === palaceInfo.ying,
      yao_type: binaryStr[i] === '1' ? '陽' : '陰',
      status: status.join(' '),
    };
  });

  return {
    name: getHexagramName(binaryStr),
    palace: palaceInfo.palace,
    palace_element: palaceInfo.palace_element,
    shi_yao: palaceInfo.shi,
    ying_yao: palaceInfo.ying,
    gua_type: palaceInfo.type,
    yaos,
    shen_sha: getShenSha(dayStem, dayBranch),
  };
}
