# 專業六爻排盤

這是一個以納甲六爻為核心的排盤工具，支援：

- 銅錢起卦與本卦、變卦排盤
- 納甲、五行、六親、六神、世應
- 使用者裝置當地時間
- 農曆日期顯示與精確節氣計算
- Windows 桌面版與瀏覽器本機版
- Vercel Serverless API 部署

## 排盤標準

本專案統一使用以下納甲六爻規則：

| 項目 | 使用規則 |
| --- | --- |
| 時間來源 | 使用者裝置的當地時間與 IANA 時區 |
| 年柱 | 以立春為換年界線 |
| 月建 | 以二十四節氣的「節」為換月界線 |
| 農曆日期 | 使用萬年曆算法轉換，僅供日期顯示 |
| 日柱 | 子初換日，23:00 起算下一日 |
| 時柱 | 依使用者當地民用時間，每兩小時一個時辰 |
| 六神 | 依占卜日的日干排列 |
| 六親 | 依卦宮五行與各爻納甲五行生剋決定 |
| 五行 | 依卦宮、納甲地支與干支固定配置 |

因此，農曆月份與六爻月建是兩個不同欄位。例如 2026/7/13
雖然是農曆五月廿九，但小暑後六爻月建為乙未月。

## 系統需求

- Windows 10/11
- Python 3.10 或更新版本
- Google Chrome 或 Microsoft Edge
- Git（若要從 GitHub 下載）

## 從 GitHub 下載

~~~powershell
git clone https://github.com/paganiwang-del/I-ching.git
cd I-ching
~~~

## 建立本機 Python 環境

建議使用虛擬環境，避免和其他 Python 專案互相影響：

~~~powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
~~~

如果 PowerShell 阻擋虛擬環境啟用，可以只對目前視窗放寬限制：

~~~powershell
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
~~~

## 運行瀏覽器版

瀏覽器版使用 FastAPI，適合測試 API 與本機網頁：

~~~powershell
python web_app.py
~~~

啟動後開啟：

~~~text
http://127.0.0.1:8000
~~~

也可以使用 Uvicorn 指定其他連接埠：

~~~powershell
python -m uvicorn web_app:app --host 127.0.0.1 --port 8001
~~~

## 運行桌面版

桌面版會以 Eel 啟動本機視窗：

~~~powershell
python main.py
~~~

也可以直接執行已打包的檔案：

~~~text
dist\ProfessionalLiuYao_V2.exe
~~~

桌面版的占卜紀錄會儲存在專案目錄的 divination.db。

## API 測試

啟動瀏覽器版後，可以查詢指定時刻的干支：

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/ganzhi?client_now=2026-07-13T10%3A00%3A00.000Z&client_timezone=Asia%2FTaipei"
~~~

client_now 使用 ISO 8601 時間，client_timezone 使用 IANA 時區，例如：

- Asia/Taipei
- America/Los_Angeles
- America/New_York
- Asia/Tokyo

前端會自動傳送裝置時間與時區；UTC 只作為傳輸格式，排盤時會轉回使用者當地時間。

## Vercel 部署

本專案已配置 vercel.json，API 入口為 api/index.py。

若 GitHub 已連結 Vercel，推送到 main 後會由 Vercel 自動建置。也可以使用 Vercel CLI：

~~~powershell
npm install -g vercel
vercel login
vercel
vercel --prod
~~~

Vercel 建置時會依照根目錄的 requirements.txt 安裝 Python 依賴。

## 專案結構

~~~text
api/index.py              Vercel Serverless API
calendar_engine.py        年月日時干支與節氣、農曆轉換
liuyao_logic.py           納甲、五行、六親、六神與卦象邏輯
main.py                   Eel 桌面版入口
web_app.py                FastAPI 瀏覽器版入口
frontend/                 前端畫面與互動
storage.py                SQLite 占卜紀錄
ProfessionalLiuYao.spec   PyInstaller 打包設定
dist/                     本機 exe 輸出目錄
~~~

## 常見問題

### 找不到套件

確認虛擬環境已啟用，再重新安裝：

~~~powershell
python -m pip install -r requirements.txt
~~~

### 8000 連接埠被占用

改用其他連接埠：

~~~powershell
python -m uvicorn web_app:app --host 127.0.0.1 --port 8001
~~~

### 線上版時間不正確

確認前端有傳送 client_now 與 client_timezone，並確認瀏覽器允許取得正確的系統時間與時區。
