# 清大福青社學習主軸探索樂園（你在福青社都學什麼？）：3D 互動微縮專案紀錄 (island_project_notes.md)

最後更新時間：2026-11-15 22:58 ｜ 目前狀態：已完成 #15（Stage 15）— 待使用者確認後推送部署至 Cloudflare Workers (bwy-island)

---

## 跨模型接手狀態快照 (Handover Snapshot)

> **跨模型接手說明**：若因 Token 額度耗盡切換模型或開啟新對話，請先閱讀下表與「待辦事項 (TODO)」，即可直接從最新未完成階段無縫接續開發，無須重頭詢問。

| 狀態欄位 | 目前設定值 |
| :--- | :--- |
| **內容主題** | 社團學習主軸與多元活動介紹 |
| **視覺風格** | 01 溫暖玩具模型 |
| **空間比喻模型** | 06 主題遊樂園（中央福青熱氣球廣場 × 主題微縮園區） |
| **前端技術棧** | 原生 ES Modules + Three.js 0.170.0 CDN importmap |
| **主入口檔案** | `island.html` |
| **最新完成階段** | #15 Stage 15：加入 Google Tag / GTM 追蹤代碼 |
| **接手下一步指引** | 待使用者確認後推送部署至 Cloudflare Workers (bwy-island) |

---

## 待辦事項 (TODO)

| 階段編號 | 項目名稱 | 預計執行內容 | 狀態 |
| :--- | :--- | :--- | :--- |










| 無 | 本階段修改項目皆已全數結案 | 最新完成 #15（Stage 15：加入 Google Tag / GTM 追蹤代碼）。 | ✅ 無待辦 |

---

## 已完成事項 (Done)

