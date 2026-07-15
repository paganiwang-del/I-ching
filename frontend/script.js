// ==================== 網頁/桌面雙端相容適配層 ====================
if (typeof eel === 'undefined') {
    const API_BASE_URL = window.location.origin;
    window.eel = {
        get_gan_zhi: (clientNow, clientTimezone) => () => fetch(
            `${API_BASE_URL}/api/ganzhi?client_now=${encodeURIComponent(clientNow)}&client_timezone=${encodeURIComponent(clientTimezone)}`
        ).then(r => r.json()),
        process_divination: (binary_list, question, clientNow, clientTimezone) => () => fetch(`${API_BASE_URL}/api/divination`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ binary_list, question, client_now: clientNow, client_timezone: clientTimezone })
        }).then(r => r.json()),
        get_history: () => () => Promise.resolve([]),
        delete_record: () => () => Promise.resolve(true)
    };

    // 網頁版不需要存檔，隱藏「歷史紀錄」導航選項
    document.addEventListener('DOMContentLoaded', () => {
        const historyTabBtn = document.querySelector('[data-tab="history"]');
        if (historyTabBtn) {
            historyTabBtn.style.display = 'none';
        }
    });
}
// ========================================================

function getClientTimeContext() {
    return {
        clientNow: new Date().toISOString(),
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'
    };
}

const coinArea = document.getElementById('coin-area');
const btnToss = document.getElementById('btn-toss');
const statusText = document.getElementById('status-text');
const currentGanZhi = document.getElementById('current-ganzhi');
const resultDisplay = document.getElementById('result-display');
const benGuaBody = document.getElementById('ben-gua-body');
const bianGuaBody = document.getElementById('bian-gua-body');
const historyList = document.getElementById('history-list');

let tossCount = 0;
let results = [];
let lastDivinationData = null;
let divinationStartedAt = null;
let divinationTimezone = null;

/**
 * 聲學引擎：利用 Web Audio API 即時生成硬幣碰撞聲
 */
class CoinSound {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // 優化後的金屬諧波合成算法
    playClink(isLanding = false) {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        
        // 金屬碰撞特徵頻率 (不諧和頻率組合)
        const frequencies = isLanding ? [2200, 3300, 4100, 5500] : [4500, 5900, 7200, 9100];
        
        frequencies.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // 使用正弦波疊加
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq + (Math.random() * 100), now);
            
            const intensity = isLanding ? 0.2 : 0.1;
            gain.gain.setValueAtTime(intensity / (index + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isLanding ? 0.5 : 0.1));

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.6);
        });

        // 碰撞瞬間的白噪音 (模擬衝擊)
        const noise = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 0.02;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.value = 6000;

        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
    }

    playShake(duration) {
        const interval = setInterval(() => this.playClink(), 60);
        setTimeout(() => {
            clearInterval(interval);
            this.playClink(true); // 落地聲
        }, duration);
    }
}

const soundEngine = new CoinSound();

// 初始化：獲取干支時間與啟動輪播
async function init() {
    try {
        if (typeof eel !== 'undefined') {
            const timeContext = getClientTimeContext();
            const ganzhi = await eel.get_gan_zhi(timeContext.clientNow, timeContext.clientTimezone)();
            currentGanZhi.innerText = `${ganzhi.year}年 ${ganzhi.month}月 ${ganzhi.day}日 ${ganzhi.hour}時`;
        }
    } catch (e) {
        console.error("初始化失敗:", e);
    }
    initWisdomCarousel();
    initNatureCanvas();
}

