/**
 * 清大福青社「你在福青社都學什麼？」3D 溫暖玩具風主題遊樂園
 * Stage 2: 資料層與業務邏輯引擎 (island-data.js)
 *
 * 資料來源：
 * 1. 清大福青社 113-1、113-2、114-1、114-2、115-1 五學期真實社課行事曆與公開活動相簿
 * 2. 第 50 屆 (2019)、2021、2025、2026 第 59 屆《大專青年生命成長營》學員手冊
 * 3. 財團法人福智文教基金會福智青年社專頁 (bwfoce.org)
 * 4. 嚴格執行個資去識別化：移除內部人員單名與私人 NAS 短網址，僅保留公開相簿與群體稱謂
 */

(function (global) {
  'use strict';

const BWY_META = {
  title: '清大福青社｜你在福青社都學什麼？',
  subtitle: '3D 溫暖玩具主題遊樂園 · 探索八大學習主軸與社課日常',
  slogan: '成為帶給世界溫暖與希望的人',
  englishSlogan: 'Become Someone Who Brings Warmth and Hope to the World',
  clubTime: '每週三 18:30 溫馨共餐 · 19:00–20:30 社課',
  clubLocation: '國立清華大學 蒙民偉樓（活中 207 / 水木展演廳）',
  academyInfo: '新竹福青學堂：每週六上課｜新竹市忠孝路 45 號 2 樓',
  globalStats: {
    foundedYear: 1998,
    overseasYear: 2008,
    globalCampuses: 53,
    pillarsCount: 8,
    semestersArchived: 5
  },
  fourVisions: [
    {
      id: 'vision-nature',
      title: '創造生生不息的自然環境',
      desc: '從蔬食、淨塑、水苔球手作到海岸種樹，用日常小行動療癒地球。'
    },
    {
      id: 'vision-friends',
      title: '成就誠信互助的道義之交',
      desc: '在蹭飯團與社課共餐中，遇見沒有利害關係、彼此扶持的真摯善友。'
    },
    {
      id: 'vision-mind',
      title: '體驗永恆不壞的心靈之樂',
      desc: '透過觀功念恩（OMAK）、SEE-L 情緒覺察與讚頌樂音，找回內心平靜。'
    },
    {
      id: 'vision-career',
      title: '成辦造福大眾的智慧事業',
      desc: '參與大專營、名人職涯講座與校園感恩服務，確立利他的人生志向。'
    }
  ]
};

const BWY_CATEGORIES = [
  { id: 'all', label: '全部園區 (10)', shortLabel: '全部', color: '#E26345' },
  { id: 'sustainability', label: '蔬食與環境永續 (3)', shortLabel: '環境蔬食', color: '#68B645' },
  { id: 'companionship', label: '善友陪伴與共餐 (1)', shortLabel: '蹭飯共餐', color: '#D94E34' },
  { id: 'mindfulness', label: '情緒覺察與讚頌 (2)', shortLabel: '心靈情緒', color: '#5AA4D6' },
  { id: 'gratitude', label: '觀功念恩與卡傳 (1)', shortLabel: '感恩卡傳', color: '#E87A90' },
  { id: 'growth', label: '生命營隊與職涯 (1)', shortLabel: '營隊領航', color: '#F59E0B' },
  { id: 'network', label: '全球碼頭與天空之島 (2)', shortLabel: '跨校連動', color: '#2B8A9E' }
];

const BWY_CENTRAL_HUB = {
  id: 'hub-balloon',
  code: 'HUB',
  name: '福青希望熱氣球主廣場',
  shortName: '希望熱氣球',
  category: 'core',
  categoryLabel: '核心地標 · 第 59 屆大專營主視覺',
  metaphor: '五色方格拼布熱氣球 × 藤編吊籃與五位揮手福青夥伴',
  position: { x: 0, y: 0, z: 0 },
  cameraOffset: { x: 0, y: 14, z: 24 },
  lookAtOffset: { x: 0, y: 6.5, z: 0 },
  color: '#E26345',
  accentColor: '#F5C73B',
  palette: ['#E26345', '#F5C73B', '#5AA4D6', '#95CD4F', '#F8F0D8'],
  elevatorPitch:
    '如果朋友問你「你在福青社都學什麼？」，你可以這樣回答：我們在學怎麼照顧自己的心、怎麼對身邊的人說謝謝、怎麼用吃飯與淨灘愛護地球，而且每週三晚上都有一桌熱騰騰的飯菜和一群溫暖的朋友等你回來！',
  coreSkills: [
    '觀功念恩（OMAK）正向視角',
    'SEE-L 社會情緒覺察力',
    '永續蔬食與減塑行動力',
    '跨科系團隊企劃與善友連結'
  ],
  whyWeLearn:
    '大專青年生命成長營以「成為帶給世界溫暖與希望的人」為號召。回到清大校園後，福智青年社就是大家持續充電、把感動化為行動的基地。不論你是想找人一起吃晚餐、想學情緒減壓，還是想做手作、去海邊淨灘，都能從這座熱氣球廣場出發，走進 8 大主題遊樂園區！',
  highlights: [
    '每週三 18:30 免費／銅板價溫馨共餐，19:00–20:30 主題社課',
    '全球 53 所大學同步串聯：卡片傳恩情、蔬食週、手護海洋淨灘',
    '寒暑假大專青年生命成長營、熊月山莊 Fun 心二日營與福青學堂延伸學習'
  ],
  courses: [
    {
      semester: '115-1',
      date: '09/16 (三)',
      title: '期初大會：真正高興見到你',
      place: '清大水木展演廳',
      summary: '新學期的第一場相遇，邊享用熱騰騰蔬食晚餐邊認識本學期八大主題活動。',
      albumUrl: 'https://photos.app.goo.gl/ymsmfLBw2ByZZnBk7'
    },
    {
      semester: '115-1',
      date: '09/10 (四)',
      title: '社團博覽會《初相遇》我們在 D5 等你',
      place: '清大桌球館前攤位 D5',
      summary: '穿梭喧鬧社博，體驗蔬食互動小遊戲與感恩卡片驛站，開啟大學新生活。',
      albumUrl: 'https://photos.app.goo.gl/RyqcGxNyvkq5R3PN9'
    },
    {
      semester: '114-1',
      date: '09/04 (四)',
      title: '社團博覽會《卡片驛站》',
      place: '蒙民偉樓前廣場 A16',
      summary: '闖關換取暖心點心，挑張卡片寫下真實感謝，由福青社免費為你寄出。',
      albumUrl: 'https://photos.app.goo.gl/UFpzmQWb22VkTgNs5'
    },
    {
      semester: '113-2',
      date: '02/23 (日)',
      title: '福青社團幹訓：逗陣學起來',
      place: '清大蒙民偉樓 101',
      summary: '代人著想、觀功念恩養成訓練，掌握撰寫企劃書的黃金法則與跨校交流。',
      albumUrl: 'https://photos.app.goo.gl/TZhR8HbVv9At81FM9'
    }
  ]
};

const BWY_ZONES = [
  {
    id: 'zone-veggie-diner',
    code: 'Z01',
    name: '西式蔬食快餐館',
    shortName: '蔬食快餐館',
    subtitle: '蔬食月 × 特蔬任務 DIY × 植感生活展',
    category: 'sustainability',
    categoryLabel: '飲食永續 · 蔬食推廣',
    metaphor: '美式復古蔬食漢堡薯條快餐店與戶外紅傘座席',
    position: { x: 13.5, y: 0, z: 22.2 },
    cameraOffset: { x: 21.5, y: 9.5, z: 31.2 },
    lookAtOffset: { x: 13.5, y: 2.2, z: 22.2 },
    color: '#E26345',
    accentColor: '#F5C73B',
    activeMonths: [10, 11],
    elevatorPitch:
      '我們把「推廣蔬食」變成像經營美式快餐店一樣潮流！從校慶運動會擺攤、旺宏館植感生活靜態展、蔬食電影院，到親手製作映心凍與夏日優格杯，用美味認識低碳生活。',
    coreSkills: [
      '低碳飲食與植化素營養學',
      '校園大型擺攤與策展企劃',
      '創意蔬食甜點 DIY 實作',
      '新竹在地蔬食地圖探索'
    ],
    whyWeLearn:
      '根據大專營《我和我的蔬食態度》教材，全世界有 70% 水資源用於農業，生產動物性食物耗費的水資源更是植物性飲食的 10 倍。在福青社，吃蔬食不是嚴肅的口號，而是和朋友一起研發料理、逛夜市不塑趴、看雙胞胎飲食實驗紀錄片的美味探險！',
    highlights: [
      '每年 11 月「特蔬任務」蔬食月：校慶運動會擺攤與旺宏館走廊靜態展',
      '特色手作課：大道茶文化協會《映心凍》DIY、《夏日優格杯》無痕體驗',
      '蔬食電影院：《人如其食：雙胞胎飲食實驗》紀錄片觀影與思辨交流'
    ],
    courses: [
      {
        semester: '114-2',
        date: '05/27 (三)',
        title: '夏日優格杯 DIY × 無痕生活實驗室',
        place: '清大水木展演廳',
        summary: '零包裝手作清爽優格杯，在炎夏中以輕負擔飲食開啟內心澄澈對話。',
        albumUrl: 'https://photos.app.goo.gl/DDg9yyhPvQArN44S6'
      },
      {
        semester: '114-1',
        date: '11/26 (三)',
        title: '舌尖上的地球：蔬食電影院《人如其食》',
        place: '清大蒙民偉樓 207',
        summary: '透過雙胞胎飲食實驗紀錄片，看見飲食選擇如何同時改變個人健康與地球環境。',
        albumUrl: 'https://photos.app.goo.gl/9pfHBaRrxE192dT2A'
      },
      {
        semester: '114-1',
        date: '11/19 (三)',
        title: '【特蔬任務】蔬動全場 & 運動會擺攤',
        place: '清大蒙民偉樓 101 / 校慶攤位',
        summary: '週三傍晚下課後不趕路，品嚐剛出鍋的溫熱蔬食料理，體驗咀嚼的香與朋友的笑。',
        albumUrl: 'https://photos.app.goo.gl/5kj6tb1EdZxzrFn59'
      },
      {
        semester: '114-1',
        date: '11/05–11/11',
        title: '植感生活：從餐桌開始（蔬食月靜態展）',
        place: '清大旺宏館走廊',
        summary: '為期一週的校園海報與互動展覽，帶全校師生認識五色植化素、碳中和與餐桌選擇。',
        albumUrl: 'https://photos.app.goo.gl/34XC14XaKpG1zY6H9'
      },
      {
        semester: '113-1',
        date: '11/27 (三)',
        title: '【特蔬任務】我一點也不怕「蔬」× 映心凍 DIY',
        place: '清大蒙民偉樓 207',
        summary: '與大道茶文化協會合辦，享用有機蔬食晚餐並親手製作外面學不到的晶透「映心凍」。',
        albumUrl: 'https://photos.app.goo.gl/1gyCW7dJ4f9RH1wa7'
      }
    ]
  },
  {
    id: 'zone-chinese-feast',
    code: 'Z02',
    name: '中式團圓飯館',
    shortName: '蹭飯團飯館',
    subtitle: '開學蹭飯團 × 週三溫馨共餐 × 期末百家菜饗宴',
    category: 'companionship',
    categoryLabel: '善友陪伴 · 家的溫暖',
    metaphor: '高掛紅燈籠、木格花窗與圓桌蒸籠的中式團圓餐館',
    position: { x: 14.5, y: 0, z: 10.5 },
    cameraOffset: { x: 22.5, y: 9.5, z: 19.5 },
    lookAtOffset: { x: 14.5, y: 2.2, z: 10.5 },
    color: '#D94E34',
    accentColor: '#F4B942',
    activeMonths: [2, 6, 8, 9, 12],
    elevatorPitch:
      '一個人吃飯太孤單？來福青社「蹭飯團」就對了！每週三 18:30 社課前都有熱騰騰的家常蔬食共餐，期末還有輔導老師手作窯烤麵包、牛番茄燉麵、芋頭西米露與潤餅大餐，像在清大的第二個家！',
    coreSkills: [
      '脫離手機的真實人際破冰',
      '傾聽陪伴與情感支持',
      '家常蔬食共煮與惜食文化',
      '跨年級家族溫馨傳承'
    ],
    whyWeLearn:
      '大學生活節奏飛快，許多人習慣獨自對著螢幕吃飯。福青社堅持每週三 18:30 先一起吃頓飯，因為「有些故事，還是見面說最好」。在輔導老師群與學長姐無私準備的拿手菜餚中，我們體會到被家人呵護的溫暖，也學會把這份溫暖分享給新朋友。',
    highlights: [
      '開學前《很久沒見了捏！開學前蹭飯聚聚吧》迎接新生與老朋友回娘家',
      '每週三 18:30–19:00 固定社課溫馨晚餐時光，50 元銅板價或免費共食',
      '期末《拾光·饗宴》：手作窯烤麵包、大溪黑豆乾、炒麵疙瘩、牛番茄燉麵、芋頭西米露與送舊祝福'
    ],
    courses: [
      {
        semester: '115-1',
        date: '09/06 (日)',
        title: '很久沒見了捏！開學前蹭飯聚聚吧',
        place: '清大蒙民偉樓 4 樓',
        summary: '有些故事還是見面說最好！開學前一起吃頓飯、交換夏天的心情，陪伴新生迎接大學生活。',
        albumUrl: 'https://photos.app.goo.gl/Rs2wotLcUNCs6QTw8'
      },
      {
        semester: '114-2',
        date: '06/03 (三)',
        title: '拾光·饗宴：期末蔬食自助餐 × 畢業歡送',
        place: '清大蒙民偉樓 207',
        summary: '輔導老師群準備豐盛家常蔬食自助餐，邊吃邊聊這學期的收穫，並親手製作關懷包祝福畢業學長姐。',
        albumUrl: 'https://photos.app.goo.gl/TjqADgJjT6yUFdTGA'
      },
      {
        semester: '114-1',
        date: '12/10 (三)',
        title: '如果有的話就吃兩頓｜期末共餐與深聊小遊戲',
        place: '清大蒙民偉樓 207',
        summary: '沒有什麼是一頓飯解決不了的！透過溫暖晚餐與互動問答，發現夥伴們不為人知的小故事。',
        albumUrl: 'https://photos.app.goo.gl/yWiH83QX2WMmGtpMA'
      },
      {
        semester: '114-1',
        date: '08/31 (日)',
        title: '開學，想見你｜期初關懷保溫餐聚',
        place: '清大蒙民偉樓 4 樓',
        summary: '穿越暑假與營隊，在開學前夕用豐盛美食與破冰遊戲重逢相聚。',
        albumUrl: 'https://photos.app.goo.gl/6i66eDQaHvRKqJUf8'
      }
    ]
  },
  {
    id: 'zone-beach-cleanup',
    code: 'Z03',
    name: '陽光淨灘海灣',
    shortName: '陽光淨灘灣',
    subtitle: '手護海洋 × 南寮跨校淨灘 × 無痕生活實驗室',
    category: 'sustainability',
    categoryLabel: '海洋護生 · 減塑行動',
    metaphor: '蔚藍漸層海浪、金色沙灘、微笑綠蠵龜與淨灘竹簍海灣',
    position: { x: 18.0, y: 0, z: -1.5 },
    cameraOffset: { x: 26.5, y: 9.5, z: 6.5 },
    lookAtOffset: { x: 18.0, y: 1.8, z: -1.5 },
    color: '#3B9AB2',
    accentColor: '#F2D16B',
    activeMonths: [4, 5, 9],
    elevatorPitch:
      '我們不只在教室談環保，更直接揪團去新竹南寮漁港海邊淨灘！透過跨校《手護海洋，淨一份心》與《無痕生活實驗室》，親手撿起海廢、守護海龜與海洋生態。',
    coreSkills: [
      '海岸廢棄物清理與源頭分類',
      '無痕飲食與減塑生活設計',
      '跨校大型志工活動協作',
      '生態保育與萬物同理心'
    ],
    whyWeLearn:
      '塑膠微粒與一次性廢棄物正威脅無數海洋生物的生命。福青社結合世界淨灘日與校內「無痕生活實驗室」，帶領清大同學走出校園、踏上南寮觀音亭南岸沙灘，體會「一片乾淨的沙灘，是對大海的尊重；一次淨灘行動，是對地球的愛護」。',
    highlights: [
      '9 月世界淨灘日：新竹南寮漁港觀音亭南岸沙灘《手護海洋，淨一份心》跨校淨灘',
      '5 月《無痕生活實驗室》：結合淨灘減塑與自備環保餐具的低碳生活提案',
      '社團夜市「不塑之客」行動：揪團逛夜市自備環保盒杯，達成零一次性垃圾挑戰'
    ],
    courses: [
      {
        semester: '115-1',
        date: '10/14 (三)',
        title: '《森活元素》美味與環保一次擁有',
        place: '清大風雲樓 3 樓國際學生活動中心',
        summary: '探索餐桌選擇與環境保護之間的連結，在輕鬆遊戲中培養不塑生活習慣。',
        albumUrl: 'https://photos.app.goo.gl/untsEW5eDKiqKwCs9'
      },
      {
        semester: '114-2',
        date: '05/13 (三)',
        title: '【無痕生活實驗室】淨灘減塑與低碳日常提案',
        place: '清大蒙民偉樓 207 / 水木展演廳',
        summary: '從海洋廢棄物真相出發，探索大學生在宿舍與外食中可立即實踐的無痕減塑提案。',
        albumUrl: 'https://photos.app.goo.gl/QeWZTy4p2LgTL1wR6'
      },
      {
        semester: '114-1',
        date: '09/20 (六)',
        title: '《手護海洋，淨一份心》南寮漁港跨校淨灘',
        place: '蒙民偉樓 102 集合 → 南寮漁港觀音亭南岸沙灘',
        summary: '結合海洋護生理念介紹與實地沙灘淨灘行動，號召清大師生彎腰守護新竹海岸線。',
        albumUrl: 'https://photos.app.goo.gl/UFpzmQWb22VkTgNs5'
      }
    ]
  },
  {
    id: 'zone-botanical-garden',
    code: 'Z04',
    name: '綠意微縮植物園',
    shortName: '微縮植物園',
    subtitle: '種樹護地球 × 苔苔不絕水苔球 × 綠色保育標章',
    category: 'sustainability',
    categoryLabel: '大地復育 · 綠手指手作',
    metaphor: '圓頂玻璃溫室、海岸防風林樹苗與懸掛水苔球花園',
    position: { x: 11.5, y: 0, z: -15.0 },
    cameraOffset: { x: 19.5, y: 9.5, z: -22.5 },
    lookAtOffset: { x: 11.5, y: 2.2, z: -15.0 },
    color: '#68B645',
    accentColor: '#A8E063',
    activeMonths: [3, 9, 10],
    elevatorPitch:
      '想幫書桌添一抹綠意，或去海邊親手種下一棵樹嗎？在這裡我們學習揉製超可愛的「水苔球」植栽送給老師與自己，並認識慈心「種樹護地球」與守護農田動物的「綠色保育標章」！',
    coreSkills: [
      '日式水苔球（Kokedama）園藝手作',
      '海岸造林與防風林生態知識',
      '辨識有機驗證與綠色保育標章',
      '農業碳匯與生物多樣性素養'
    ],
    whyWeLearn:
      '從 2010 年起，慈心基金會推動「種樹護地球」與「綠色保育標章」，迄今已守護 935.7 公頃農地與 46 種保育物種。我們在社課中親手將泥土、水苔與綠植揉成圓滾滾的《苔苔不絕心意球》，讓照顧植物成為培養耐心與關愛大地的起點。',
    highlights: [
      '人氣手作社課《苔苔不絕心意球》：親手製作水苔球盆栽，綠化宿舍並作為教師節心意禮',
      '春日《種樹護地球》行動：認識台灣海岸線貧瘠沙地造林與護樹實踐',
      '《動物和牠們的棲地》綠保標章解密：學會用日常消費支持不灑農藥的友善農田'
    ],
    courses: [
      {
        semester: '115-1',
        date: '11/08 (日)',
        title: '《菜鳥出任務：有機農場大冒險》富林有機農場參訪',
        place: '新竹芎林 富林有機農場',
        summary: '走進有機農場探索田間生態與食農教育，親手下田採菜、分組烹調現摘午餐並挑戰「米蛋捲 DIY」，在大自然中徹底充電。',
        albumUrl: 'https://youtu.be/6Zl7W2hzeoo',
        linkLabel: '🎬 觀看活動回顧影片'
      },
      {
        semester: '114-2',
        date: '03/25 (三)',
        title: '蔬食新手村｜從土地理念到上桌的第一餐',
        place: '清大蒙民偉樓 207',
        summary: '認識有機友善耕作、綠色保育標章與土地復育，體會農夫與萬物共生的智慧。',
        albumUrl: 'https://photos.app.goo.gl/jLwAN41Px3PwcZhq5'
      },
      {
        semester: '114-1',
        date: '09/17 (三)',
        title: '《苔苔不絕心意球》綠化環境水苔球手作課',
        place: '清大蒙民偉樓 207',
        summary: '教師節前夕，親手包裹水苔與綠植，做出一顆獨一無二、美觀又療癒的綠意水苔球。',
        albumUrl: 'https://photos.app.goo.gl/LdYg7DpQpd6jjxNY7'
      },
      {
        semester: '113-1',
        date: '10/16 (三)',
        title: '啟動「特蔬任務」× 慈心環境永續理念',
        place: '清大蒙民偉樓 207 / 清大里仁',
        summary: '結合慈心外聘講師專題分享，深入認識碳中和、森林保護與綠色保育行動。',
        albumUrl: 'https://photos.app.goo.gl/3C1dz7ruGqZjBVHEA'
      }
    ]
  },
  {
    id: 'zone-emotion-weather',
    code: 'Z05',
    name: '情緒氣象觀測屋',
    shortName: '情緒氣象屋',
    subtitle: 'SEE-L 社會情緒學習 × 忍者食堂 × 身體暫停鍵',
    category: 'mindfulness',
    categoryLabel: '心靈成長 · 情緒減壓',
    metaphor: '晴雨太陽風向儀木屋與日式「忍者食堂」屋台',
    position: { x: 0, y: 0, z: -17.5 },
    cameraOffset: { x: 0, y: 9.5, z: -26.5 },
    lookAtOffset: { x: 0, y: 2.2, z: -17.5 },
    color: '#5AA4D6',
    accentColor: '#FF9F43',
    activeMonths: [3, 10],
    elevatorPitch:
      '常因為一句話理智斷線，或被實驗與報告壓得喘不過氣嗎？我們將國際 SEE Learning（社會情緒學習）化為超好玩的《忍者食堂：情緒辨辨丸》與《情緒氣象觀測站》，陪你練習為大腦按下暫停鍵！',
    coreSkills: [
      'SEE-L 情緒光譜辨識與覺察',
      '身體感官追蹤與「暫停鍵」練習',
      '正念飲食與呼吸減壓技巧',
      '自我慈悲（在雨天為自己撐傘）'
    ],
    whyWeLearn:
      '面對生活中的情緒風暴，單靠「忍住」往往會內傷。福青社教學組設計了一系列零說教的體驗課：從品嚐《情緒辨辨丸》與《冰火舒舒菓》認識情緒模式，到《情緒氣象觀測站》學習在低潮雨天為自己撐起一把傘，並進一步成為溫暖別人的太陽。',
    highlights: [
      '《從心啟程：忍者食堂》系列：#1 情緒辨辨丸（辨識慣性情緒）、#2 冰火舒舒菓（動態調節情緒）',
      '《情緒氣象觀測站》系列：#1 在雨天為自己撐把傘、#2 成為別人的太陽',
      '《情緒觀察站》與《正念幸福 Get》：身體暫停鍵練習、正念呼吸與幸福入場券 DIY'
    ],
    courses: [
      {
        semester: '115-1',
        date: '10/07 (三)',
        title: '《情緒觀察站：從身體覺察開始的溫柔練習》',
        place: '清大風雲樓 3 樓國際學生活動中心',
        summary: '改想法很難，停下身體最快！帶領同學為大腦與身體按下「暫停鍵」，在風暴中找回平靜。',
        albumUrl: 'https://photos.app.goo.gl/ASCeVafyMvf3dvZM8'
      },
      {
        semester: '114-2',
        date: '03/04 & 03/18',
        title: '《情緒氣象觀測站》在雨天為自己撐把傘 & 成為別人的太陽',
        place: '清大蒙民偉樓 4 樓 / 水木',
        summary: '不壓抑情緒，而是陪你看見它、理解它；當外在天氣難以掌控，學會溫柔照顧內在氣候。',
        albumUrl: 'https://photos.app.goo.gl/tHNRneiFtgnjXvEGA'
      },
      {
        semester: '114-1',
        date: '10/01 & 10/08',
        title: '《從心啟程：忍者食堂》情緒辨辨丸 & 冰火舒舒菓',
        place: '清大蒙民偉樓 207',
        summary: '修練真正的情緒忍術！辨識正負向情緒模式，學會轉彎思考並恰當表達內心感受。',
        albumUrl: 'https://photos.app.goo.gl/q561gG5jibbLrZAn6'
      },
      {
        semester: '113-2',
        date: '03/05 & 03/26',
        title: 'SEE-L 課程《成長來+1》&《正念幸福 Get》',
        place: '清大蒙民偉樓 207',
        summary: '透過專注力魔法小遊戲、正念飲食與呼吸練習，讓平靜與快樂成為日常能力。',
        albumUrl: 'https://photos.app.goo.gl/7i1NyLJF6etrBdMk6'
      }
    ]
  },
  {
    id: 'zone-gratitude-post',
    code: 'Z06',
    name: '感恩卡傳郵局',
    shortName: '感恩卡傳郵局',
    subtitle: '教師節與母親節免費寄卡 × 果凍蠟燭手作 × 觀功念恩',
    category: 'gratitude',
    categoryLabel: '觀功念恩 · 卡片傳恩情',
    metaphor: '復古暖綠郵局亭、紅綠雙郵筒、飛翔翅膀明信片與手作工坊',
    position: { x: -11.5, y: 0, z: -15.0 },
    cameraOffset: { x: -19.5, y: 9.5, z: -22.5 },
    lookAtOffset: { x: -11.5, y: 2.0, z: -15.0 },
    color: '#E87A90',
    accentColor: '#52A675',
    activeMonths: [4, 5, 9],
    elevatorPitch:
      '平常只會傳 LINE 貼圖嗎？每年 9 月教師節與 5 月母親節，我們在清大小吃部與水木書苑搭起「免費卡片＋全球免費代寄」郵局，還有剔透的果凍蠟燭手作，幫你把心底的謝謝寄給最愛的人！',
    coreSkills: [
      '觀功念恩（OMAK）生活實踐',
      '手寫書信與真誠情感表達',
      '母親節果凍蠟燭與手作卡片設計',
      '校園大型快閃攤位服務'
    ],
    whyWeLearn:
      '「觀功念恩（Observe Merits and Appreciate Kindness）」是福青社最核心的幸福密碼：缺少的往往不是美，而是發現美的眼睛。自 2002 年起，全球福青社每年舉辦「卡片傳恩情」，無數清大同學從大一寫到大四，用一張張明信片溫暖了老師與父母的心。',
    highlights: [
      '9 月教師節快閃擺攤：《紙上的溫柔／今天的作業是說謝謝》小吃部免費挑卡與全球代寄',
      '5 月母親節系列：《給媽媽的小情書》小吃部擺攤與水木書苑外「卡片無人攤位」',
      '溫馨手作體驗：《果然很愛你》母親節晶透果凍蠟燭 DIY 與《印出心中的臉譜》手作卡'
    ],
    courses: [
      {
        semester: '115-1',
        date: '09/30 (三)',
        title: '《上週的作業是說謝謝》幕後功臣線上互動與感恩串聯',
        place: '清大蒙民偉樓 206',
        summary: '透過互動遊戲與影像回顧，看見活動背後默默付出的小齒輪，把感謝化為溫暖旋律。',
        albumUrl: 'https://photos.app.goo.gl/sRMJ7KxutR8D8DbF7'
      },
      {
        semester: '115-1',
        date: '09/23 (三)',
        title: '《紙上的溫柔｜給老師的明信片》教師節免費卡傳',
        place: '清大小吃部前廣場',
        summary: '有些謝謝說出口有點害羞，就用筆尖的溫度寫下來吧！卡片與郵資通通免費。',
        albumUrl: 'https://photos.app.goo.gl/nmED1ExJjfRvSrbs7'
      },
      {
        semester: '114-2',
        date: '05/06 (三)',
        title: '《「果」然很愛你》母親節果凍蠟燭手作體驗',
        place: '清大蒙民偉樓 206',
        summary: '記憶裡的愛像果凍蠟燭般剔透，靜下心親手製作一份最暖心的母親節禮物。',
        albumUrl: 'https://photos.app.goo.gl/nSGKH55ZHFVv9xrY7'
      },
      {
        semester: '114-2',
        date: '04/29–05/06',
        title: '《給媽媽的小情書》母親節卡傳 × 水木無人攤位',
        place: '清大小吃部 & 水木書苑外',
        summary: '來點老派的浪漫！在小吃部與水木無人攤位挑張卡片，讓感謝像小星星一樣落進媽媽心裡。',
        albumUrl: 'https://photos.app.goo.gl/RMhpMsnrwbeBTPuA8'
      },
      {
        semester: '114-1',
        date: '09/24 (三)',
        title: '《今天的作業是說謝謝》教師節快閃擺攤',
        place: '清大小吃部',
        summary: '今天不是算數學題或寫實驗報告，今天的作業是一句簡單的「謝謝」，寄給曾為你點亮方向的引路人。',
        albumUrl: 'https://photos.app.goo.gl/Ez4k6hf3Zen2A3gc6'
      }
    ]
  },
  {
    id: 'zone-chant-stage',
    code: 'Z07',
    name: '天空之旅露天音樂台',
    shortName: '讚頌音樂台',
    subtitle: '福青讚頌團 GCM × Live Podcast × MIT 多媒體攝影',
    category: 'mindfulness',
    categoryLabel: '藝術淨化 · 發現美好',
    metaphor: '金色音符拱門、木吉他與爵士架子鼓舞台、星光草地劇場',
    position: { x: -18.0, y: 0, z: -1.5 },
    cameraOffset: { x: -26.5, y: 9.5, z: 6.5 },
    lookAtOffset: { x: -18.0, y: 2.2, z: -1.5 },
    color: '#8B73B4',
    accentColor: '#F5C73B',
    activeMonths: [5, 7, 12],
    elevatorPitch:
      '喜歡唱歌、玩樂團、拍片或攝影嗎？在這裡我們透過「讚頌」純淨優美的旋律撫平焦慮，舉辦結合蔬食與音樂故事的《與你蔬說心語》Live Podcast，還能加入跨校福青讚頌團（GCM）與多媒體團隊（MIT）！',
    coreSkills: [
      '讚頌合唱、樂團編曲與領唱',
      'Live Podcast 企劃與故事主持',
      'MIT 平面攝影與活動紀錄美學',
      '舞台展演與情感共鳴力'
    ],
    whyWeLearn:
      '「有一種音樂，用優美的旋律傳遞美麗的心靈，融化寒冷、照亮黑暗，這就是讚頌。」福智青年讚頌團（GCM）自 2009 年起巡演全台與海外《天空之旅》音樂會；而福青多媒體（MIT）則透過鏡頭練習「發現美的眼睛」，記錄校園裡每一幕利他善行。',
    highlights: [
      '《與你蔬說心語》蔬食饗宴 × 營隊故事 × Live Podcast 現場音樂分享會',
      '福智青年讚頌團（GCM）：大團、樂團、領唱、行政四大團隊，巡演《天空之旅》音樂會',
      '福青多媒體（MIT）：開設《轉彎遇見美好》外拍攝影課與多媒體工作坊'
    ],
    courses: [
      {
        semester: '113-2',
        date: '05/14 (三)',
        title: '《與你蔬說心語》蔬食饗宴 × 營隊故事 × Live Podcast',
        place: '清大蒙民偉樓 102',
        summary: '吃飯聽 Podcast 不如來現場邊吃邊聊！在放鬆的樂音與美食中，聽見大專營真實的生命故事。',
        albumUrl: 'https://photos.app.goo.gl/Z11QdqUGMCKSFgjD9'
      },
      {
        semester: '113-1',
        date: '12/14 (六)',
        title: '《轉彎遇見美好》福青攝影外拍實作課',
        place: '清大校園與外拍景點',
        summary: '由專業攝影師帶領，學習從最容易忽略的生活場景中透過鏡頭發現美的存在。',
        albumUrl: 'https://photos.app.goo.gl/Bquew41K1SeESvai6'
      }
    ]
  },
  {
    id: 'zone-growth-wheel',
    code: 'Z08',
    name: '生命領航摩天輪與成長車站',
    shortName: '領航摩天輪',
    subtitle: '大專生命成長營 × 名人職涯講座 × 期中 All Pass 糖補給站',
    category: 'growth',
    categoryLabel: '立志利他 · 職涯與營隊',
    metaphor: '八色玩具摩天輪、希望蒸汽火車站與 All Pass 糖得來速亭',
    position: { x: -14.5, y: 0, z: 10.5 },
    cameraOffset: { x: -22.5, y: 10.5, z: 19.5 },
    lookAtOffset: { x: -14.5, y: 3.5, z: 10.5 },
    color: '#F59E0B',
    accentColor: '#3B82F6',
    activeMonths: [1, 3, 4, 7, 8, 10, 12],
    elevatorPitch:
      '對未來升學或進科技業感到迷惘？或是期中考快撐不下去？這裡有科技業資深前輩零距離對談的《名人職涯講座》、期中期末《All Pass 糖關懷得來速》，還有改變無數大學生的暑期四天三夜《大專青年生命成長營》！',
    coreSkills: [
      '科技業職涯規劃與升學決策',
      '大型營隊義工協作與領導力',
      '無限生命視野與經典思辨',
      '同儕馬拉松關懷與抗壓韌性'
    ],
    whyWeLearn:
      '從大一新鮮人到碩博班畢業，福青社像一座陪伴你登高望遠的摩天輪。期中期末考週，我們化身「馬拉松補給站」送上胡椒餅、豆花與 All Pass 糖；週末有《熊月山莊 Fun 心二日營》與《新竹福青學堂》；暑假更齊聚雲科大參加《大專青年生命成長營》，找到一生受用的生命羅盤。',
    highlights: [
      '暑期四天三夜《大專青年生命成長營》（國立雲林科技大學）與秋季《熊月山莊 Fun 心二日營》',
      '清大蒙民偉樓《名人職涯講座》：邀請多位科技業資深講者與清交同學零距離解惑「升學 vs. 就業」',
      '期中期末《關懷得來速 & 馬拉松補給站》：發送 All Pass 糖、胡椒餅與豆花，陪你撐過考試週',
      '週末延伸學習：每週六《新竹福青學堂》、北投農禪寺與湖口老街文化參訪'
    ],
    courses: [
      {
        semester: '113-1 ~ 115-1',
        date: '每年 4 月 / 10 月 / 12 月',
        title: '《期中期末關懷得來速》All Pass 糖 × 馬拉松補給站',
        place: '清大蒙民偉樓 207',
        summary: '考試像漫長的馬拉松，我們準備了 All Pass 糖、溫暖點心與祝福小卡，祝大家關關難過關關過！',
        albumUrl: 'https://photos.app.goo.gl/1aYiXJWSPACvSZXL7'
      },
      {
        semester: '114-2',
        date: '04/08 (三)',
        title: '《期中陪你撐一下》人際互動與能量補給',
        place: '清大蒙民偉樓 206',
        summary: '在期中考週緊繃的節奏裡，提供一處不談分數、只談關心與陪伴的溫暖中繼站。',
        albumUrl: 'https://photos.app.goo.gl/v5C8zJ6ABGCYVkRK9'
      },
      {
        semester: '113-1 & 114-1',
        date: '09/28–09/29',
        title: '《福青 Fun 心二日營》大地戲水 × 美味蔬食 × 螢火蟲之約',
        place: '苗栗熊月山莊',
        summary: '兩天一夜走出校園，在山林與星空下輕鬆打開心房，讓彼此的生命擁有更多深刻交集。',
        albumUrl: 'https://photos.app.goo.gl/XEDL64RXvCThVV8J8'
      },
      {
        semester: '113-2',
        date: '03/19 (三)',
        title: '《名人職涯講座》還在為未來迷惘嗎？科技業資深講者來解惑！',
        place: '清大蒙民偉樓 102',
        summary: '邀請多位科技業資深前輩與清交同學面對面對談，剖析升學 vs. 就業趨勢，少走冤枉路。',
        albumUrl: 'https://photos.app.goo.gl/ZvbsMmQFdNkVtqeq5'
      }
    ]
  },
  {
    id: 'zone-yacht-marina',
    code: 'Z09',
    name: '全球福青揚帆遊艇碼頭',
    shortName: '全球遊艇碼頭',
    subtitle: '台灣 7 大區 × 北美美加 3 大區 × 全球 61 所大專校院福青社據點',
    category: 'network',
    categoryLabel: '全球聯動 · 跨校福青網路',
    metaphor: '紅白條紋海港燈塔、木棧遊艇碼頭、揚帆雙遊艇與全球航線羅盤',
    position: { x: -13.5, y: 0, z: 22.2 },
    cameraOffset: { x: -21.5, y: 9.5, z: 31.5 },
    lookAtOffset: { x: -13.5, y: 1.8, z: 22.2 },
    color: '#2B8A9E',
    accentColor: '#F5C73B',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isGlobalMarina: true,
    elevatorPitch:
      '參加清大福青社，你加入的不只是一個校園社團，而是橫跨台灣 7 大區與美國加州、紐約、加拿大溫哥華共 61 所大學的溫暖大家庭！無論未來出國交換、跨校聯誼或攻讀研究所，隨時都有福青夥伴為你留一盞燈。',
    coreSkills: [
      '跨校聯合策展與竹區三校（清大、陽明交大、明新）共學',
      '全台與海外 61 校福青社人脈連結',
      '國際志工交流與北美大專青年營隊視野',
      '終身受用的跨領域善友社群'
    ],
    whyWeLearn:
      '真如老師曾勉勵：「必須堅定守護生命中唯一的希望，就是永遠別失去利他心，這是要用生命去捍衛的！」從新竹清大、陽明交大、明新科大出發，這座遊艇碼頭象徵福青夥伴乘風破浪，與全台及美加 61 所大專校院福智青年社、讀書會彼此呼應，把溫暖與希望航向世界每個角落。',
    highlights: [
      '新竹區三校緊密串聯：國立清華大學、國立交通大學（現國立陽明交通大學）、明新科技大學定期舉辦聯合迎新與《新竹福青學堂》',
      '全台 7 大學區完整據點：涵蓋台北（16 校）、桃園（5 校）、新竹（3 校）、台中（11 校）、雲嘉（6 校區）、台南（4 校）、高雄屏東（6 校）',
      '北美 3 大海外航線：涵蓋美國加州（USC、Cal Poly Pomona、UCR、CU-Boulder）、美國紐約（Columbia、SUNYSB、Queens College、CUNY）、加拿大溫哥華（BCIT、SFU）',
      '點擊本設施可開啟「全球福智青年社一覽表」互動視窗，支援分區篩選與校名即時檢索'
    ],
    courses: [
      {
        semester: '全球據點總覽',
        date: '全年開放聯誼',
        title: '《全球福智青年社一覽表》台灣 51 校區 × 北美 10 校完整名錄',
        place: '全台 7 區 & 美國加州 / 紐約 / 加拿大溫哥華',
        summary: '收錄福智文教基金會官方公告之全球大專校院福智青年社與校園讀書會（標註＊者）完整名單。',
        albumUrl: 'https://bwfoce.org/web/article/%E5%85%A8%E7%90%83%E7%A6%8F%E6%99%BA%E9%9D%92%E5%B9%B4%E7%A4%BE%E4%B8%80%E8%A6%BD%E8%A1%A8-YoINvZN6Z2S5bm0Leemj.aZuumdkuW5tOekvg~~'
      },
      {
        semester: '竹區跨校共學',
        date: '每週六 & 寒暑假',
        title: '《新竹福青學堂 × 大專青年生命成長營》跨校夥伴大會師',
        place: '新竹科學園區周邊 / 國立雲林科技大學',
        summary: '串聯清大、陽明交大、明新科大與全台各大專院校青年，一起討論生命課題、建立跨校深厚情誼。',
        albumUrl: 'https://bwfoce.org/web/article/%E7%A6%8F%E6%99%BA%E9%9D%92%E5%B9%B4%E7%A4%BE-YoINZAN6Z2S5bm0Leemj.aZuumdkuW5tOekvg~~'
      }
    ]
  },
  {
    id: 'zone-sky-veggie-portal',
    code: 'Z10',
    name: '天空之城・蔬食浮島飛空艇驛站',
    shortName: '天空蔬食驛站',
    subtitle: '連動企劃《2026 清大福青社蔬食地圖》× 公共藝術清鏡門 × 75 秒紅綠燈',
    category: 'network',
    categoryLabel: '跨島連動 · 天空之城蔬食地圖',
    metaphor: '微縮天空之城浮島、清大公共藝術「清鏡門」（1/3 北京清華校門與玻璃鏡）、青花菜熱氣球與清大 75 秒讀秒紅綠燈',
    position: { x: 0, y: 0, z: 17.5 },
    cameraOffset: { x: 0, y: 10.5, z: 27.5 },
    lookAtOffset: { x: 0, y: 3.2, z: 17.5 },
    color: '#4A8584',
    accentColor: '#EA7A2E',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isSkyIslandPortal: true,
    elevatorPitch:
      '逛完社課裡的「西式蔬食快餐館」，想知道走出清大校門有哪些必吃蔬食嗎？從這座飛空艇驛站抬頭仰望，就能穿過公共藝術「清鏡門」、搭乘青花菜熱氣球，一鍵傳送到姊妹作《2026 清大福青社蔬食地圖：天空之城浮島》，探索清交周邊 TOP 10 蔬食餐廳與完整校外蔬食地圖！',
    coreSkills: [
      '清大周邊步行圈與單車圈 TOP 10 蔬食餐廳導覽',
      '校園文化地標轉譯（清大公共藝術「清鏡門」、75 秒爭議紅綠燈）',
      '跨企劃 3D 數位策展與 Google Maps 綠食地圖維護',
      '《品嚐幸福》蔬食推廣與「抱抱地球 2」美照拍貼互動'
    ],
    whyWeLearn:
      '福青社的蔬食學習不只停留在週三社課 DIY，更實際繪製並維護了《新竹蔬食地圖》，做成療癒的吉卜力風「天空之城浮島」。我們把清大經典公共藝術「清鏡門」（1/3 比例北京清華二校門與玻璃鏡面）、清大生最有共鳴的「75 秒橫式讀秒紅綠燈」與紫色連帽衫「清華胖達」搬進驛站，讓社課學習與校園生活無縫接軌！',
    highlights: [
      '3D 雙島視覺彩蛋還原：集結清大公共藝術「清鏡門」、青花菜熱氣球、落腳小雲朵階梯、紫色連帽衫「清華胖達」與「75 秒橫式讀秒紅綠燈」',
      '清大步行圈 5 大必吃浮島：雅素齋（藥膳湯麵與滷味）、妙觀音素食（紅燒湯麵）、安姆士（漸層水果奶茶）、棗子樹（蛋煎粄條）、鼎盛蔬食便當（風二多格便當）',
      '清交單車圈 5 大人氣浮島：滿素圓（紅油抄手）、一鮮素（鐵板素排）、游媽媽（竹蒸籠素油飯）、菜根香（中華鐵鍋炒飯）、素怡園（交大二餐紫米十穀飯）',
      '一鍵跨島傳送門：點擊即可前往《2026 清大福青社蔬食地圖：天空之城浮島》3D 網站與「完整校外蔬食地圖」Google Maps'
    ],
    courses: [
      {
        semester: '姊妹企劃連動',
        date: 'TOP 10 浮島 + 73 店全圖鑑',
        title: '《2026 清大福青社蔬食地圖：天空之城浮島》3D 互動導覽',
        place: '清大校園地標 × 成功湖 × 清交生活圈',
        summary: '結合青花菜熱氣球、胡蘿蔔飛船、清大 75 秒紅綠燈、清華胖達松鼠尋寶與「抱抱地球 2」美照拍貼機。',
        albumUrl: 'https://kermit548.github.io/NTHU_BWY_veggie/island.html'
      },
      {
        semester: '開源專案紀錄',
        date: '24 階段實戰調優',
        title: '《NTHU_BWY_veggie》GitHub 專案與開發演進全紀錄',
        place: 'GitHub & 本地開發日誌',
        summary: '完整收錄從清大校園地標建模、10 大餐廳立體食物模型到雙吉祥物互動的 24 階段跨模型工程筆記。',
        albumUrl: 'https://github.com/kermit548/NTHU_BWY_veggie'
      }
    ]
  }
];

/**
 * 全球福智青年社一覽表（完整收錄福智文教基金會官方公告之 10 大區域、61 所大專校院據點）
 * 資料來源：https://bwfoce.org/web/article/全球福智青年社一覽表-YoINvZN6Z2S5bm0Leemj.aZuumdkuW5tOekvg~~
 */
const BWY_GLOBAL_CLUBS = {
  title: '全球福智青年社一覽表',
  subtitle: '台灣 7 大學區（51 校區）× 北美美加 3 大學區（10 校）｜共 61 處大專校院福青據點',
  sourceUrl:
    'https://bwfoce.org/web/article/%E5%85%A8%E7%90%83%E7%A6%8F%E6%99%BA%E9%9D%92%E5%B9%B4%E7%A4%BE%E4%B8%80%E8%A6%BD%E8%A1%A8-YoINvZN6Z2S5bm0Leemj.aZuumdkuW5tOekvg~~',
  note: '＊表示為校園讀書會；無論你在台灣或海外留學，都能找到溫暖的福青夥伴！',
  quotes: [
    {
      author: '真如老師',
      text: '制定一個你可以完全實踐的計畫，不要制定一個非常圓滿的計畫，永遠實現不了，永遠都在哀嘆！'
    },
    {
      author: '真如老師',
      text: '一旦我們的內心調到一個學習的角度，會天下太平。'
    },
    {
      author: '日常老和尚',
      text: '因為煩惱沒有調伏，所以生命才感受到種種的痛苦。'
    },
    {
      author: '真如老師',
      text: '必須堅定守護生命中唯一的希望，就是永遠別失去利他心，這是要用生命去捍衛的！'
    },
    {
      author: '真如老師',
      text: '什麼叫「優秀的人才」？在自己的水平上努力的人，他就是一個優秀的人才。'
    }
  ],
  regions: [
    {
      id: 'taipei',
      areaGroup: '台灣',
      name: '台北',
      badgeColor: '#E05A47',
      schools: [
        { name: '國立臺灣大學', type: 'club' },
        { name: '國立政治大學', type: 'club' },
        { name: '國立臺灣師範大學', type: 'club' },
        { name: '國立台北科技大學', type: 'club' },
        { name: '國立台北教育大學', type: 'club' },
        { name: '國立東華大學', type: 'club' },
        { name: '台北醫學大學', type: 'club' },
        { name: '淡江大學', type: 'club' },
        { name: '海洋大學', type: 'club' },
        { name: '銘傳大學(台北校區)', type: 'club' },
        { name: '輔仁大學', type: 'club' },
        { name: '東吳大學', type: 'club' },
        { name: '台北護理健康大學', type: 'club' },
        { name: '國立台灣科技大學', type: 'club' },
        { name: '台北市立大學', type: 'club' },
        { name: '文化大學', type: 'club' }
      ]
    },
    {
      id: 'taoyuan',
      areaGroup: '台灣',
      name: '桃園',
      badgeColor: '#E8833A',
      schools: [
        { name: '國立中央大學', type: 'club' },
        { name: '開南大學', type: 'club' },
        { name: '中原大學', type: 'club' },
        { name: '銘傳大學', type: 'club' },
        { name: '中央警察大學', type: 'club' }
      ]
    },
    {
      id: 'hsinchu',
      areaGroup: '台灣',
      name: '新竹',
      badgeColor: '#2B8A9E',
      schools: [
        { name: '國立交通大學', note: '現國立陽明交通大學', type: 'club' },
        { name: '國立清華大學', note: '本島主場・水木 241 / 活中 207', type: 'club', isHome: true },
        { name: '明新科技大學', type: 'club' }
      ]
    },
    {
      id: 'taichung',
      areaGroup: '台灣',
      name: '台中',
      badgeColor: '#4BA366',
      schools: [
        { name: '國立中興大學', type: 'club' },
        { name: '國立台中教育大學', type: 'club' },
        { name: '國立彰化師範大學', type: 'club' },
        { name: '中國醫藥大學', type: 'club' },
        { name: '逢甲大學', type: 'club' },
        { name: '東海大學', type: 'club' },
        { name: '中山醫學大學', type: 'club' },
        { name: '靜宜大學＊', type: 'study-group' },
        { name: '朝陽大學＊', type: 'study-group' },
        { name: '大葉大學＊', type: 'study-group' },
        { name: '聯合大學＊', type: 'study-group' }
      ]
    },
    {
      id: 'yunjia',
      areaGroup: '台灣',
      name: '雲嘉',
      badgeColor: '#52A675',
      schools: [
        { name: '國立中正大學', type: 'club' },
        { name: '國立雲林科技大學', note: '2026 大專營舉辦地', type: 'club' },
        { name: '國立虎尾科技大學', type: 'club' },
        { name: '南華大學', type: 'club' },
        { name: '國立嘉義大學 民雄校區', type: 'club' },
        { name: '國立嘉義大學 蘭潭校區', type: 'club' }
      ]
    },
    {
      id: 'tainan',
      areaGroup: '台灣',
      name: '台南',
      badgeColor: '#D97724',
      schools: [
        { name: '國立成功大學', type: 'club' },
        { name: '國立台南大學', type: 'club' },
        { name: '嘉南藥理科技大學', type: 'club' },
        { name: '長榮大學＊', type: 'study-group' }
      ]
    },
    {
      id: 'kaoping',
      areaGroup: '台灣',
      name: '高雄屏東',
      badgeColor: '#C85A7C',
      schools: [
        { name: '國立高雄師範大學', type: 'club' },
        { name: '大仁科技大學', type: 'club' },
        { name: '高雄醫學大學', type: 'club' },
        { name: '高雄應用科技大學', type: 'club' },
        { name: '台東大學＊', type: 'study-group' },
        { name: '屏東大學＊', type: 'study-group' }
      ]
    },
    {
      id: 'us-california',
      areaGroup: '北美海外',
      name: '美國加州',
      badgeColor: '#3B82F6',
      schools: [
        {
          name: '南加州大學 愛心社 (Loving-Heart Society)',
          enName: 'University of Southern California / USC',
          type: 'overseas'
        },
        {
          name: '波莫納加州州立理工大學福青社 (BWI)',
          enName: 'California State Polytechnic University, Pomona / Cal Poly Pomona',
          type: 'overseas'
        },
        {
          name: '加州大學河濱分校福青社 (BWI)',
          enName: 'University of California, Riverside / UCR',
          type: 'overseas'
        },
        {
          name: '科羅拉多大學波德分校 福青社 (BWI)',
          enName: 'University of Colorado Boulder / CU-Boulder',
          type: 'overseas'
        }
      ]
    },
    {
      id: 'us-newyork',
      areaGroup: '北美海外',
      name: '美國紐約',
      badgeColor: '#6366F1',
      schools: [
        {
          name: '紐約市立大學皇后學院',
          enName: 'City University of New York, Queens College',
          type: 'overseas'
        },
        {
          name: '紐約州立大學石溪分校',
          enName: 'State University of New York at Stony Brook / SUNYSB',
          type: 'overseas'
        },
        {
          name: '哥倫比亞大學',
          enName: 'Columbia University',
          type: 'overseas'
        },
        {
          name: '紐約市立大學-皇后社區學院',
          enName: 'Queens Community College / CUNY',
          type: 'overseas'
        }
      ]
    },
    {
      id: 'ca-vancouver',
      areaGroup: '北美海外',
      name: '加拿大溫哥華',
      badgeColor: '#8B5CF6',
      schools: [
        {
          name: '卑詩省理工學院',
          enName: 'British Columbia Institute of Technology / BCIT',
          type: 'overseas'
        },
        {
          name: '西門菲莎大學',
          enName: 'Simon Fraser University / SFU',
          type: 'overseas'
        }
      ]
    }
  ]
};

/**
 * 與姊妹作《2026 清大福青社蔬食地圖：天空之城浮島》跨島連動資料
 * 對應專案：d:\xampp\htdocs\Other\NTHU_BWY_veggie\about\island_project_notes.md
 */
const BWY_SKY_ISLAND_LINK = {
  title: '2026 清大福青社蔬食地圖：天空之城浮島',
  subtitle: '從週三社課「學做蔬食」到走出校門「探索清交 73 家綠食地圖」的雙島宇宙連動',
  localEntryUrl: 'https://kermit548.github.io/NTHU_BWY_veggie/island.html',
  fullVeggieMapUrl:
    'https://www.google.com/maps/d/u/0/viewer?mid=1pRX1QdNBgRvGR4L5ckNvlSUIIl2OQDX0&femb=1&ll=24.80140222282343%2C120.98331584673566&z=13',
  localDevNotesUrl: 'https://kermit548.github.io/NTHU_BWY_veggie/about/2026_island_dev.html',
  repoUrl: 'https://github.com/kermit548/NTHU_BWY_veggie',
  easterEggs: [
    {
      name: '公共藝術「清鏡門」× 青花菜熱氣球',
      desc: '致敬清華大學「清鏡門」公共藝術（1/3 比例北京清華二校門嵌於大石框玻璃鏡前），上方飄浮象徵健康蔬食的翠綠青花菜熱氣球。'
    },
    {
      name: '落腳小雲朵階梯 × 天空之城浮島巡航',
      desc: '四朵軟綿綿的白色小雲朵階梯一路引領登上高空浮島，俯瞰連往清交周邊 10 座必吃蔬食餐廳島嶼的奇幻航線！'
    },
    {
      name: '清大校園 75 秒橫式讀秒紅綠燈',
      desc: '致敬清大生最熟悉的校園迷因地標！橫式三色燈箱搭配真實 75 秒綠燈、5 秒黃燈、75 秒紅燈雙位數 LED 倒數計時。'
    },
    {
      name: '紫色連帽衫「清華胖達」× 松鼠尋寶 × 抱抱地球拍貼機',
      desc: '身穿清大紫連帽衫的熊貓吉祥物與大赤鼯鼠在島上藏了 5 顆松果，還有《品嚐幸福》MV 與「抱抱地球 2」美照拍貼機。'
    }
  ],
  top10Stores: [
    { ring: '內環步行圈', name: '雅素齋', dish: '藥膳湯麵與冰鎮滷味拼盤', walk: '步行 3 分鐘' },
    { ring: '內環步行圈', name: '妙觀音素食', dish: '招牌紅燒湯麵與綜合滷味', walk: '步行 3 分鐘' },
    { ring: '內環步行圈', name: '安姆士', dish: '珍珠漸層水果奶茶與輕食', walk: '步行 4 分鐘' },
    { ring: '內環步行圈', name: '棗子樹', dish: '客家蛋煎粄條與紅棗果樹', walk: '步行 5 分鐘' },
    { ring: '內環步行圈', name: '鼎盛蔬食便當', dish: '清大風二五彩多格便當盒', walk: '校內風雲樓 2F' },
    { ring: '外環單車圈', name: '滿素圓', dish: '川味紅油抄手與麻醬麵', walk: '單車 5 分鐘' },
    { ring: '外環單車圈', name: '一鮮素', dish: '滋滋鐵板素排與麻辣臭豆腐煲', walk: '單車 5 分鐘' },
    { ring: '外環單車圈', name: '游媽媽', dish: '竹蒸籠素油飯與手工水餃', walk: '單車 6 分鐘' },
    { ring: '外環單車圈', name: '菜根香', dish: '大火快炒中華鐵鍋炒飯', walk: '單車 6 分鐘' },
    { ring: '外環單車圈', name: '素怡園', dish: '交大二餐紫米十穀飯自助餐', walk: '陽明交大校內' }
  ]
};

/**
 * 12 個隱藏於主題遊樂園各區的「福青溫暖彩蛋」（支援 3D 點擊與圖鑑集章）
 */
const BWY_TREASURES = [
  {
    id: 'egg-01',
    name: '五色希望小熱氣球',
    zoneId: 'hub-balloon',
    zoneName: '福青希望熱氣球主廣場',
    hint: '仰望中央主廣場左上方天空，尋找伴隨主氣球冉冉升起的黃白格紋迷你熱氣球。',
    meaning: '象徵「即便只有螢火微光，也要捧出來溫暖世界」的初心。',
    position: { x: -6.2, y: 10.0, z: 2.2 }
  },
  {
    id: 'egg-02',
    name: '蒙民偉樓 315 福青社窩 社課歡迎立牌',
    zoneId: 'hub-balloon',
    zoneName: '福青希望熱氣球主廣場',
    hint: '點擊熱氣球廣場正前方迎賓拱門旁的木質歡迎立牌。',
    meaning: '每週三 18:30 先吃飯、19:00 社課，隨時為你留一個位子！',
    position: { x: 2.8, y: 1.0, z: 5.2 }
  },
  {
    id: 'egg-03',
    name: '特蔬任務巨無霸未來漢堡',
    zoneId: 'zone-veggie-diner',
    zoneName: '西式蔬食快餐館',
    hint: '點擊佇立在東南角西式快餐館屋頂上的金黃芝麻蔬食大漢堡。',
    meaning: '少肉多蔬食，生產植物性飲食可省下 90% 水資源！',
    position: { x: 12.65, y: 3.45, z: 21.9 }
  },
  {
    id: 'egg-04',
    name: '晶透茶香「映心凍」',
    zoneId: 'zone-veggie-diner',
    zoneName: '西式蔬食快餐館',
    hint: '點擊快餐館戶外紅傘野餐桌上的晶透茶凍甜點杯。',
    meaning: '來自大道茶文化協會合辦社課的獨家有機茶點手作記憶。',
    position: { x: 15.9, y: 1.15, z: 24.1 }
  },
  {
    id: 'egg-05',
    name: '老師手作窯烤麵包與燉麵鍋',
    zoneId: 'zone-chinese-feast',
    zoneName: '中式團圓飯館',
    hint: '點擊中式團圓飯館前庭大圓桌中央的竹蒸籠與燉麵鍋。',
    meaning: '匯聚輔導老師群手作窯烤麵包、牛番茄燉麵與芋頭西米露的期末饗宴。',
    position: { x: 14.55, y: 1.25, z: 12.8 }
  },
  {
    id: 'egg-06',
    name: '微笑綠蠵龜母子',
    zoneId: 'zone-beach-cleanup',
    zoneName: '陽光淨灘海灣',
    hint: '點擊正東方陽光淨灘海灣淺水沙灘邊的綠蠵龜母子。',
    meaning: '感謝清大同學在南寮漁港淨灘並成為「不塑之客」，讓海龜安心回家。',
    position: { x: 19.8, y: 0.6, z: -0.15 }
  },
  {
    id: 'egg-07',
    name: '苔苔不絕心意水苔球',
    zoneId: 'zone-botanical-garden',
    zoneName: '綠意微縮植物園',
    hint: '點擊東北角玻璃溫室旁木架上圓滾滾的水苔球盆栽。',
    meaning: '親手揉製的綠意禮物，代表對師長的感謝與對土地的溫柔。',
    position: { x: 13.6, y: 1.85, z: -13.6 }
  },
  {
    id: 'egg-08',
    name: '公共藝術「清鏡門」（1/3 北京清華二校門）',
    zoneId: 'zone-sky-veggie-portal',
    zoneName: '天空之城蔬食浮島連動門',
    hint: '仰望並點擊正南方漂浮天空之城蔬食浮島上鑲嵌青綠鏡牆的白色「清鏡門」。',
    meaning: '清大校園著名公共藝術「清鏡門」映照雙校情誼，也邀請我們像照鏡子般看見善念與成長。',
    position: { x: 0.35, y: 5.2, z: 17.88 }
  },
  {
    id: 'egg-09',
    name: '忍者食堂「情緒辨辨丸」',
    zoneId: 'zone-emotion-weather',
    zoneName: '情緒氣象觀測屋',
    hint: '點擊正北方情緒氣象觀測屋旁屋台上的日式三色糰子串。',
    meaning: 'SEE-L 情緒忍術奧義：先為身體按下暫停鍵，看見並溫柔接納自己的情緒。',
    position: { x: 1.85, y: 2.8, z: -16.1 }
  },
  {
    id: 'egg-10',
    name: '飛翔翅膀感恩明信片',
    zoneId: 'zone-gratitude-post',
    zoneName: '感恩卡傳郵局',
    hint: '點擊西北角感恩卡傳郵局屋頂上插著潔白翅膀的巨型明信片。',
    meaning: '免費卡片、免費寄送！自 2002 年起把清大學子的感謝寄往全球。',
    position: { x: -11.5, y: 4.2, z: -15.2 }
  },
  {
    id: 'egg-11',
    name: '天空之旅黃金木吉他',
    zoneId: 'zone-chant-stage',
    zoneName: '天空之旅露天音樂台',
    hint: '點擊正西方露天音樂台音符拱門右側的巨型溫暖木吉他。',
    meaning: '用美好的心歌唱美好的心，乘著讚頌的翅膀飛向幸福。',
    position: { x: -16.8, y: 2.2, z: -1.6 }
  },
  {
    id: 'egg-12',
    name: '期中歐趴「All Pass 糖」能量包',
    zoneId: 'zone-growth-wheel',
    zoneName: '生命領航摩天輪與成長車站',
    hint: '點擊西南角摩天輪車站旁「關懷得來速」藍金小亭前方的歐趴糖能量禮袋。',
    meaning: '期中期末考馬拉松最暖心的補給，祝你關關輕鬆過、懷抱高分歸！',
    position: { x: -11.7, y: 1.35, z: 12.2 }
  }
];

/**
 * 30 秒適性測驗：「我適合從哪個福青園區開始逛？」
 */
const BWY_QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: '1. 週三晚上 18:30 剛下課，走進清大蒙民偉樓，你現在最渴望什麼？',
    options: [
      {
        label: 'A. 來一碗熱騰騰的家常飯菜，跟朋友邊吃邊聊今天發生的事',
        weights: { 'zone-chinese-feast': 3, 'zone-veggie-diner': 2 }
      },
      {
        label: 'B. 報告跟考試快把我淹沒了，想找個角落讓大腦按下「暫停鍵」喘口氣',
        weights: { 'zone-emotion-weather': 3, 'zone-chant-stage': 2 }
      },
      {
        label: 'C. 想動手做點療癒小物（像是水苔球、果凍蠟燭或甜點 DIY）',
        weights: { 'zone-botanical-garden': 3, 'zone-gratitude-post': 2, 'zone-veggie-diner': 1 }
      },
      {
        label: 'D. 想聽科技業學長姐分享職涯方向，或認識跨校熱血夥伴',
        weights: { 'zone-growth-wheel': 3, 'zone-beach-cleanup': 2 }
      }
    ]
  },
  {
    id: 'q2',
    question: '2. 如果週末有一整天自由時間，哪種活動最吸引你？',
    options: [
      {
        label: 'A. 去南寮漁港看海、吹海風，順便跟大家一起淨灘守護海龜',
        weights: { 'zone-beach-cleanup': 3, 'zone-botanical-garden': 2 }
      },
      {
        label: 'B. 探索新竹好吃的隱藏版蔬食漢堡、甜點或逛無痕市集',
        weights: { 'zone-veggie-diner': 3, 'zone-chinese-feast': 2 }
      },
      {
        label: 'C. 聽一場溫暖的現場音樂會或 Live Podcast 故事分享',
        weights: { 'zone-chant-stage': 3, 'zone-emotion-weather': 1 }
      },
      {
        label: 'D. 去苗栗熊月山莊兩天一夜看螢火蟲，或參加大型成長營隊',
        weights: { 'zone-growth-wheel': 3, 'zone-chinese-feast': 1 }
      }
    ]
  },
  {
    id: 'q3',
    question: '3. 當朋友問起「你在大學社團最想收穫什麼能力？」，你的答案是？',
    options: [
      {
        label: 'A. 高 EQ 的情緒覺察力：面對壓力與衝突時能溫柔穩定自己',
        weights: { 'zone-emotion-weather': 3, 'zone-gratitude-post': 1 }
      },
      {
        label: 'B. 說謝謝的勇氣：學會發現別人的好（觀功念恩），把感謝寫進卡片裡',
        weights: { 'zone-gratitude-post': 3, 'zone-chinese-feast': 2 }
      },
      {
        label: 'C. 永續行動與策展力：親手企劃蔬食擺攤、綠化植栽與環保倡議',
        weights: { 'zone-veggie-diner': 2, 'zone-botanical-garden': 3, 'zone-beach-cleanup': 2 }
      },
      {
        label: 'D. 領導力與生命格局：學會寫企劃書、帶團隊，確立未來職涯志向',
        weights: { 'zone-growth-wheel': 3, 'zone-chant-stage': 2 }
      }
    ]
  }
];

