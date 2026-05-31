import eel
import os
import json
import datetime
from liuyao_logic import LiuYaoEngine
from calendar_engine import CalendarEngine
from storage import StorageManager

# 初始化 Eel
eel.init('frontend')

storage = StorageManager()
engine = LiuYaoEngine()
calendar = CalendarEngine()

@eel.expose
def get_gan_zhi():
    now = datetime.datetime.now()
    return calendar.get_gan_zhi(now)

@eel.expose
def process_divination(*args):
    binary_list = args[0] if len(args) > 0 else []
    question = args[1] if len(args) > 1 else "後端未接收到文字"
    now = datetime.datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    gan_zhi = calendar.get_gan_zhi(now)
    day_stem = gan_zhi['day_stem']
    
    ben_binary = "".join(['1' if x in [7, 9] else '0' for x in binary_list])
    ben_info = engine.get_full_gua_info(ben_binary, day_stem, gan_zhi['day_branch'], gan_zhi['month_branch'])
    
    bian_binary = "".join(['1' if x in [6, 7] else '0' for x in binary_list])
    bian_info = engine.get_full_gua_info(bian_binary, day_stem, gan_zhi['day_branch'], gan_zhi['month_branch'])
    if bian_info:
        palace_element = ben_info['palace_element']
        for yao in bian_info['yaos']:
            yao['relation'] = engine.get_relation(palace_element, yao['element'])
    
    result = {
        'timestamp': timestamp,
        'question': question,
        'gan_zhi': gan_zhi,
        'ben_gua': ben_info,
        'bian_gua': bian_info if ben_binary != bian_binary else None,
        'raw_scores': binary_list
    }
    
    storage.save_record(
        timestamp, 
        gan_zhi, 
        ben_info['palace'] + ben_info['yaos'][0]['yao_type'],
        bian_info['palace'] if bian_info else "無變",
        result
    )
    
    return result

@eel.expose
def get_history():
    return storage.get_history()

@eel.expose
def delete_record(record_id):
    storage.delete_record(record_id)
    return True

def main():
    # 啟動 Eel
    # size 指定視窗大小
    eel.start('index.html', size=(1200, 850))

if __name__ == '__main__':
    main()
