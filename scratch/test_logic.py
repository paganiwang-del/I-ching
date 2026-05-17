from liuyao_logic import LiuYaoEngine

def test_all_64_guas():
    engine = LiuYaoEngine()
    count = 0
    missing = []
    for i in range(64):
        bin_str = format(i, '06b')[::-1] # 000000 to 111111, reversed to match bottom-up
        res = engine.find_palace_and_shi(bin_str)
        if res:
            count += 1
        else:
            missing.append(bin_str)
    
    print(f"Total found: {count}/64")
    if missing:
        print(f"Missing binaries: {missing}")

if __name__ == "__main__":
    test_all_64_guas()
