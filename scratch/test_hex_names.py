from liuyao_logic import LiuYaoEngine

def test():
    # 3. 屯: 上坎(010), 下震(100) -> 100010 (lower-to-upper)
    print(f"Test 3 (屯): {LiuYaoEngine.get_hexagram_name('100010')}")
    
    # 4. 蒙: 上艮(001), 下坎(010) -> 010001
    print(f"Test 4 (蒙): {LiuYaoEngine.get_hexagram_name('010001')}")
    
    # 25. 无妄: 上乾(111), 下震(100) -> 100111
    print(f"Test 25 (无妄): {LiuYaoEngine.get_hexagram_name('100111')}")
    
    # 29. 坎: 上坎(010), 下坎(010) -> 010010
    print(f"Test 29 (坎): {LiuYaoEngine.get_hexagram_name('010010')}")

    # 7. 師: 上坤(000), 下坎(010) -> 010000
    print(f"Test 7 (師): {LiuYaoEngine.get_hexagram_name('010000')}")
    
    # 8. 比: 上坎(010), 下坤(000) -> 000010
    print(f"Test 8 (比): {LiuYaoEngine.get_hexagram_name('000010')}")

if __name__ == "__main__":
    test()
