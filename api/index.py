import sys
import os

# 將專案根目錄加入 sys.path，確保 Vercel Serverless Function 能順利載入
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import datetime
from liuyao_logic import LiuYaoEngine
from calendar_engine import CalendarEngine

app = FastAPI()

# 允許跨來源請求 (CORS)，方便外部前端呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = LiuYaoEngine()
calendar = CalendarEngine()

@app.get("/api/ganzhi")
def get_gan_zhi():
    now = datetime.datetime.now()
    return calendar.get_gan_zhi(now)

@app.post("/api/divination")
def process_divination(payload: dict = Body(...)):
    binary_list = payload.get("binary_list")
    question = payload.get("question", "未填寫事項")
    if not binary_list:
        return {"error": "Invalid binary list"}
        
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
    return result
