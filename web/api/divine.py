from http.server import BaseHTTPRequestHandler
import json
import datetime
import sys
import os

# 加入上層目錄至 sys.path 確保能匯入 liuyao_logic 與 calendar_engine (Vercel 需要這樣處理)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from liuyao_logic import LiuYaoEngine
from calendar_engine import CalendarEngine

engine = LiuYaoEngine()
calendar = CalendarEngine()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data)
            
            binary_list = req_body.get('binary_list', [])
            if not binary_list or len(binary_list) != 6:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid binary_list'}).encode('utf-8'))
                return

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
                'gan_zhi': gan_zhi,
                'ben_gua': ben_info,
                'bian_gua': bian_info if ben_binary != bian_binary else None,
                'raw_scores': binary_list
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