/**
 * 根據現實時間判斷當前「週三社課狀態」與「當季主打園區」
 * @param {Date} [now]
 */
function getBwyLiveStatus(now = new Date()) {
  const day = now.getDay(); // 0=Sun, 3=Wed
  const hour = now.getHours();
  const minute = now.getMinutes();
  const month = now.getMonth() + 1; // 1~12
  const timeVal = hour + minute / 60;

  const isWednesday = day === 3;
  const isClubNightNow = isWednesday && timeVal >= 18.0 && timeVal <= 21.0;

  let statusBadge = '';
  let featuredZoneId = 'hub-balloon';
  let seasonLabel = '';

  if (isClubNightNow) {
    statusBadge = '🟢 週三社課進行中｜水木 / 活中 207 溫馨共餐與社課';
  } else if (isWednesday) {
    statusBadge = '🟡 今天是週三社課日｜18:30 共餐 · 19:00 社課見！';
  } else {
    statusBadge = '🎈 歡迎光臨清大福青樂園｜每週三 18:30 溫馨共餐';
  }

  if (month === 11) {
    featuredZoneId = 'zone-veggie-diner';
    seasonLabel = '11 月主打：特蔬任務・蔬食月擺攤與植感生活展';
  } else if (month === 9) {
    featuredZoneId = 'zone-gratitude-post';
    seasonLabel = '9 月主打：教師節卡片傳恩情・今天的作業是說謝謝';
  } else if (month === 5) {
    featuredZoneId = 'zone-gratitude-post';
    seasonLabel = '5 月主打：母親節小情書・果凍蠟燭與無痕生活實驗室';
  } else if (month === 10) {
    featuredZoneId = 'zone-emotion-weather';
    seasonLabel = '10 月主打：SEE-L 忍者食堂情緒課・期中歐趴糖補給';
  } else if (month === 3) {
    featuredZoneId = 'zone-botanical-garden';
    seasonLabel = '3 月主打：春日種樹護地球・情緒氣象觀測站';
  } else if (month === 7 || month === 8) {
    featuredZoneId = 'zone-growth-wheel';
    seasonLabel = '暑期主打：大專青年生命成長營・開學前蹭飯聚聚吧';
  } else {
    featuredZoneId = 'zone-chinese-feast';
    seasonLabel = '學期精選：週三蹭飯團共餐・期末拾光饗宴';
  }

  return {
    isWednesday,
    isClubNightNow,
    month,
    statusBadge,
    featuredZoneId,
    seasonLabel
  };
}

