from liuyao_logic import LiuYaoEngine

def verify_xian_jian():
    # 咸卦 (澤山咸): 上兌(110), 下艮(001) -> 001110 (Bottom-to-Top)
    xian_bin = '001110'
    # 漸卦 (風山漸): 上巽(011), 下艮(001) -> 001011 (Bottom-to-Top)
    jian_bin = '001011'
    
    print(f"Testing 咸卦 (001110): {LiuYaoEngine.get_hexagram_name(xian_bin)}")
    print(f"Testing 漸卦 (001011): {LiuYaoEngine.get_hexagram_name(jian_bin)}")

if __name__ == "__main__":
    verify_xian_jian()
