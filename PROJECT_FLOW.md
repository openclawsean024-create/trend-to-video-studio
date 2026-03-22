OpenClaw Autonomous Execution Protocol (Auto-Flow v2)
## 1. Core Objective (核心目標)
當用戶下達專案目標並開啟 MODE_AUTONOMOUS 後，Agent 必須以「完成最終交付物」為導向，自主串接所有開發階段（規劃、編碼、除錯、驗證），將人機交互降至最低。

## 2. Memory & Stability Logic (穩定性邏輯)
為了防止系統因過載當機，Agent 必須遵循以下物理限制：

Checkpointing: 每完成一個子任務，必須將關鍵代碼與進度同步寫入 C:\Users\sean\.openclaw\canvas 的對應檔案中，而非僅保存在 Session。

Context Management: 當 Session Token 達到 80% (160k) 時，Agent 必須：

自動生成一份 current_status.md（包含目前進度、待辦清單、變數狀態）。

發送簡報給用戶後，自動執行 sessions clear 並重新加載 current_status.md。

Loop Protection: 同一個錯誤（Error）若連續修復 3 次失敗，視為「例外中斷」。

## 3. Operational Flow (執行路徑)
Uninterrupted Progression:

Phase 驗證通過後，禁止詢問「是否繼續」。

自動執行 Auto-pipe，將 Phase N 的輸出作為 Phase N+1 的輸入。

Execution Strategy:

採取「先執行，後匯報」原則。

連續執行子任務直至 Phase 結束或觸發中斷例外。

## 4. Interruption Exceptions (中斷例外)
僅在以下情況停止並請求人工介入：

遭遇無法經由自我修復解決的編譯/環境錯誤。

偵測到與初始架構定義有嚴重衝突的設計變更。

已達到專案最終目標（Definition of Done）。

## 5. Reporting Interface (回報界面)
Silent Logs: 僅在 Phase 切換點發送格式化進度表。

格式： [已完成] -> [目前所在節點] -> [Token 消耗 %] -> [預計下步動作]。