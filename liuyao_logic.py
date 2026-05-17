import datetime

class LiuYaoEngine:
    # 八經卦數據 (Binary: 1為陽, 0為陰, 從下往上)
    TRIGRAMS = {
        '000': {'name': '坤', 'element': '土', 'nature': '地'},
        '111': {'name': '乾', 'element': '金', 'nature': '天'},
        '010': {'name': '坎', 'element': '水', 'nature': '水'},
        '101': {'name': '離', 'element': '火', 'nature': '火'},
        '100': {'name': '震', 'element': '木', 'nature': '雷'},
        '110': {'name': '兌', 'element': '金', 'nature': '澤'},
        '001': {'name': '艮', 'element': '土', 'nature': '山'},
        '011': {'name': '巽', 'element': '木', 'nature': '風'},
    }

    # 納甲地支與五行
    ELEMENTS = {
        '子': '水', '亥': '水',
        '寅': '木', '卯': '木',
        '巳': '火', '午': '火',
        '辰': '土', '戌': '土', '丑': '土', '未': '土',
        '申': '金', '酉': '金'
    }

    # 內卦納甲地支
    NA_JIA_INNER = {
        '乾': ['子', '寅', '辰'],
        '坎': ['寅', '辰', '午'],
        '艮': ['辰', '午', '申'],
        '震': ['子', '寅', '辰'],
        '巽': ['丑', '亥', '酉'],
        '離': ['卯', '丑', '亥'],
        '坤': ['未', '巳', '卯'],
        '兌': ['巳', '卯', '丑']
    }

    # 內卦納甲天干
    STEM_INNER = {
        '乾': '甲', '坤': '乙', '艮': '丙', '兌': '丁',
        '坎': '戊', '離': '己', '震': '庚', '巽': '辛'
    }

    # 外卦納甲地支
    NA_JIA_OUTER = {
        '乾': ['午', '申', '戌'],
        '坎': ['申', '戌', '子'],
        '艮': ['戌', '子', '寅'],
        '震': ['午', '申', '戌'],
        '巽': ['未', '巳', '卯'],
        '離': ['酉', '未', '巳'],
        '坤': ['丑', '亥', '酉'],
        '兌': ['亥', '酉', '未']
    }

    # 外卦納甲天干
    STEM_OUTER = {
        '乾': '壬', '坤': '癸', '艮': '丙', '兌': '丁',
        '坎': '戊', '離': '己', '震': '庚', '巽': '辛'
    }

    # 六親生剋 (主五行 vs 爻五行)
    LIU_QIN_RELATION = {
        '生我': '父母',
        '同我': '兄弟',
        '我生': '子孫',
        '我剋': '妻財',
        '剋我': '官鬼'
    }

    # 五行生剋矩陣
    SHENG_KE = {
        '金': {'生': '水', '剋': '木'},
        '水': {'生': '木', '剋': '火'},
        '木': {'生': '火', '剋': '土'},
        '火': {'生': '土', '剋': '金'},
        '土': {'生': '金', '剋': '水'}
    }

    # 64 卦名矩陣 [上卦][下卦]
    # 順序：乾兌離震巽坎艮坤 (Nature: 天澤火雷風水山地)
    HEX_NAMES = {
        '天': {'天': '乾為天', '澤': '天澤履', '火': '天火同人', '雷': '天雷無妄', '風': '天風姤', '水': '天水訟', '山': '天山遁', '地': '天地否'},
        '澤': {'天': '澤天夬', '澤': '兌為澤', '火': '澤火革', '雷': '澤雷隨', '風': '澤風大過', '水': '澤水困', '山': '澤山咸', '地': '澤地萃'},
        '火': {'天': '火天大有', '澤': '火澤睽', '火': '離為火', '雷': '火雷噬嗑', '風': '火風鼎', '水': '火水未濟', '山': '火山旅', '地': '火地晉'},
        '雷': {'天': '雷天大壯', '澤': '雷澤歸妹', '火': '雷火豐', '雷': '震為雷', '風': '雷風恆', '水': '雷水解', '山': '雷山小過', '地': '雷地豫'},
        '風': {'天': '風天小畜', '澤': '風澤中孚', '火': '風火家人', '雷': '風雷益', '風': '巽為風', '水': '風水渙', '山': '風山漸', '地': '風地觀'},
        '水': {'天': '水天需', '澤': '水澤節', '火': '水火既濟', '雷': '水雷屯', '風': '水風井', '水': '坎為水', '山': '水山蹇', '地': '水地比'},
        '山': {'天': '山天大畜', '澤': '山澤損', '火': '山火賁', '雷': '山雷頤', '風': '山風蠱', '水': '山水蒙', '山': '艮為山', '地': '山地剝'},
        '地': {'天': '地天泰', '澤': '地澤臨', '火': '地火明夷', '雷': '地雷復', '風': '地風升', '水': '地水師', '山': '地山謙', '地': '坤為地'}
    }

    # 地支六沖
    LIU_CHONG = {
        '子': '午', '午': '子', '丑': '未', '未': '丑',
        '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
        '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
    }

    @staticmethod
    def get_hexagram_name(binary_str):
        lower_tri = LiuYaoEngine.TRIGRAMS[binary_str[:3]]
        upper_tri = LiuYaoEngine.TRIGRAMS[binary_str[3:]]
        
        lower_nature = lower_tri['nature']
        upper_nature = upper_tri['nature']
        
        return LiuYaoEngine.HEX_NAMES[upper_nature][lower_nature]

    @staticmethod
    def get_relation(palace_element, yao_element):
        if palace_element == yao_element:
            return '兄弟'
        if LiuYaoEngine.SHENG_KE[yao_element]['生'] == palace_element:
            return '父母'
        if LiuYaoEngine.SHENG_KE[palace_element]['生'] == yao_element:
            return '子孫'
        if LiuYaoEngine.SHENG_KE[palace_element]['剋'] == yao_element:
            return '妻財'
        if LiuYaoEngine.SHENG_KE[yao_element]['剋'] == palace_element:
            return '官鬼'
        return '未知'

    @staticmethod
    def get_liu_shen(day_stem):
        order = ['青龍', '朱雀', '勾陳', '騰蛇', '白虎', '玄武']
        start_index = 0
        if day_stem in ['甲', '乙']: start_index = 0
        elif day_stem in ['丙', '丁']: start_index = 1
        elif day_stem == '戊': start_index = 2
        elif day_stem == '己': start_index = 3
        elif day_stem in ['庚', '辛']: start_index = 4
        elif day_stem in ['壬', '癸']: start_index = 5
        
        res = []
        for i in range(6):
            res.append(order[(start_index + i) % 6])
        return res

    @staticmethod
    def get_shen_sha(day_stem, day_branch):
        sha = []
        # 驛馬: 申子辰馬在寅, 寅午戌馬在申, 巳酉丑馬在亥, 亥卯未馬在巳
        yima_group = {
            '申': '寅', '子': '寅', '辰': '寅',
            '寅': '申', '午': '申', '戌': '申',
            '巳': '亥', '酉': '亥', '丑': '亥',
            '亥': '巳', '卯': '巳', '未': '巳'
        }
        if day_branch in yima_group:
            sha.append(f"驛馬-{yima_group[day_branch]}")
            
        # 天乙貴人: 甲戊庚牛羊, 乙己鼠猴鄉, 丙丁豬雞位, 壬癸蛇兔藏, 六辛逢馬虎
        gui_map = {
            '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
            '乙': ['子', '申'], '己': ['子', '申'],
            '丙': ['亥', '酉'], '丁': ['亥', '酉'],
            '壬': ['巳', '卯'], '癸': ['巳', '卯'],
            '辛': ['午', '寅']
        }
        if day_stem in gui_map:
            for g in gui_map[day_stem]:
                sha.append(f"貴人-{g}")
        
        # 桃花: 寅午戌在卯, 申子辰在酉, 亥卯未在子, 巳酉丑在午
        taohua_group = {
            '寅': '卯', '午': '卯', '戌': '卯',
            '申': '酉', '子': '酉', '辰': '酉',
            '亥': '子', '卯': '子', '未': '子',
            '巳': '午', '酉': '午', '丑': '午'
        }
        if day_branch in taohua_group:
            sha.append(f"桃花-{taohua_group[day_branch]}")
            
        return sha

    @staticmethod
    def find_palace_and_shi(binary_str):
        palaces = ['乾', '兌', '離', '震', '巽', '坎', '艮', '坤']
        trigram_to_binary = {v['name']: k for k, v in LiuYaoEngine.TRIGRAMS.items()}
        
        for p_name in palaces:
            base = trigram_to_binary[p_name]
            family = []
            curr = list(base + base)
            
            family.append({'bin': "".join(curr), 'shi': 6, 'type': '本宮'})
            curr[0] = '1' if curr[0] == '0' else '0'
            family.append({'bin': "".join(curr), 'shi': 1, 'type': '一世'})
            curr[1] = '1' if curr[1] == '0' else '0'
            family.append({'bin': "".join(curr), 'shi': 2, 'type': '二世'})
            curr[2] = '1' if curr[2] == '0' else '0'
            family.append({'bin': "".join(curr), 'shi': 3, 'type': '三世'})
            curr[3] = '1' if curr[3] == '0' else '0'
            family.append({'bin': "".join(curr), 'shi': 4, 'type': '四世'})
            curr[4] = '1' if curr[4] == '0' else '0'
            family.append({'bin': "".join(curr), 'shi': 5, 'type': '五世'})
            curr[3] = '1' if curr[3] == '0' else '0'
            family.append({'bin': "".join(curr), 'shi': 4, 'type': '遊魂'})
            curr[0] = base[0]; curr[1] = base[1]; curr[2] = base[2]
            family.append({'bin': "".join(curr), 'shi': 3, 'type': '歸魂'})
            
            for member in family:
                if member['bin'] == binary_str:
                    return {
                        'palace': p_name,
                        'palace_element': LiuYaoEngine.TRIGRAMS[trigram_to_binary[p_name]]['element'],
                        'shi': member['shi'],
                        'ying': (member['shi'] + 3) if member['shi'] <= 3 else (member['shi'] - 3),
                        'type': member['type']
                    }
        return None

    @staticmethod
    def get_full_gua_info(binary_str, day_stem, day_branch, month_branch):
        palace_info = LiuYaoEngine.find_palace_and_shi(binary_str)
        if not palace_info: return None
        
        lower_tri = LiuYaoEngine.TRIGRAMS[binary_str[:3]]['name']
        upper_tri = LiuYaoEngine.TRIGRAMS[binary_str[3:]]['name']
        
        inner_branches = LiuYaoEngine.NA_JIA_INNER[lower_tri]
        outer_branches = LiuYaoEngine.NA_JIA_OUTER[upper_tri]
        all_branches = inner_branches + outer_branches
        
        liu_shen = LiuYaoEngine.get_liu_shen(day_stem)
        
        yao_data = []
        for i in range(6):
            branch = all_branches[i]
            stem = LiuYaoEngine.STEM_INNER[lower_tri] if i < 3 else LiuYaoEngine.STEM_OUTER[upper_tri]
            element = LiuYaoEngine.ELEMENTS[branch]
            relation = LiuYaoEngine.get_relation(palace_info['palace_element'], element)
            
            # 判斷日沖/月破
            status = []
            if branch == LiuYaoEngine.LIU_CHONG.get(month_branch):
                status.append("月破")
            if branch == LiuYaoEngine.LIU_CHONG.get(day_branch):
                status.append("日沖") # 這裡簡單標註為日沖，AI 可進一步判斷是暗動還是日破
            if branch == day_branch:
                status.append("日建")
            if branch == month_branch:
                status.append("月建")

            yao_data.append({
                'line': i + 1,
                'stem': stem,
                'branch': branch,
                'element': element,
                'relation': relation,
                'liu_shen': liu_shen[i],
                'is_shi': (i + 1) == palace_info['shi'],
                'is_ying': (i + 1) == palace_info['ying'],
                'yao_type': '陽' if binary_str[i] == '1' else '陰',
                'status': " ".join(status)
            })
            
        return {
            'name': LiuYaoEngine.get_hexagram_name(binary_str),
            'palace': palace_info['palace'],
            'palace_element': palace_info['palace_element'],
            'shi_yao': palace_info['shi'],
            'ying_yao': palace_info['ying'],
            'gua_type': palace_info['type'],
            'yaos': yao_data,
            'shen_sha': LiuYaoEngine.get_shen_sha(day_stem, day_branch)
        }