/**
 * 根據關鍵字與單選/複選分類篩選園區
 * @param {string|string[]|Set<string>} categoryFilter
 * @param {string} query
 */
function filterBwyZones(categoryFilter = 'all', query = '') {
  const q = String(query || '').trim().toLowerCase();
  const selectedSet =
    categoryFilter instanceof Set
      ? categoryFilter
      : Array.isArray(categoryFilter)
        ? new Set(categoryFilter)
        : categoryFilter && categoryFilter !== 'all'
          ? new Set([categoryFilter])
          : new Set();
  const showAllCategories = selectedSet.size === 0 || selectedSet.has('all');

  return BWY_ZONES.filter((zone) => {
    const matchCategory = showAllCategories || selectedSet.has(zone.category);
    if (!matchCategory) return false;
    if (!q) return true;
    const haystack = [
      zone.name,
      zone.shortName,
      zone.subtitle,
      zone.categoryLabel,
      zone.metaphor,
      zone.elevatorPitch,
      zone.whyWeLearn,
      ...(zone.coreSkills || []),
      ...(zone.highlights || []),
      ...(zone.courses || []).map((c) => `${c.title} ${c.summary} ${c.place}`)
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * 計算適性測驗推薦結果
 * @param {number[]} selectedIndices 每題選中的選項索引
 */
function computeQuizRecommendation(selectedIndices = []) {
  const scores = {};
  BWY_ZONES.forEach((z) => {
    scores[z.id] = 0;
  });

  selectedIndices.forEach((optIdx, qIdx) => {
    const q = BWY_QUIZ_QUESTIONS[qIdx];
    if (!q || !q.options[optIdx]) return;
    const weights = q.options[optIdx].weights || {};
    Object.entries(weights).forEach(([zoneId, w]) => {
      scores[zoneId] = (scores[zoneId] || 0) + w;
    });
  });

  const sorted = [...BWY_ZONES].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const topZone = sorted[0] || BWY_ZONES[0];
  const runnerUp = sorted[1] || BWY_ZONES[1];

  return {
    topZone,
    runnerUp,
    shareText: `我在【清大福青社 3D 學習樂園】測出最適合我的起點是「${topZone.name}」！${topZone.elevatorPitch}`
  };
}

  global.BWY_DATA = {
    BWY_META,
    BWY_CATEGORIES,
    BWY_CENTRAL_HUB,
    BWY_ZONES,
    BWY_TREASURES,
    BWY_QUIZ_QUESTIONS,
    BWY_GLOBAL_CLUBS,
    BWY_SKY_ISLAND_LINK,
    getBwyLiveStatus,
    filterBwyZones,
    computeQuizRecommendation
  };
})(window);
