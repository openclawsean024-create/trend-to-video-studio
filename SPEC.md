# 【Trend to Video Studio】規格計劃書

## 1. 專案概述

### 1.1 專案背景與目的

內容創作者最大的瓶頸不是靈感，而是「產出時間」——研究話題 2 小時、寫腳本 1 小時、錄音 30 分鐘、後製剪輯 2 小時，一支 3 分鐘的短影片要花 6 小時以上。本工具的願景是「端到端短影片自動化」：從一個趨勢話題出發，自動抓取相關資料 → AI 生成結構化腳本 → 配音 → 自動剪輯 → 產出可上傳的 MP4。目標是讓創作者把 6 小時的工作壓縮到 20 分鐘。
### 1.2 目標受眾（TA）

- YouTube Shorts 創作者 — 需要每週產出大量短影片，剪輯時間不夠用
- 自媒體運營者 — 在多個平台（抖音/小紅書/IG）同時經營，內容來不及製作
- 行銷團隊 — 需要快速針對時事做出反應，但影片製作來不及
- 新聞/評論自媒體 — 需要第一時間對熱門話題發表觀點，但腳本撰寫費時
### 1.3 專案範圍

### In Scope（做）

- 趨勢話題抓取（Dcard / PTT / Google Trends）
- 關鍵字過濾與情感分析 / 自動排程更新
- 腳本生成（輸入話題 + 受眾 → 輸出 60-90 秒結構化腳本）
- AI 配音（TTS，支援克隆聲音可選）
- 時間軸對齊（配音與字幕同步）/ 自動裁切（9:16 短片 / 16:9 橫版）
- 字幕生成（ASS 格式燒錄）/ 背景音樂自動添加 / MP4 輸出（1080p）
- 歷史腳本管理
### Out of Scope（不做）

- 直接發布到社群平台（只輸出影片檔案）/ 複雜剪輯（非線性剪輯）
- 虛擬人物生成（Avatar）/ 即時直播
## 2. 資訊架構與動線

### 2.1 網站地圖（Sitemap）

Trend to Video Studio：儀表板 → 話題探索頁 → 腳本編輯頁 → 影片剪輯頁 → 歷史記錄
### 2.2 使用者動線

```mermaid\nflowchart TD\n    A([創作者打開工具]) --> B[進入話題探索頁]\n    B --> C[看到 Dcard/PTT/Trends 熱門話題]\n    C --> D[選擇一個話題點擊]\n    D --> E[系統抓取話題資料 + AI 生成腳本]\n    E --> F[創作者預覽腳本]\n    F --> G{腳本質感滿意?}\n    G -->|需修改| H[手動編輯腳本]\n    G -->|確認| I[選擇配音設定]\n    H --> I\n    I --> J[點擊生成影片]\n    J --> K[後台：TTS 配音 + 字幕 + 剪輯]\n    K --> L[生成完成，進入預覽]\n    L --> M{滿意?}\n    M -->|是| N[下載 MP4]\n    M -->|否| O[調整字幕/比例/音樂]\n    O --> M\n    N --> P[上傳到 YouTube/TikTok]\n    P --> Q([完成])\n    B --> R[快速新增直接輸入話題]\n    R --> E\n```
### 2.3 使用者旅程圖

```mermaid\njourney\n    title 趨勢轉影片旅程\n    section 發現話題\n      早上打開儀表板看到趨勢話題: 5: 新聞自媒體\n      被某個 PTT 話題吸引: 4: 評論型創作者\n    section 腳本生成\n      點擊生成腳本: 5: 所有用戶\n      等待 30 秒腳本出來: 4: 所有人\n      快速瀏覽修改: 5: 創作者\n    section 影片生成\n      選擇配音聲音: 4: 內容創作者\n      點擊生成影片: 5: 所有用戶\n      等候 3-5 分鐘後台處理: 4: 所有人\n    section 完成發布\n      下載 MP4 並預覽: 5: YouTuber\n      上傳到 Shorts: 5: TikTok 創作者\n      收到第一個讚: 4: 所有創作者\n```
## 3. 視覺與 UI

### 3.1 品牌設計指南

- Primary: #6366F1 / Secondary: #0F172A / Accent: #10B981 / Warning: #F59E0B
- Background: #0B0F19 / Card BG: #1F2937 / Video Preview BG: #000000
- 字體：標題 Inter 700 / 內文 Inter 400-500 / 字幕 Noto Sans TC 600
## 4. 前端功能規格

- 話題探索頁：Dcard / PTT / Google Trends 話題列表，熱度排序，支援關鍵字過濾
- 話題熱度圖：視覺化一段時間內話題的熱度變化（折線圖）
- AI 腳本生成：選擇話題 + 受眾，輸出結構化腳本（鉤子→內容→CTA），60-90 秒長度
- 腳本預覽：文字逐段顯示 + 預估朗讀時長
- 腳本編輯：所見即所得編輯器，可修改段落
- 配音設定：TTS 聲音選擇（男/女/克隆），語速調整
- 自動字幕：根據配音內容自動生成，支援字體/大小/位置調整
- 影片比例切換：9:16（Shorts）/ 16:9（YouTube）一鍵切換
- 背景音樂：內建版權音樂庫，自動調整音量（隨人聲淡出）
- MP4 輸出：1080p，H.264 編碼，直接下載 / 歷史專案管理
## 5. 後端與技術規格

### 5.1 技術棧

- 前端框架：Next.js 14（App Router）+ Tailwind CSS
- 爬蟲：Scrapy（Dcard/PTT）+ Google Trends API
- AI 寫作：Claude API 或 GPT-4o / TTS：ElevenLabs API 或 Coqui TTS
- 影片剪輯：FFmpeg（字幕燒錄/比例裁切/音訊混合）
- 後端框架：FastAPI / 任務佇列：Celery + Redis / 儲存：Supabase Storage + Vercel KV
- 部署：Vercel（前端）+ Railway（後端 Worker）
## 6. 專案時程與驗收標準

### 6.1 里程碑時程

```mermaid\ntimeline\n    title Trend to Video Studio 開發時程\n    phase 1: 話題爬蟲 (Week 1-2)\n        Dcard API 分析與爬蟲 : 3 days\n        PTT 爬蟲實作 : 3 days\n        Google Trends API 串接 : 2 days\n        情感分析模組 : 3 days\n    phase 2: 腳本生成 (Week 3-4)\n        Claude API 串接 : 2 days\n        腳本 Prompt 設計與優化 : 4 days\n        腳本長度控制（60-90秒） : 2 days\n    phase 3: 配音與剪輯 (Week 5-6)\n        ElevenLabs API 串接 : 3 days\n        字幕生成與燒錄（FFmpeg） : 4 days\n        比例裁切（9:16/16:9） : 2 days\n        背景音樂混合 : 2 days\n    phase 4: 前端整合 (Week 7-8)\n        話題探索頁 : 3 days\n        腳本編輯頁 : 4 days\n        影片預覽頁 : 3 days\n        歷史記錄頁 : 2 days\n    phase 5: 測試與交付 (Week 9)\n        端到端測試（話題→腳本→影片） : 3 days\n        影片品質評估 : 2 days\n        Bug 修復與文件 : 3 days\n```
### 6.2 驗收標準

- 支援瀏覽器：Chrome 120+、Firefox 120+ / 每月主動用戶（目標）50 人以上
- 影片生成成功率 > 95% / 平均生成時間 < 5 分鐘（60 秒影片）
- 用戶留存（30天）> 40% / MP4 輸出品質 1080p / H.264 / 字幕同步準確率 > 90%
## 7. 功能勾選清單

### 前端

### 後端

### DevOps