| 編號 | 階段及項目名稱 | 完成內容摘要 | 我下的提示詞 |
| :--- | :--- | :--- | :--- |
| 01 | Stage 1<br>參考素材盤點、熱氣球主地標與8大主題遊樂園實作計畫 | 完成 113-1~115-1 五學期社課 CSV、福智文教官網與 3 份大專營手冊解析，提取 2026 第59屆大專營彩色方格熱氣球色票與 8 大主題遊樂園區拓撲，產出 implementation_plan.md 並執行個資去識別化規劃 | 問題1的回答<br>請將造島工作區根目錄放置在 "H:\我的雲端硬碟\Document\Antigravity2\環境設定\nthu-bwy\bwy_learning_island\"<br>過往社課資料可以參考 "H:\我的雲端硬碟\Document\Antigravity2\環境設定\nthu-bwy\社課資料"<br>有哪些活動也可以參考 "https://bwfoce.org/web/article/%E7%A6%8F%E6%99%BA%E9%9D%92%E5%B9%B4%E7%A4%BE-YoINZAN6Z2S5bm0Leemj.aZuumdkuW5tOekvg~~"<br>也可以參考 "E:\Users\Kermit\下載\福青\營隊手冊" 裡面對福智青年社的描寫<br><br>核心地標設定為福青熱氣球(如圖)<br>問題2：3D風格定調為 溫暖玩具風<br>問題3：空間設定為 主題遊樂園，例如：淨攤活動可以對應一片海灘、種樹可以對應微縮植物園、蹭飯團對應中式餐廳、蔬食對應西式快餐 |
| 02 | Stage 2<br>建立資料層與業務邏輯引擎 (island-data.js) | 封裝福青希望熱氣球主地標與 8 大主題遊樂園區完整結構化資料（含 113-1~115-1 社課與公開 Google 相簿連結、個資去識別化）、12 處微縮尋寶彩蛋、30 秒適性測驗權重與週三社課時間感知引擎 | 同意計畫 |
| 03 | Stage 3<br>建立響應式 UI 骨架與現代 CSS 設計系統 (index.html, island.css) | 完成語意化 HTML5 骨架（含原生 <main>、<search>、<dialog> 與無障礙文字目錄 <aside>）與溫暖玩具風響應式 CSS（100dvh、safe-area-inset、clamp 字級、粗指標 44x44px 熱區與 prefers-reduced-motion 支援） | 同意計畫 |
| 04 | Stage 4<br>建立 Three.js 溫暖玩具風 3D 引擎與福青熱氣球 + 8 大園區建模 (island-3d.js) | 完成 2026 第59屆大專營五色方格拼布熱氣球（含藤編籃與 5 位揮手夥伴）、3 顆伴飛小氣球、8 大主題遊樂園區微縮建築、環島小火車與 12 處彩蛋建模，並以 bakeStaticGroup 批次烘焙靜態幾何 | 同意計畫 |
| 05 | Stage 5<br>建立互動控制器、日夜光影、音效合成與彩蛋尋寶整合 (island-app.js) | 完成 XSS-safe 動態 DOM 渲染控制器、Web Audio 溫暖木琴音效合成器、四時段日夜光影切換、遊園小火車跟隨視角、30 秒適性測驗與 12 處彩蛋 localStorage 持久化集章 | 同意計畫 |
| 06 | Stage 6<br>雙視窗 E2E 自動化煙霧與無障礙稽核驗收 (audit_island_e2e.py) | 通過 desktop_1280、mobile_360_narrow 與 mobile_390_std 全視窗零 Console/Page Error、零水平溢位、零觸控熱區警告、prefers-reduced-motion 動態減量與 bakeStaticGroup 76.4% 幾何合併率驗收 | 同意計畫 |
| 07 | Stage 7<br>修正 file:// 本地直接拖曳開啟之 CORS 阻擋問題（雙棲載入架構） | 將 island-data.js、island-3d.js、island-app.js 改為無需 CORS 預檢之標準 defer 腳本，搭配 index.html 內嵌模組載入 Three.js CDN，支援直接拖曳 index.html (file://) 與 HTTP 伺服器雙模式零錯誤渲染 | 為什麼我直接把 index.html 拉到瀏覽器開啟，看到的畫面中央空空的 |
| 08 | Stage 8<br>新增全球福青遊艇碼頭（61 校一覽表）與天空之城蔬食浮島跨企劃連動驛站 | 於樂園南側海灣與高空新增兩座跨界建築：（1）Z09 全球福青揚帆遊艇碼頭（含紅白條紋海港燈塔、延伸木棧碼頭與雙揚帆動態遊艇），點擊即列出福智文教基金會官方公告之台灣 7 大區（台北 16、桃園 5、新竹 3、台中 11、雲嘉 6、台南 4、高雄屏東 6）與北美 3 大區（美國加州 4、美國紐約 4、加拿大溫哥華 2）共 61 處大專校院福青社及讀書會一覽表，並支援全螢幕分區篩選與關鍵字檢索；（2）Z10 天空之城・蔬食浮島飛空艇驛站，將姊妹企劃《2026 清大福青社蔬食地圖：天空之城浮島》之清華展開三簡冊校門、青花菜熱氣球、摸肚子可愛黃色奶蛙、落腳小雲朵、清大 75 秒橫式讀秒紅綠燈與紫色連帽衫清華胖達微縮建模至島上，點擊可查看 TOP 10 必吃蔬食餐廳並一鍵傳送至天空之城浮島。 | 1.請幫我想想島上可以新增什麼建築，讓它跟之前的企劃  蔬食地圖-天空之島 "d:\xampp\htdocs\Other\NTHU_BWY_veggie\about\island_project_notes.md" 連動<br>2.請新增一座遊艇碼頭設施，點擊會列出 "https://bwfoce.org/web/article/%E5%85%A8%E7%90%83%E7%A6%8F%E6%99%BA%E9%9D%92%E5%B9%B4%E7%A4%BE%E4%B8%80%E8%A6%BD%E8%A1%A8-YoINvZN6Z2S5bm0Leemj.aZuumdkuW5tOekvg~~" 這邊介紹的"全球福智青年社一覽表" |
| 09 | Stage 9<br>修正天空之城蔬食地圖跨島傳送門連結為 GitHub Pages 正式線上網址 | 更新 assets/island/island-data.js 中 Z10 天空之城・蔬食浮島飛空艇驛站與 BWY_SKY_ISLAND_LINK 之跨島傳送門網址，移除本機 file:// 連結，全面改為指向線上正式網址 https://kermit548.github.io/NTHU_BWY_veggie/island.html 與 https://kermit548.github.io/NTHU_BWY_veggie/about/2026_island_dev.html。 | 傳送到天空之島請不要是本機連結，要連到 "https://kermit548.github.io/NTHU_BWY_veggie/island.html" |
| 10 | Stage 10<br>Z10 天空之城驛站改版：移除奶蛙與簡冊立柱、替換為公共藝術「清鏡門」並更新校外蔬食地圖連結 | 針對 Z10 天空之城・蔬食浮島飛空艇驛站完成三項視覺與連結優化：（1）移除 3D 場景與文案中造型過於抽象的黃色奶蛙；（2）移除簡冊立柱，改為精細建構清大公共藝術「清鏡門」3D 模型（包含外圍灰石框、四格青綠鏡面玻璃牆、前方 1/3 比例巴洛克白色北京清華二校門、四根羅馬圓柱、黑底金字門匾、左右對稱側翼小拱門與捲渦柱頭及花圃綠籬）；（3）將雙島連動區塊原本的「GitHub 專案庫」按鈕替換為「完整校外蔬食地圖」，直連 Google My Maps 新竹蔬食地圖正式網址。 | 關於Z10<br>01.奶蛙(圖1)的造型太抽象了，請移除<br>02.簡冊立柱(圖2)也變成很奇怪的樣子，移除，將代表模型替換為公共藝術「清鏡門」(1/3比例的北京清華校門，外嵌一片包圍的玻璃鏡子，如圖2~圖6)<br>03.因為下面已經有專案連結了，上方的"💻 GitHub 專案庫" 請換成 "[完整校外蔬食地圖](https://www.google.com/maps/d/u/0/viewer?mid=1pRX1QdNBgRvGR4L5ckNvlSUIIl2OQDX0&femb=1&ll=24.80140222282343%2C120.98331584673566&z=13)" |
| 11 | Stage 11<br>建立 Wrangler 靜態資產設定並正式部署上線 Cloudflare Workers (bwy-island) | 建立 wrangler.jsonc（name: bwy-island、compatibility_date: 2026-11-14、observability 開啟 logs/traces）與 .assetsignore（排除 about/、desktop.ini、wrangler.jsonc 與 .wrangler/），通過 --dry-run 預檢後使用 npx.cmd wrangler deploy 正式部署至 https://bwy-island.u940105.workers.dev（Version ID: 1e4f5302-7ac4-4c6a-972f-8449d2045f3e），並於線上實測零報錯與 Z10 連結皆正確生效。 | 確認部署到 bwy-island，完成後執行 /compact 壓縮對話 |
| 12 | Stage 12<br>視覺沉浸度調整、彩蛋點擊優先權、左側篩選整合與導覽列精簡 | 1. 主熱氣球與伴飛氣球基準高度抬升 +1.4，下沉不觸地；2. 新增無邊際深藍海域 (#133a5c) 與霧效無縫銜接；3. egg-02 更名為「蒙民偉樓 315 福青社窩 社課歡迎立牌」；4. 彩蛋新增發光信標環與 R=1.35 感應球，pointerup 優先於園區大碰撞盒觸發並支援 hover 游標；5. 移除頂部主題列並將搜尋框與「主題篩選」複選下拉整合進左側目錄抽屜，動態校準抽屜 top 避免重疊；6. 移除導覽列雙徽章並更新主標為「在福青社可以學什麼？」；7. 量測並規劃手機版頂欄精簡方案待核可。 | 1.熱氣球離地高度可以再高一點，不然下沉的時候都沉到陸地下了(圖1)<br>2.背景這樣分界感太強(圖2)，將 #F9E8C8 調整成一致的暗藍色，營造一整片海洋的感覺<br>3.尋寶的[#02 水木 241 社課歡迎立牌] 改成 [蒙民偉樓 315 福青社窩 社課歡迎立牌]<br>4.尋寶的黃色立方體(圖3)很難點，常常點了都沒有變色，只能利用頂端圖鑑導覽[飛往查看]才會變色，請改個好互動的方式<br>5.主題列會遮擋到左邊跟右邊的資訊卡(圖4)，它應該直接整合在左側的[🎡 樂園導覽地圖]，平常不顯示，保留搜尋框，其餘主題濃縮成一個[主題篩選]的下拉複選選單放在搜尋框旁<br>6.導覽列(圖5)的 "2026 第 59 屆大專營主視覺"、"🎈 歡迎光臨清大福青樂園｜每週三 18:30 溫馨共餐"，都拿掉，標題 "清大福青社｜你在福青社都學什麼？" 改成 "在福青社可以學什麼？"<br>7.手機畫面的"導覽列"(圖6)占太大面積了，請提出改善方案 |
| 13 | Stage 13<br>彩蛋本體融入、地圖漢堡鈕與手機端方案 A 導覽重構及 Cloudflare 部署 | 1. 移除所有飄浮彩蛋菱形與發光光環，改以 registerTreasureHitbox 將 12 處彩蛋直接綁定於實景物件本體（含綠蠵龜母子、映心凍茶杯、未來漢堡、Z10 清鏡門替換 egg-08 等）；2. 漢堡選單加上「🗺️ 地圖」文字並移除「🎈 熱氣球主廣場」按鈕；3. 手機版實作方案 A（第 1 排：☰地圖＋標題＋適合我的活動；第 2 排單行橫滑膠囊＋⋯更多選單），高度由 156px (18.5%) 降至 81px (9.6%) 且初次載入預設收合詳情抽屜；4. 通過雙端 E2E 稽核與實點擊驗證並部署至 Cloudflare Workers bwy-island。 | 既然是"彩蛋"，我覺得應該不是要強化什麼發光信標，應該是要融入整體，例如[#06 微笑綠蠵龜母子] 本身烏龜就是點擊點，不要飄一個立方體在那邊遮住烏龜(圖1)，其他像是 [#04 晶透茶香「映心凍」] 可以是茶杯本身，[#03 特蔬任務巨無霸未來漢堡]就是漢堡]、[#08 綠色保育標章小石虎立牌] 不明顯換成點擊 Z10 的清鏡門觸發<br><br>手機版「導覽列」改善方案採方案A，但第 1 排保留「☰ ＋ 標題 ＋[適合我的活動]」精簡入口，初次進入手機版先收合詳情抽屜（待點擊建築時再滑出）；<br>不管桌機版還是手機版，漢堡選單加上"🗺️ 地圖"說明文字，移除[🎈 熱氣球主廣場]按鈕<br><br>完成後重新推送部署至 Cloudflare Workers（bwy-island） |
| 14 | Stage 14<br>全球福青社按鈕整併至更多選單下方並重新部署 | 1. 將 #btn-open-global-clubs 移入 #hud-more-group 且置於 #btn-open-about (四大願景) 下方；2. 點擊後同步自動收合手機更多選單；3. 通過雙端 E2E 與 Playwright 驗證並完成 Cloudflare Workers (bwy-island) 部署。 | 手機版請把[⛵全球福青社 (61)] 放在[📖 四大願景] 的下面，讓畫面更乾淨<br>一樣調整完請重新推送部署至 Cloudflare Workers（bwy-island） |
| 15 | Stage 15<br>加入 Google Tag / GTM 追蹤代碼 | 於 index.html 與 island.html 之 head 區段安插指定 GTM-N2KRPRRK 追蹤代碼並通過雙端 E2E 稽核。 | 請協助我在網頁安插追蹤代碼<br><br><script async src="https://www.googletagmanager.com/gtm.js?id=GTM-N2KRPRRK"></script><br><script><br>window.dataLayer = window.dataLayer \|\| [];<br>function gtag(){dataLayer.push(arguments);}<br>gtag('js', new Date());<br></script> |