function initWisdomCarousel() {
    const quotes = document.querySelectorAll('.wisdom-quote');
    if(quotes.length === 0) return;
    
    // 初始先設定第一句為 active
    quotes.forEach(q => q.classList.remove('active'));
    quotes[0].classList.add('active');

    let currentIndex = 0;
    setInterval(() => {
        quotes[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % quotes.length;
        quotes[currentIndex].classList.add('active');
    }, 1000); // 改為每 1 秒切換一次特效
}

function initNatureCanvas() {
    const canvas = document.getElementById('nature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 雲朵資料（初始位置在畫面內）
    const clouds = [
        { x: 150,  y: 80,  size: 90,  speedX: 0.25 },
        { x: 600,  y: 160, size: 120, speedX: 0.15 },
        { x: 1000, y: 60,  size: 70,  speedX: 0.35 },
        { x: 400,  y: 300, size: 80,  speedX: 0.20 },
    ];

    // 飛鳥資料（4 隻，各有不同速度、高度、大小與起始位置）
    const birds = [
        { x: -60,  y: 90,  size: 22, speed: 1.8,  wingPhase: 0,   delay: 0   },
        { x: -200, y: 160, size: 16, speed: 1.3,  wingPhase: 1.5, delay: 80  },
        { x: -400, y: 60,  size: 26, speed: 2.2,  wingPhase: 0.8, delay: 200 },
        { x: -600, y: 200, size: 14, speed: 1.0,  wingPhase: 2.2, delay: 350 },
    ];

    // 繪製單隻飛鳥（水墨「M」型翅膀剪影）
    function drawBird(x, y, size, wingPhase) {
        const flap = Math.sin(wingPhase) * size * 0.5; // 翅膀拍打幅度
        ctx.save();
        ctx.strokeStyle = 'rgba(40, 25, 10, 0.75)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        // 左翼
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - size * 0.6, y - flap, x - size * 1.2, y + size * 0.1);
        // 右翼
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + size * 0.6, y - flap, x + size * 1.2, y + size * 0.1);
        ctx.stroke();
        ctx.restore();
    }

    function drawCloud(x, y, size) {
        ctx.save();
        ctx.fillStyle = 'rgba(160, 130, 100, 0.22)';
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(100, 70, 40, 0.3)';
        const puffs = [
            [0, 0, size],
            [-size * 0.65, size * 0.15, size * 0.72],
            [ size * 0.65, size * 0.15, size * 0.72],
            [-size * 0.30, -size * 0.30, size * 0.60],
            [ size * 0.30, -size * 0.30, size * 0.60],
        ];
        ctx.beginPath();
        for (const [dx, dy, r] of puffs) {
            ctx.moveTo(x + dx + r, y + dy);
            ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }

    let time = 0;

    function drawWaves() {
        const h = canvas.height;
        const w = canvas.width;
        for (let layer = 0; layer < 4; layer++) {
            const baseY   = h - 30 - layer * 28;
            const amp     = 12 - layer * 2;
            const freq    = 0.008 + layer * 0.001;
            const speed   = 0.6 + layer * 0.2;
            const alpha   = 0.28 - layer * 0.05;
            const lw      = 2.5 - layer * 0.4;

            ctx.beginPath();
            ctx.lineWidth   = lw;
            ctx.strokeStyle = `rgba(80, 55, 30, ${alpha})`;
            for (let x = 0; x <= w; x += 2) {
                const y = baseY + Math.sin(x * freq + time * speed) * amp;
                if (x === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 繪製雲朵
        for (const c of clouds) {
            c.x += c.speedX;
            if (c.x > canvas.width + 200) c.x = -200;
            const floatY = c.y + Math.sin(time * 0.4 + c.x * 0.005) * 6;
            drawCloud(c.x, floatY, c.size);
        }

        // 繪製飛鳥
        for (const b of birds) {
            if (time * 60 < b.delay) continue; // 延遲出場
            b.x += b.speed;
            b.wingPhase += 0.12; // 翅膀拍打頻率
            if (b.x > canvas.width + 100) b.x = -80; // 飛出畫面右側後從左側重新進場
            const floatY = b.y + Math.sin(time * 0.8 + b.wingPhase * 0.3) * 4; // 輕微上下飄
            drawBird(b.x, floatY, b.size, b.wingPhase);
        }

        // 繪製水波
        drawWaves();

        time += 0.03;
        requestAnimationFrame(animate);
    }

    animate();
}

// 擲錢動畫與邏輯
btnToss.addEventListener('click', async () => {
    if (tossCount >= 6) return;

    if (tossCount === 0) {
        const timeContext = getClientTimeContext();
        divinationStartedAt = timeContext.clientNow;
        divinationTimezone = timeContext.clientTimezone;
    }

    // 播放震動動畫與音效
    coinArea.classList.add('shaking');
    soundEngine.playShake(800);
    btnToss.disabled = true;
    statusText.innerText = "晃動中...";

    setTimeout(async () => {
        coinArea.classList.remove('shaking');
        
        // 隨機決定 3 枚銅錢 (3=正面/陽, 2=背面/陰)
        const coins = [
            Math.random() > 0.5 ? 3 : 2,
            Math.random() > 0.5 ? 3 : 2,
            Math.random() > 0.5 ? 3 : 2
        ];
        
        const sum = coins.reduce((a, b) => a + b, 0);
        results.push(sum);
        
        // 計算正反面
        const heads = coins.filter(c => c === 3).length;
        const tails = coins.filter(c => c === 2).length;
        
        // 更新硬幣顯示
        updateCoinVisuals(coins);
        
        tossCount++;
        updateProgress(tossCount);
        
        // 判斷爻象文字
        let yaoTypeStr = "";
        if (sum === 6) yaoTypeStr = "老陰 (變爻)";
        else if (sum === 7) yaoTypeStr = "少陽";
        else if (sum === 8) yaoTypeStr = "少陰";
        else if (sum === 9) yaoTypeStr = "老陽 (變爻)";

        statusText.innerText = `第 ${tossCount} 爻：${heads}正 ${tails}反 -> ${yaoTypeStr}`;
        
        if (tossCount === 6) {
            statusText.innerText = "六爻已滿，正在裝卦...";
            setTimeout(finalizeDivination, 500); // 稍微延遲讓用戶看清最後一爻
        } else {
            btnToss.disabled = false;
        }
    }, 800);
});

function updateCoinVisuals(coins) {
    const coinElements = [
        document.getElementById('coin-1'),
        document.getElementById('coin-2'),
        document.getElementById('coin-3')
    ];
    
    coinElements.forEach((el, i) => {
        const isHead = coins[i] === 3;
        el.innerText = isHead ? "陽" : "陰";
        el.style.transform = isHead ? "rotateY(0deg)" : "rotateY(180deg)";
        el.style.color = isHead ? "#d4af37" : "#ffffff";
    });
}

function updateProgress(step) {
    const dots = document.querySelectorAll('.progress-dot');
    if (dots[step - 1]) dots[step - 1].classList.add('active');
}

async function finalizeDivination() {
    try {
        if (typeof eel !== 'undefined') {
            const questionInput = document.getElementById('question-input');
            const question = questionInput && questionInput.value.trim() ? questionInput.value.trim() : '前端擷取失敗';

            const timeContext = getClientTimeContext();
            const finalData = await eel.process_divination(
                results,
                question,
                divinationStartedAt || timeContext.clientNow,
                divinationTimezone || timeContext.clientTimezone
            )();
            console.log("排盤結果:", finalData);
            if (finalData) {
                lastDivinationData = finalData;
                renderGua(finalData);
                document.querySelector('.stage').style.display = 'none';
                
                // 隱藏智慧文字
                const wisdomContainer = document.querySelector('.wisdom-container');
                if (wisdomContainer) wisdomContainer.style.display = 'none';

                resultDisplay.style.display = 'block';

                // 觸發飛龍/水墨爆發特效
                const dragon = document.getElementById('dragon-effect');
                if (dragon) {
                    dragon.classList.add('active');
                    setTimeout(() => {
                        dragon.classList.remove('active');
                    }, 2000);
                }

            } else {
                statusText.innerText = "裝卦出錯，請重試。";
                btnToss.disabled = false;
            }
        }
    } catch (e) {
        console.error("裝卦失敗:", e);
        statusText.innerText = "發生錯誤: " + e.message;
    }
}

function renderGua(data) {
    // 渲染本卦
    renderTable(benGuaBody, data.ben_gua.yaos, true);
    document.getElementById('ben-palace').innerText = `${data.ben_gua.palace}宮屬${data.ben_gua.palace_element}`;
    document.getElementById('ben-name').innerText = `${data.ben_gua.name} (${data.ben_gua.gua_type})`;

    // 渲染神煞
    const ssHtml = data.ben_gua.shen_sha && data.ben_gua.shen_sha.length > 0 ? `神煞：${data.ben_gua.shen_sha.join('、')}` : "";
    document.getElementById('ben-shen-sha').innerText = ssHtml;

    // 渲染變卦
    if (data.bian_gua) {
        document.getElementById('bian-gua-box').style.display = 'block';
        renderTable(bianGuaBody, data.bian_gua.yaos, false);
        document.getElementById('bian-palace').innerText = `本宮${data.ben_gua.palace}屬${data.ben_gua.palace_element}`;
        document.getElementById('bian-name').innerText = `${data.bian_gua.name}`;
    } else {
        document.getElementById('bian-gua-box').style.display = 'none';
    }
}

function renderTable(container, yaos, showChangeMarks) {
    container.innerHTML = "";
    // 從上爻到初爻 (第6到第1)
    for (let i = 5; i >= 0; i--) {
        const yao = yaos[i];
        const tr = document.createElement('tr');
        
        const graphicClass = yao.yao_type === '陽' ? 'yang-graphic' : 'yin-graphic';
        const mark = yao.is_shi ? '<span class="shi">世</span>' : (yao.is_ying ? '<span class="ying">應</span>' : '<span style="width:28px"></span>');
        
        let changeMark = '<span class="change-mark"></span>';
        if (showChangeMarks) {
            if (results[i] === 6) changeMark = '<span class="change-mark">×</span>';
            if (results[i] === 9) changeMark = '<span class="change-mark">○</span>';
        }

        tr.innerHTML = `
            <td>${yao.liu_shen}</td>
            <td>${yao.relation}</td>
            <td class="yao-cell">
                <div class="yao-graphic ${graphicClass}"></div>
                ${changeMark}
                ${mark}
            </td>
            <td>${yao.stem}${yao.branch}</td>
            <td>${yao.element}</td>
            <td>${yao.status ? `<span class="status-tag">${yao.status}</span>` : ''}</td>
        `;
        container.appendChild(tr);
    }
}

// 標籤切換
document.querySelectorAll('.nav-links li').forEach(li => {
    li.addEventListener('click', async () => {
        const tab = li.getAttribute('data-tab');
        
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        li.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        if (tab === 'history') {
            loadHistory();
        }
    });
});

async function loadHistory() {
    try {
        if (typeof eel !== 'undefined') {
            const history = await eel.get_history()();
            historyList.innerHTML = history.map(item => `
                <div class="history-item" id="history-item-${item.id}">
                    <div class="hist-info">
                        <strong>${item.timestamp}</strong> - ${item.data_json.question ? `[${item.data_json.question}] ` : ''}${item.ben_gua} -> ${item.bian_gua}
                        <br><small>${item.gan_zhi.year} ${item.gan_zhi.month} ${item.gan_zhi.day}</small>
                    </div>
                    <div class="hist-actions">
                        <button class="secondary-btn" onclick="copyHistoryForAI(${item.id})">複製解盤</button>
                        <button class="delete-btn" onclick="removeRecord(${item.id})">刪除</button>
                    </div>
                </div>
            `).join('');
            
            // 將 history 數據存在 window 對象以便複製功能使用
            window.lastHistoryData = history;
        }
    } catch (e) {
        console.error("載入歷史失敗:", e);
    }
}

async function removeRecord(id) {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;
    
    try {
        if (typeof eel !== 'undefined') {
            await eel.delete_record(id)();
            const el = document.getElementById(`history-item-${id}`);
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateX(20px)';
                setTimeout(() => el.remove(), 300);
            }
        }
    } catch (e) {
        console.error("刪除失敗:", e);
        alert("刪除失敗");
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        let textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}

function copyHistoryForAI(id) {
    const item = window.lastHistoryData.find(h => h.id === id);
    if (!item) return;
    
    const text = formatDataForAI(item.data_json);
    copyToClipboard(text).then(() => {
        alert("已複製該紀錄的解盤格式！");
    });
}

document.getElementById('btn-reset').addEventListener('click', () => {
    location.reload();
});

document.getElementById('btn-copy-ai').addEventListener('click', () => {
    if (!lastDivinationData) return;
    
    const text = formatDataForAI(lastDivinationData);
    copyToClipboard(text).then(() => {
        const btn = document.getElementById('btn-copy-ai');
        const originalText = btn.innerText;
        btn.innerText = "✅ 已複製！";
        btn.classList.add('success');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('success');
        }, 2000);
    }).catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動選取文字。');
    });
});

