import { derived, writable } from 'svelte/store';

export type SuitabilityLevel = 'Friendly' | 'Challenging' | 'Brutal';
export type LanguageCode = 'zh-Hant' | 'en';

const translations = {
  'zh-Hant': {
    topBar: {
      brandTitle: '香港單車爬坡',
      brandSubtitle: '介面原型',
      nav: {
        filters: '篩選',
        profile: '你的設定',
        slopes: '爬坡列表',
        map: '地圖',
      },
      cta: '訂閱更新',
      languageSwitcherLabel: '介面語言',
    },
    hero: {
      eyebrow: '香港單車爬坡資訊站',
      title: '自信規劃下一段爬坡。',
      lead:
        '探索坡度、比較變速組合，並視覺化香港經典爬坡。此靜態原型展示預期版面，數據串接仍在進行中。',
      actions: {
        primary: '瀏覽示例爬坡',
        secondary: '觀看概覽',
      },
      stats: {
        climbs: '經典路段',
        gradient: '最陡坡度',
        feedback: '車手評分',
      },
      card: {
        badge: '焦點爬坡',
        title: '大帽山通道',
        distanceLabel: '距離',
        gradientLabel: '平均坡度',
        timeLabel: '預估時間',
        note: '正式版本將會在此顯示即時數據與計算。',
      },
    },
    filters: {
      eyebrow: '篩選',
      title: '找到符合當日狀態的爬坡。',
      searchLabel: '搜尋爬坡',
      searchPlaceholder: '輸入爬坡或地區',
      difficultyLabel: '難度重點',
      difficultyOptions: ['入門', '進階', '高手'],
      gradientLabel: '坡度',
      gradientMin: '0%',
      gradientMax: '12%',
      distanceLabel: '距離',
      distanceChips: [
        { label: '短程', detail: '< 3 公里' },
        { label: '中程', detail: '3-6 公里' },
        { label: '長程', detail: '> 6 公里' },
      ],
      note: '待數據管線完成後即可操作這些互動控制。',
    },
    profile: {
      eyebrow: '你的設定',
      title: '設定你目前的單車與輸出。',
      bike: {
        title: '車款與傳動',
      },
      power: {
        title: '功率概況',
      },
      form: {
        frontChainring: '最細前齒盤 (T)',
        rearSprocket: '最大飛輪 (T)',
        wheelCircumference: '輪圈周長 (毫米)',
        ftp: 'FTP (瓦特)',
        mass: '總重 (公斤)',
        minCadence: '最低踏頻 (rpm)',
        helper: '設定會自動儲存在本機瀏覽器，稍後的適配計算會沿用這些數值。',
      },
      callout: {
        title: '下一步？',
        body: '這些欄位會連接到即將推出的功率與齒比分析工具。',
        button: '重設為預設值',
      },
    },
    slopes: {
      eyebrow: '爬坡清單',
      title: '預覽即將上線的名錄。',
      cta: '下載 CSV',
      columns: {
        climb: '爬坡',
        district: '地區',
        distance: '距離',
        ascent: '總爬升',
        gradient: '平均坡度',
        suitability: '適合程度',
      },
      caption: '精選爬坡',
      footer: '待完成數據整合後即可提供排序、篩選與分頁功能。',
      loading: '正在載入爬坡資料…',
      error: '無法載入爬坡資料。',
      retry: '再試一次',
      empty: '暫時未有可顯示的爬坡。',
      rows: [
        {
          name: '大帽山通道',
          location: '荃灣',
          distance: '5.6 km',
          gradient: '9.5%',
          suitability: 'Challenging' as SuitabilityLevel,
        },
        {
          name: '飛鵝山',
          location: '九龍',
          distance: '3.8 km',
          gradient: '10.2%',
          suitability: 'Brutal' as SuitabilityLevel,
        },
        {
          name: '柏架山道',
          location: '鰂魚涌',
          distance: '4.0 km',
          gradient: '8.1%',
          suitability: 'Friendly' as SuitabilityLevel,
        },
      ],
    },
    map: {
      eyebrow: '地圖預覽',
      title: '查看各路段位置。',
      pins: ['大帽山', '飛鵝山', '柏架山'],
      caption: '正式版本會以 Leaflet 與真實地圖圖磚取代此佔位示意。',
      dataset: {
        loading: '正在載入路線資料…',
        error: '無法載入路線資料。',
        retry: '再試一次',
        summary: '{groups} 條路線 · {points} 個座標點',
      },
    },
    footer: {
      message: '原型版本 • 數據整合即將推出。',
      links: {
        github: 'GitHub',
        contact: '聯絡我們',
        privacy: '私隱政策',
      },
    },
    suitability: {
      Friendly: '友善',
      Challenging: '具挑戰性',
      Brutal: '極限',
    },
  },
  en: {
    topBar: {
      brandTitle: 'HK Cycling Slopes',
      brandSubtitle: 'Interface Prototype',
      nav: {
        filters: 'Filters',
        profile: 'Your Setup',
        slopes: 'Climbs',
        map: 'Map',
      },
      cta: 'Subscribe for updates',
      languageSwitcherLabel: 'Interface language',
    },
    hero: {
      eyebrow: 'Hong Kong Cycling Slopes Info Hub',
      title: 'Plan your next climb with confidence.',
      lead:
        'Explore gradients, compare gearing options, and visualise signature Hong Kong ascents. This static prototype outlines the intended layout while data wiring is still in progress.',
      actions: {
        primary: 'Explore sample climbs',
        secondary: 'Watch overview',
      },
      stats: {
        climbs: 'iconic climbs',
        gradient: 'steepest gradient',
        feedback: 'rider feedback',
      },
      card: {
        badge: 'Climb spotlight',
        title: 'Tai Mo Shan Access Road',
        distanceLabel: 'Distance',
        gradientLabel: 'Avg gradient',
        timeLabel: 'Est. time',
        note: 'Live data and calculations will appear here in the full build.',
      },
    },
    filters: {
      eyebrow: 'Filters',
      title: 'Find the climb that matches your mood.',
      searchLabel: 'Search climbs',
      searchPlaceholder: 'Type a climb or district',
      difficultyLabel: 'Difficulty focus',
      difficultyOptions: ['Beginner', 'Progression', 'Advanced'],
      gradientLabel: 'Gradient',
      gradientMin: '0%',
      gradientMax: '12%',
      distanceLabel: 'Distance',
      distanceChips: [
        { label: 'Short', detail: '< 3 km' },
        { label: 'Medium', detail: '3-6 km' },
        { label: 'Long', detail: '> 6 km' },
      ],
      note: 'Interactive controls will be wired up once the dataset plumbing is complete.',
    },
    profile: {
      eyebrow: 'Your setup',
      title: 'Dial in your current bike and power.',
      bike: {
        title: 'Bike & drivetrain',
      },
      power: {
        title: 'Power profile',
      },
      form: {
        frontChainring: 'Smallest chainring (T)',
        rearSprocket: 'Largest sprocket (T)',
        wheelCircumference: 'Wheel circumference (mm)',
        ftp: 'FTP (W)',
        mass: 'Total mass (kg)',
        minCadence: 'Min cadence (rpm)',
        helper: 'Your selections are stored in this browser and will feed upcoming suitability calculations.',
      },
      callout: {
        title: "What's next?",
        body: 'These inputs will connect directly to the upcoming power and gearing tools.',
        button: 'Restore defaults',
      },
    },
    slopes: {
      eyebrow: 'Climb directory',
      title: 'Preview the upcoming catalogue.',
      cta: 'Download CSV',
      columns: {
        climb: 'Climb',
        district: 'District',
        distance: 'Distance',
        ascent: 'Total ascent',
        gradient: 'Avg. gradient',
        suitability: 'Suitability',
      },
      caption: 'Featured climb',
      footer: 'Sorting, filtering, and pagination will be enabled once data integration lands.',
      loading: 'Loading climbs…',
      error: 'Unable to load the climbs dataset.',
      retry: 'Try again',
      empty: 'No climbs available yet.',
      rows: [
        {
          name: 'Tai Mo Shan Access Road',
          location: 'Tsuen Wan',
          distance: '5.6 km',
          gradient: '9.5%',
          suitability: 'Challenging' as SuitabilityLevel,
        },
        {
          name: 'Fei Ngo Shan',
          location: 'Kowloon',
          distance: '3.8 km',
          gradient: '10.2%',
          suitability: 'Brutal' as SuitabilityLevel,
        },
        {
          name: 'Mount Parker Road',
          location: 'Quarry Bay',
          distance: '4.0 km',
          gradient: '8.1%',
          suitability: 'Friendly' as SuitabilityLevel,
        },
      ],
    },
    map: {
      eyebrow: 'Map preview',
      title: 'Visualise climb locations.',
      pins: ['Tai Mo Shan', 'Fei Ngo Shan', 'Mount Parker'],
      caption: 'Leaflet and real map tiles will replace this placeholder in the production build.',
      dataset: {
        loading: 'Loading path data…',
        error: 'Unable to load the path dataset.',
        retry: 'Try again',
        summary: '{groups} route groups · {points} coordinates loaded',
      },
    },
    footer: {
      message: 'Prototype build • Data integration coming soon.',
      links: {
        github: 'GitHub',
        contact: 'Contact',
        privacy: 'Privacy',
      },
    },
    suitability: {
      Friendly: 'Friendly',
      Challenging: 'Challenging',
      Brutal: 'Brutal',
    },
  },
} as const;

export const availableLanguages = [
  { code: 'zh-Hant' as LanguageCode, label: '繁體中文' },
  { code: 'en' as LanguageCode, label: 'English' },
];

export const language = writable<LanguageCode>('zh-Hant');
export const t = derived(language, ($language) => translations[$language]);