function formatDataForAI(data) {
    if (!data) return "無數據";
    const gz = data.gan_zhi || {};
    const kw = getKongWang(gz.day || "甲子");
    // 安全檢查：確保 shen_sha 存在且是陣列
    const shenShaData = data.ben_gua && data.ben_gua.shen_sha;
    const ss = (shenShaData && Array.isArray(shenShaData) && shenShaData.length > 0) ? shenShaData.join(', ') : '無';
    
    let output = `【六爻系統 V2.0 專業版 - 專業排盤解盤請求】\n\n`;
    
    // 1. 環境與神煞
    output += `### 1. 基礎環境與神煞\n`;
    output += `- **問卜事項**: ${data.question || '最後組裝失敗'}\n`;
    output += `- **占問時間**: ${data.timestamp}\n`;
    output += `- **干支**: ${gz.year}年 ${gz.month}月 ${gz.day}日 ${gz.hour}時\n`;
    output += `- **旬空**: ${kw}\n`;
    output += `- **神煞資訊**: ${ss}\n\n`;
    
    // 2. 本卦表格
    output += `### 2. 本卦：${data.ben_gua.name} (${data.ben_gua.palace}宮 - ${data.ben_gua.gua_type}, 屬${data.ben_gua.palace_element})\n`;
    output += `| 爻位 | 六神 | 六親 | 爻象 | 納甲 | 五行 | 狀態 | 世應 |\n`;
    output += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (let i = 5; i >= 0; i--) {
        const yao = data.ben_gua.yaos[i];
        const change = data.raw_scores[i] === 6 ? "×" : (data.raw_scores[i] === 9 ? "○" : " ");
        const shiYing = yao.is_shi ? "**世**" : (yao.is_ying ? "應" : " ");
        output += `| 第${i+1}爻 | ${yao.liu_shen} | ${yao.relation} | ${yao.yao_type}${change} | ${yao.stem}${yao.branch} | ${yao.element} | ${yao.status || ' '} | ${shiYing} |\n`;
    }
    output += `\n`;
    
    // 3. 變卦表格
    if (data.bian_gua) {
        output += `### 3. 變卦：${data.bian_gua.name}\n`;
        output += `| 爻位 | 六親 | 爻象 | 納甲 | 五行 | 世應 |\n`;
        output += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        for (let i = 5; i >= 0; i--) {
            const yao = data.bian_gua.yaos[i];
            const shiYing = yao.is_shi ? "**世**" : (yao.is_ying ? "應" : " ");
            output += `| 第${i+1}爻 | ${yao.relation} | ${yao.yao_type} | ${yao.stem}${yao.branch} | ${yao.element} | ${shiYing} |\n`;
        }
        output += `\n`;
    }
    
    // 4. 用神導引
    const findYao = (rel) => data.ben_gua.yaos.filter(y => y.relation === rel).map(y => `第${y.line}爻(${y.branch})`).join(', ') || '伏神';
    output += `### 4. 用神建議導引\n`;
    output += `- **求財運/交易/情感(男)**: 看妻財爻 [${findYao('妻財')}]\n`;
    output += `- **求官職/功名/情感(女)**: 看官鬼爻 [${findYao('官鬼')}]\n`;
    output += `- **求學問/文書/長輩**: 看父母爻 [${findYao('父母')}]\n`;
    output += `- **求子孫/平安/醫藥**: 看子孫爻 [${findYao('子孫')}]\n\n`;

    // 5. 解盤規範
    const changeCount = data.raw_scores.filter(s => s === 6 || s === 9).length;
    let rule = "";
    if (changeCount === 0) {
        rule = "0. 沒動爻：請解釋「本卦卦辭」，直接就本卦斷之。";
    } else if (changeCount === 1) {
        rule = "1. 一動爻：請解釋「本卦卦辭」與「該動爻爻辭」，以動爻爻辭為主。";
    } else if (changeCount === 2) {
        rule = "2. 兩動爻：請解釋「本卦卦辭」與「兩動爻爻辭」，以上爻為主，下爻為輔。";
    } else if (changeCount === 3) {
        rule = "3. 三動爻：請解釋「本、變兩卦卦辭」，以變卦為主，本卦為輔。";
    } else if (changeCount === 4) {
        rule = "4. 四動爻：請解釋「變卦卦辭」與「變卦中的兩個靜爻爻辭」，以下爻為主。";
    } else if (changeCount === 5) {
        rule = "5. 五動爻：請解釋「變卦卦辭」與「變卦中唯一的靜爻爻辭」。";
    } else if (changeCount === 6) {
        rule = "6. 六爻皆動：請解釋「變卦卦辭」，若是乾坤卦則參考用九用六。";
    }

    output += `### 5. AI 解盤執行規範\n`;
    output += `1. **動爻解讀規則**: ${rule}\n`;
    output += `2. **回答順序**: 請先直接回答占問結果，明確判斷成或不成、吉或凶、可行或不可行，以及事情偏快或偏慢，不限制回答句數；接著必須嚴格按照本次的動爻解讀規則，先解釋相關卦辭與爻辭，再依序使用六神、六親與五行生剋細說。可以詳細論證，但不可因為分析深入而模糊或迴避核心結論。\n`;
    output += `3. **卦辭與爻辭**: 不可只翻譯原文。請說明相關卦辭、爻辭對本次問題的具體指向，以及它們如何支持前述判斷。須依本次動爻數量選取解讀內容，不得忽略、混用或自行改變上述規則。\n`;
    output += `4. **六神分析**: 六神用來補充人物心理、事件特徵、隱憂與外在現象。請集中分析與世爻、應爻、用神及動爻有關的六神，不必逐爻堆砌術語。\n`;
    output += `5. **六親與用神**: 依占問事項明確選定用神，分析用神、世爻、應爻和動爻之間的生、剋、沖、合及彼此強弱，並把每項關係轉化成對現實結果的具體影響。\n`;
    output += `6. **五行旺衰**: 結合月建、日建、月破、旬空、動變與五行生剋，指出主要助力、最大阻力及變卦帶來的結果。神煞僅作輔助，不得取代卦爻辭、用神及旺衰判斷。\n`;
    output += `7. **禁止模糊斷語**: 不得只用「可能、或許、視情況、吉凶參半」等措辭迴避判斷。若正反訊號並存，必須比較力量強弱，說明哪一方占優，並給出最終傾向。資料不足以精確判斷日期時可明說，但仍須判斷整體趨勢。\n`;
    output += `8. **最終建議**: 結尾重申最終結果、最關鍵依據、最應採取的行動及最需要避免的行動。回答須明確、先結論後證據；解釋可以仔細完整，但不要重複排盤資料或為了面面俱到而失去立場。\n\n`;
    
    output += `請根據以上排盤數據與執行規範解盤。必須遵守本次動爻數量所對應的卦辭、爻辭解讀規則，並以明確、直接、有立場的方式回答當前問題。`;
    return output;
}

function getKongWang(dayGanZhi) {
    const stems = "甲乙丙丁戊己庚辛壬癸";
    const branches = "子丑寅卯辰巳午未申酉戌亥";
    const g = stems.indexOf(dayGanZhi[0]);
    const z = branches.indexOf(dayGanZhi[1]);
    
    if (g === -1 || z === -1) return "未知";
    
    const xunShouIdx = (z - g + 12) % 12;
    const kw1 = (xunShouIdx + 10) % 12;
    const kw2 = (xunShouIdx + 11) % 12;
    return branches[kw1] + branches[kw2];
}

// 開始初始化
init();
