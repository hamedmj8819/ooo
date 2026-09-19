import {
  CompressorModel,
  PartDefinition,
  MachineTool,
  FoundryPartner,
  OperatorProfile,
  ProductionOrder,
  WarehouseItem,
  SystemNotification,
  SystemUser
} from '../types';

export const INITIAL_COMPRESSOR_MODELS: CompressorModel[] = [
  {
    id: 'MOD-SC500',
    code: 'SC-500 HD',
    name: 'کمپرسور اسکرو فشار قوی دائم‌کار صنعتی',
    nameEn: 'Heavy Duty Industrial Screw Compressor SC-500',
    type: 'screw',
    capacityM3Min: 8.5,
    workingPressureBar: 13,
    motorPowerKw: 45,
    coolingType: 'روغنی با رادیاتور آلومینیومی دوبل',
    description: 'کمپرسور هوای فشرده روتاری اسکرو دائم‌کار مخصوص خطوط تولید صنعتی سنگین با ایراند ساخت داخل و راندمان بالا.',
    partsCount: 42,
    inHouseRatio: 82,
  },
  {
    id: 'MOD-SC250',
    code: 'SC-250 VFD',
    name: 'کمپرسور اسکرو صنعتی اینورتر دور متغیر',
    nameEn: 'Variable Speed Inverter Screw Compressor SC-250',
    type: 'screw',
    capacityM3Min: 4.2,
    workingPressureBar: 8.5,
    motorPowerKw: 22,
    coolingType: 'روغنی مداربسته با فن ترموستاتیک',
    description: 'کمپرسور اسکرو با کنترل دور اتوماتیک جهت کاهش مصرف انرژی در بار متناوب کارگاهی.',
    partsCount: 38,
    inHouseRatio: 80,
  },
  {
    id: 'MOD-LC180',
    code: 'LC-180 2S',
    name: 'کمپرسور لوپ تایپ صنعتی دو مرحله‌ای',
    nameEn: 'Two-Stage Industrial Lobe Type Compressor LC-180',
    type: 'lobe',
    capacityM3Min: 12.0,
    workingPressureBar: 2.5,
    motorPowerKw: 30,
    coolingType: 'هوا خنک با پره‌های خنک‌کننده بدنه',
    description: 'کمپرسور گاز و هوای بدون روغن (Oil-Free) با ساختار روتور لوپ دولپ ضد سایش.',
    partsCount: 34,
    inHouseRatio: 85,
  },
  {
    id: 'MOD-RB350',
    code: 'RB-350 TL',
    name: 'بلوئر هوادهی روتس تایپ تری‌لپ (سه گوش)',
    nameEn: 'Tri-Lobe Heavy Duty Roots Blower RB-350',
    type: 'lobe',
    capacityM3Min: 28.5,
    workingPressureBar: 1.2,
    motorPowerKw: 37,
    coolingType: 'هوا خنک مستقیم',
    description: 'بلوئر روتس تایپ کم‌صدا با پروفیل سه‌لپ مخصوص تصفیه‌خانه‌ها، انتقال مواد پنوماتیک و صنایع سیمان.',
    partsCount: 30,
    inHouseRatio: 84,
  },
  {
    id: 'MOD-GB400',
    code: 'GB-400 HP',
    name: 'بوستر اسکرو تراکم گازهای فرآیندی پرفشار',
    nameEn: 'High Pressure Screw Gas Booster GB-400',
    type: 'booster',
    capacityM3Min: 6.8,
    workingPressureBar: 25,
    motorPowerKw: 55,
    coolingType: 'مبدل حرارتی آب و روغن شل اند تیوب',
    description: 'بوستر اسکرو فوق‌العاده مستحکم مخصوص تقویت فشار گاز متان، نیتروژن و هوای خشک تا ۲۵ بار.',
    partsCount: 46,
    inHouseRatio: 78,
  }
];

export const INITIAL_PARTS: PartDefinition[] = [
  // Parts for SC-500
  {
    id: 'PART-SC500-01',
    partNumber: 'CP-CS-5001',
    name: 'پوسته و محفظه چدنی ایراند اسکرو',
    nameEn: 'Screw Air-End Housing Casing',
    machineModelId: 'MOD-SC500',
    category: 'casting',
    material: 'چدن داکتیل نشکن GGG40',
    rawWeightKg: 145,
    finishedWeightKg: 118,
    stockQty: 3,
    minStockAlert: 2,
    defaultDrawingName: 'DWG-CS-5001-REV3.pdf',
    defaultStepFileName: 'STP-CS-5001-CASING.step',
    supplierName: 'ریخته‌گری دقیق اصفهان',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'کاروسل: کف‌تراشی و پیش‌تراش پله‌های نشیمن',
        description: 'کف‌تراشی وجوه اتصال بالا و پایین و تراش اولیه جای بوش‌ها با تلورانس ۰.۱ میلی‌متر',
        defaultMachineCategoryId: 'carousel',
        estimatedMinutes: 180,
        requiredDrawingType: 'نقشه کاروسل فاز ۱',
        isOutsourced: false,
        qcCheckpoints: ['تختی وجوه اصلی (Flatness 0.05)', 'عمق پله‌ها با میکرومتر عمق‌سنج']
      },
      {
        stageNumber: 2,
        name: 'فرز دروازه‌ای: ماشین‌کاری شیارهای روغن و نشیمن فلنج‌ها',
        description: 'ماشین‌کاری شیارهای داخلی خنک‌کاری و رزوه سوراخ‌های فیس جلو و عقب',
        defaultMachineCategoryId: 'gantry_mill',
        estimatedMinutes: 240,
        requiredDrawingType: 'نقشه فرزکاری دروازه‌ای فاز ۲',
        isOutsourced: false,
        qcCheckpoints: ['گام و سلامت رزوه‌ها', 'موقعیت سوراخ‌های فلنج با شابلون دقیق']
      },
      {
        stageNumber: 3,
        name: 'بورینگ: سوراخ‌کاری و بورینگ دقیق نشیمن سیلندرهای ماردون',
        description: 'بورینگ همزمان سوراخ‌های ماردون نری و مادگی با فاصله مرکزی ۱۲۵.۰۰ میلی‌متر',
        defaultMachineCategoryId: 'boring',
        estimatedMinutes: 210,
        requiredDrawingType: 'نقشه بورینگ نهایی فاز ۳',
        isOutsourced: false,
        qcCheckpoints: ['فاصله سنتر به سنتر (Center Distance ±0.015)', 'زبری سطح Ra 0.8', 'گردی سیلندرها']
      },
      {
        stageNumber: 4,
        name: 'سنگ مغناطیس: سنگ‌زنی فیس آب‌بندی جلو و عقب',
        description: 'سنگ‌زنی فینیشینگ سطوح فلنج جهت آب‌بندی بدون گسکت',
        defaultMachineCategoryId: 'grinder',
        estimatedMinutes: 90,
        requiredDrawingType: 'نقشه سنگ‌زنی مغناطیس',
        isOutsourced: false,
        qcCheckpoints: ['تختی سطح کمتر از ۰.۰۱ میلی‌متر', 'عدم وجود خط و خش']
      },
      {
        stageNumber: 5,
        name: 'کنترل کیفی CMM، شستشوی اولتراسونیک و پسیواسیون',
        description: 'تست نهایی ابعادی با دستگاه CMM و پوشش روغن محافظ زنگ‌زدگی',
        defaultMachineCategoryId: 'manual_lathe',
        estimatedMinutes: 60,
        requiredDrawingType: 'چک‌لیست QC و بازرسی نهایی',
        isOutsourced: false,
        qcCheckpoints: ['گزارش ابعادی CMM', 'تست فشار هیدرواستاتیک ۲۰ بار بدون نشتی']
      }
    ]
  },
  {
    id: 'PART-SC500-02',
    partNumber: 'CP-MR-5002',
    name: 'ماردون نری (Male Rotor) اسکرو سنگین',
    nameEn: 'Male Rotor 5-Lobe Profile',
    machineModelId: 'MOD-SC500',
    category: 'manufactured',
    material: 'فولاد آلیاژی سخت‌کاری شده VCN200 (1.6582)',
    rawWeightKg: 52,
    finishedWeightKg: 38,
    stockQty: 4,
    minStockAlert: 2,
    defaultDrawingName: 'DWG-MR-5002-REV4.pdf',
    defaultStepFileName: 'STP-MR-5002-MALE-ROTOR.step',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'تراش منوال: خشن‌تراشی پیشانی، سنترگیری و پله شفت‌ها',
        description: 'تراش اولیه شفت ابتدا و انتها با اضافه بار ماشین‌کاری ۲ میلی‌متر',
        defaultMachineCategoryId: 'manual_lathe',
        estimatedMinutes: 120,
        requiredDrawingType: 'نقشه خشن‌تراشی اولیه',
        isOutsourced: false,
        qcCheckpoints: ['هم‌محوری شفت با سنترها', 'طول کلی و قطر پله‌ها']
      },
      {
        stageNumber: 2,
        name: 'تراش CNC: تراش فرم دقیق پروفیل ۵ لوپ ماردون',
        description: 'تراشکاری مارپیچ پروفیل اسکرو با دستگاه CNC محور چهارم',
        defaultMachineCategoryId: 'cnc_lathe',
        estimatedMinutes: 220,
        requiredDrawingType: 'نقشه CNC پروفیل اسکرو',
        isOutsourced: false,
        qcCheckpoints: ['فرم پروفیل با گیج مخصوص', 'انحراف گام پیچی کمتر از ۰.۰۲']
      },
      {
        stageNumber: 3,
        name: 'برون‌سپاری: سنگ محور شفت‌های یاتاقان و جای کاسه‌نمد',
        description: 'سنگ‌زنی دقیق ژورنال‌های بلبرینگ با تلورانس h5 و زبری Ra 0.4',
        defaultMachineCategoryId: 'outsourced_cylindrical_grind',
        estimatedMinutes: 150,
        requiredDrawingType: 'نقشه سنگ محور خارجی',
        isOutsourced: true,
        qcCheckpoints: ['قطر نشیمن بلبرینگ (میکرومتر میتوتویو)', 'ران‌اوت شعاعی کمتر از ۰.۰۰۸ میلی‌متر']
      },
      {
        stageNumber: 4,
        name: 'برون‌سپاری: وایرکات خار و شیارهای قفل‌کننده چرخ‌دنده',
        description: 'وایرکات جای خار تایمینگ با دقت میکرونی',
        defaultMachineCategoryId: 'outsourced_wirecut',
        estimatedMinutes: 80,
        requiredDrawingType: 'نقشه وایرکات جاخار',
        isOutsourced: true,
        qcCheckpoints: ['عرض جاخار با گیج برو/نرو (Go/No-Go)']
      },
      {
        stageNumber: 5,
        name: 'بالانس دینامیکی روتور طبق ISO 1940 گرید G2.5',
        description: 'بالانس در دور ۳۰۰۰ RPM و ثبت گواهی بالانس',
        defaultMachineCategoryId: 'manual_lathe',
        estimatedMinutes: 45,
        requiredDrawingType: 'دستورالعمل بالانس دینامیک',
        isOutsourced: false,
        qcCheckpoints: ['عدم تعادل باقیمانده کمتر از ۱ گرم-میلی‌متر']
      }
    ]
  },
  {
    id: 'PART-SC500-03',
    partNumber: 'CP-FR-5003',
    name: 'ماردون مادگی (Female Rotor) اسکرو ۶ شیار',
    nameEn: 'Female Rotor 6-Flute Profile',
    machineModelId: 'MOD-SC500',
    category: 'manufactured',
    material: 'فولاد آلیاژی Mo40 (1.7225) سمانتاسیون',
    rawWeightKg: 46,
    finishedWeightKg: 32,
    stockQty: 5,
    minStockAlert: 2,
    defaultDrawingName: 'DWG-FR-5003-REV2.pdf',
    defaultStepFileName: 'STP-FR-5003-FEMALE-ROTOR.step',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'تراش منوال: آماده‌سازی شفت و سنترها',
        description: 'خشن‌تراشی مقطع و پله‌های شفت',
        defaultMachineCategoryId: 'manual_lathe',
        estimatedMinutes: 110,
        requiredDrawingType: 'نقشه مرحله ۱ تراش',
        isOutsourced: false,
        qcCheckpoints: ['طول و قطر شفت با کولیس ورنیه']
      },
      {
        stageNumber: 2,
        name: 'تراش CNC: تراش پروفیل مارپیچ مادگی ۶ پره',
        description: 'تراشکاری فرم دقیق منحنی هرمی با ابزار اینسرت سرامیک',
        defaultMachineCategoryId: 'cnc_lathe',
        estimatedMinutes: 200,
        requiredDrawingType: 'نقشه CNC فرم مادگی',
        isOutsourced: false,
        qcCheckpoints: ['پروفیل با دستگاه اپتیکال', 'درگیری آزمایشی با ماردون نری']
      },
      {
        stageNumber: 3,
        name: 'برون‌سپاری: سنگ محور محورهای انتهایی',
        description: 'سنگ‌زنی نشیمن بلبرینگ‌ها با تلورانس j6',
        defaultMachineCategoryId: 'outsourced_cylindrical_grind',
        estimatedMinutes: 140,
        requiredDrawingType: 'نقشه سنگ محور مادگی',
        isOutsourced: true,
        qcCheckpoints: ['قطر نشیمن بلبرینگ', 'تست سختی راکول C']
      }
    ]
  },
  {
    id: 'PART-SC500-04',
    partNumber: 'CP-BH-5004',
    name: 'درپوش یاتاقان جلو (Front Bearing Cover)',
    nameEn: 'Front Bearing Head Cover',
    machineModelId: 'MOD-SC500',
    category: 'casting',
    material: 'چدن خاکستری GG25 مرغوب',
    rawWeightKg: 38,
    finishedWeightKg: 28,
    stockQty: 6,
    minStockAlert: 3,
    defaultDrawingName: 'DWG-BH-5004.pdf',
    defaultStepFileName: 'STP-BH-5004-COVER.step',
    supplierName: 'صنایع ریخته‌گری ساوه چدن',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'کاروسل: تراش مقطع نشیمن و جای یاتاقان‌ها',
        description: 'تراش قطر نشیمن هوزینگ و فیس اتصال سیلندر',
        defaultMachineCategoryId: 'carousel',
        estimatedMinutes: 120,
        requiredDrawingType: 'نقشه کاروسل فاز ۱',
        isOutsourced: false,
        qcCheckpoints: ['قطر داخلی نشیمن یاتاقان H7', 'هم‌مرکزی سوراخ‌ها']
      },
      {
        stageNumber: 2,
        name: 'بورینگ: سوراخ‌کاری دقیق جای پیچ‌ها و پین‌های فیتینگ',
        description: 'بورینگ جای پین‌های موقعیت‌دهنده با دقت ۰.۰۱ میلی‌متر',
        defaultMachineCategoryId: 'boring',
        estimatedMinutes: 90,
        requiredDrawingType: 'نقشه بورینگ و سوراخ‌کاری',
        isOutsourced: false,
        qcCheckpoints: ['قطر جای پین فیتینگ H7', 'فاصله مرکز سوراخ‌ها']
      }
    ]
  },
  {
    id: 'PART-SC500-05',
    partNumber: 'CP-BRG-5005',
    name: 'بلبرینگ دور بالا تماس زاویه‌ای دوبل جفت‌شده SKF',
    nameEn: 'SKF Matched High Speed Angular Contact Bearings',
    machineModelId: 'MOD-SC500',
    category: 'bought_out',
    material: 'فولاد بلبرینگ 100Cr6 اصل اتریش',
    rawWeightKg: 2.4,
    finishedWeightKg: 2.4,
    stockQty: 18,
    minStockAlert: 8,
    supplierName: 'تامین قطعات های‌تک آریا (وارداتی)',
    defaultStages: []
  },

  // Parts for Lobe Compressor LC-180
  {
    id: 'PART-LC180-01',
    partNumber: 'LB-CS-1801',
    name: 'سیلندر دو محفظه کمپرسور لوپ تایپ',
    nameEn: 'Double Cylinder Housing Lobe Compressor',
    machineModelId: 'MOD-LC180',
    category: 'casting',
    material: 'چدن داکتیل GGG40 مقاوم به حرارت',
    rawWeightKg: 185,
    finishedWeightKg: 152,
    stockQty: 2,
    minStockAlert: 1,
    defaultDrawingName: 'DWG-LC180-CYLINDER.pdf',
    defaultStepFileName: 'STP-LC180-CYLINDER.step',
    supplierName: 'ریخته‌گری دقیق اصفهان',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'فرز دروازه‌ای: کف‌تراشی ۴ وجه سیلندر لوپ',
        description: 'کف‌تراشی سطوح ورودی، خروجی و فلنج‌های جانبی',
        defaultMachineCategoryId: 'gantry_mill',
        estimatedMinutes: 260,
        requiredDrawingType: 'نقشه فرز دروازه‌ای فاز ۱',
        isOutsourced: false,
        qcCheckpoints: ['تختی و تعامد سطوح (Perpendicularity 0.03)']
      },
      {
        stageNumber: 2,
        name: 'بورینگ: بورینگ فوق دقیق دو محفظه روتورهای لوپ',
        description: 'تراش سیلندرهای بیضوی تودرتو با فاصله بین‌محوری مشخص',
        defaultMachineCategoryId: 'boring',
        estimatedMinutes: 240,
        requiredDrawingType: 'نقشه بورینگ دو محفظه',
        isOutsourced: false,
        qcCheckpoints: ['قطر داخلی سیلندر با گیج سیلندر گیج دیجیتال', 'استوانه‌ای بودن']
      }
    ]
  },
  {
    id: 'PART-LC180-02',
    partNumber: 'LB-LR-1802',
    name: 'روتور دو لوپ فولادی متقارن با شفت یکپارچه',
    nameEn: 'Dual-Lobe Solid Rotor with Integral Shaft',
    machineModelId: 'MOD-LC180',
    category: 'manufactured',
    material: 'فولاد آلیاژی فورج 1.7225 (Mo40)',
    rawWeightKg: 78,
    finishedWeightKg: 54,
    stockQty: 4,
    minStockAlert: 2,
    defaultDrawingName: 'DWG-LC180-LOBE-ROTOR.pdf',
    defaultStepFileName: 'STP-LC180-LOBE-ROTOR.step',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'تراش منوال: تراش پله‌های شفت و پیشانی روتور',
        description: 'آماده‌سازی شفت روتور قبل از فرم‌تراشی لوپ‌ها',
        defaultMachineCategoryId: 'manual_lathe',
        estimatedMinutes: 140,
        requiredDrawingType: 'نقشه تراش شفت روتور',
        isOutsourced: false,
        qcCheckpoints: ['هم‌محوری شفت']
      },
      {
        stageNumber: 2,
        name: 'فرز دروازه‌ای: تراش فرم منحنی روتور لوپ (انولوت/اپیتسیکلوئید)',
        description: 'براده‌برداری سنگین و فرم‌دهی منحنی‌های دو لوپ با فرز سرکروی',
        defaultMachineCategoryId: 'gantry_mill',
        estimatedMinutes: 300,
        requiredDrawingType: 'نقشه ۳ بعدی پروفیل لوپ',
        isOutsourced: false,
        qcCheckpoints: ['پروفیل با شابلون مستر', 'عدم وجود پلیسه و پله براده']
      },
      {
        stageNumber: 3,
        name: 'برون‌سپاری: سنگ محور ژورنال‌ها و کلیرانس سر پره‌ها',
        description: 'سنگ‌زنی قطر خارجی پره‌ها با دقت ۰.۰۱ و نشیمن بلبرینگ',
        defaultMachineCategoryId: 'outsourced_cylindrical_grind',
        estimatedMinutes: 180,
        requiredDrawingType: 'نقشه سنگ محور لوپ',
        isOutsourced: true,
        qcCheckpoints: ['قطر خارجی روتور', 'زبری سطح Ra 0.4']
      }
    ]
  },

  // Parts for Roots Blower RB-350 Tri-Lobe
  {
    id: 'PART-RB350-01',
    partNumber: 'RB-TL-3501',
    name: 'روتور تری‌لپ سه‌گوش بلوئر روتس (Tri-Lobe Rotor)',
    nameEn: 'Tri-Lobe Precision Rotor',
    machineModelId: 'MOD-RB350',
    category: 'manufactured',
    material: 'چدن داکتیل نشکن بالانس شده GGG50',
    rawWeightKg: 65,
    finishedWeightKg: 49,
    stockQty: 6,
    minStockAlert: 2,
    defaultDrawingName: 'DWG-RB350-TRILOBE.pdf',
    defaultStepFileName: 'STP-RB350-TRILOBE-ROTOR.step',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'کاروسل: پیش‌تراش قطر و پخ‌زنی فیس‌های دو طرف',
        description: 'آماده‌سازی سطوح مرجع برای فرزکاری',
        defaultMachineCategoryId: 'carousel',
        estimatedMinutes: 90,
        requiredDrawingType: 'نقشه کاروسل فاز ۱',
        isOutsourced: false,
        qcCheckpoints: ['طول کلی قطعه']
      },
      {
        stageNumber: 2,
        name: 'فرز دروازه‌ای: تراش پروفیل ۳ لوپ با مسیر دقیق CNC',
        description: 'تراشکاری سه گوش روتور با برنامه CAM و تلورانس ۰.۰۲ میلی‌متر',
        defaultMachineCategoryId: 'gantry_mill',
        estimatedMinutes: 240,
        requiredDrawingType: 'نقشه فرز پروفیل ۳ لوپ',
        isOutsourced: false,
        qcCheckpoints: ['فاصله قله لوپ‌ها تا مرکز', 'تقارن زوایای ۱۲۰ درجه']
      },
      {
        stageNumber: 3,
        name: 'برون‌سپاری: لپینگ فیس آب‌بندی سر شفت',
        description: 'لپینگ تخت فیس سیل جهت جلوگیری از نشت هوا و روغن',
        defaultMachineCategoryId: 'outsourced_lap',
        estimatedMinutes: 75,
        requiredDrawingType: 'نقشه لپینگ فیس',
        isOutsourced: true,
        qcCheckpoints: ['تختی با نور تک‌رنگ مونوکروماتیک (Light Bands < 2)']
      }
    ]
  },
  {
    id: 'PART-RB350-02',
    partNumber: 'RB-TG-3502',
    name: 'مجموعه چرخدنده‌های سنکرونایزر تایمینگ دندانه‌مورب',
    nameEn: 'Timing Synchronizer Helical Gears Pair',
    machineModelId: 'MOD-RB350',
    category: 'manufactured',
    material: 'فولاد آلیاژی کربوره 1.7131 (16MnCr5)',
    rawWeightKg: 18,
    finishedWeightKg: 12.5,
    stockQty: 8,
    minStockAlert: 4,
    defaultDrawingName: 'DWG-RB350-TIMING-GEAR.pdf',
    defaultStepFileName: 'STP-RB350-TIMING-GEAR.step',
    defaultStages: [
      {
        stageNumber: 1,
        name: 'تراش CNC: تراش بلنک چرخدنده و پله‌های داخلی',
        description: 'تراش دقیق بدنه چرخ‌دنده با تلورانس سوراخ H6',
        defaultMachineCategoryId: 'cnc_lathe',
        estimatedMinutes: 80,
        requiredDrawingType: 'نقشه تراش بلنک چرخدنده',
        isOutsourced: false,
        qcCheckpoints: ['قطر داخلی و خارجی بلنک']
      },
      {
        stageNumber: 2,
        name: 'برون‌سپاری: وایرکات دندانه‌های دقیق هلیکال و جای خار',
        description: 'برش دقیق دندانه‌های مدول ۳ با دستگاه وایرکات ژاپنی',
        defaultMachineCategoryId: 'outsourced_wirecut',
        estimatedMinutes: 160,
        requiredDrawingType: 'نقشه وایرکات دندانه',
        isOutsourced: true,
        qcCheckpoints: ['پروفیل دندانه با پروژکتور اندازه برداری', 'لقی بکلش (Backlash)']
      },
      {
        stageNumber: 3,
        name: 'سنگ مغناطیس: سنگ‌زنی دو فیس کناری چرخ‌دنده',
        description: 'سنگ‌زنی برای دستیابی به ضخامت کاملاً یکنواخت',
        defaultMachineCategoryId: 'grinder',
        estimatedMinutes: 45,
        requiredDrawingType: 'نقشه سنگ‌زنی فیس',
        isOutsourced: false,
        qcCheckpoints: ['تساوی ضخامت دور قطعه با میکرومتر تا ۰.۰۰۵ میلی‌متر']
      }
    ]
  }
];

export const INITIAL_MACHINE_TOOLS: MachineTool[] = [
  {
    id: 'MC-GRIND-01',
    code: 'GR-101',
    name: 'دستگاه سنگ مغناطیس تخت ۶۰×۱۵۰',
    type: 'internal',
    category: 'grinder',
    status: 'active',
    currentWorkOrderId: 'PO-1403-088',
    currentPartName: 'پوسته و محفظه چدنی ایراند اسکرو',
    currentStageName: 'سنگ مغناطیس: سنگ‌زنی فیس آب‌بندی',
    currentOperatorId: 'OP-04',
    currentOperatorName: 'علی میرزایی',
    location: 'سالن شماره ۱ - خط پرداخت و فینیشینگ',
    specifications: 'میز مگنت ۶۰ در ۱۵۰ سانتی‌متر - دور سنگ ۱۴۵۰ دور - مجهز به سیستم کولانت هیدرولیک',
    lastMaintenanceDate: '۱۴۰۳/۰۶/۱۰',
    healthPercent: 94
  },
  {
    id: 'MC-LATHE-MAN-01',
    code: 'LT-M-201',
    name: 'تراش منوال سنگین ۳ متری تبریز',
    type: 'internal',
    category: 'manual_lathe',
    status: 'idle',
    location: 'سالن شماره ۲ - بخش ماشین‌کاری سنگین اولیه',
    specifications: 'طول کارگیر ۳۰۰۰ میلی‌متر - قطر کارگیر روی بست ۸۰۰ میلی‌متر - موتور ۱۵ کیلووات',
    lastMaintenanceDate: '۱۴۰۳/۰۶/۱۵',
    healthPercent: 88
  },
  {
    id: 'MC-LATHE-CNC-01',
    code: 'LT-CNC-301',
    name: 'تراش CNC دقیق ۲ محور مجهز به سروو درایو',
    type: 'internal',
    category: 'cnc_lathe',
    status: 'active',
    currentWorkOrderId: 'PO-1403-090',
    currentPartName: 'ماردون نری (Male Rotor) اسکرو',
    currentStageName: 'تراش CNC: تراش فرم دقیق پروفیل ۵ لوپ',
    currentOperatorId: 'OP-03',
    currentOperatorName: 'وحید قاسمی',
    location: 'سالن شماره ۱ - خط CNC قطعات دقیق',
    specifications: 'سیستم کنترل Fanuc 0i-TF - دور اسپیندل ۴۵۰۰ دور - تکرارپذیری ۰.۰۰۳ میلی‌متر',
    lastMaintenanceDate: '۱۴۰۳/۰۶/۰۱',
    healthPercent: 96
  },
  {
    id: 'MC-MILL-GANTRY-01',
    code: 'ML-G-401',
    name: 'فرز دروازه‌ای ۴ متری سنگین (Gantry Milling)',
    type: 'internal',
    category: 'gantry_mill',
    status: 'active',
    currentWorkOrderId: 'PO-1403-089',
    currentPartName: 'روتور تری‌لپ سه‌گوش بلوئر روتس',
    currentStageName: 'فرز دروازه‌ای: تراش پروفیل ۳ لوپ',
    currentOperatorId: 'OP-01',
    currentOperatorName: 'صابر رادمنش',
    location: 'سالن اصلی ساخت - ایستگاه سنگین A',
    specifications: 'کورس طولی ۴۲۰۰، عرضی ۲۱۰۰، ارتفاعی ۱۵۰۰ میلی‌متر - مجهز به هد زاویه‌زن ۹۰ درجه اتوماتیک',
    lastMaintenanceDate: '۱۴۰۳/۰۵/۲۲',
    healthPercent: 91
  },
  {
    id: 'MC-BORING-01',
    code: 'BR-501',
    name: 'دستگاه بورینگ افقی فلور تایپ ۱۱۰ میلی‌متر',
    type: 'internal',
    category: 'boring',
    status: 'idle',
    location: 'سالن اصلی ساخت - ایستگاه بورینگ دقیق',
    specifications: 'اسپیندل ۱۱۰ میلی‌متر اسکودا - خط‌کش دیجیتال هایدن‌هاین در ۳ محور - دقت ۰.۰۰۵ میلی‌متر',
    lastMaintenanceDate: '۱۴۰۳/۰۵/۳۰',
    healthPercent: 89
  },
  {
    id: 'MC-CAROUSEL-01',
    code: 'CR-601',
    name: 'دستگاه کاروسل عمودی قطر ۱۶۰ سانتی‌متر',
    type: 'internal',
    category: 'carousel',
    status: 'breakdown',
    breakdownReason: 'داغ کردن یاتاقان هیدرواستاتیک میز گردان و افت فشار روغن روانکاری',
    breakdownReportedAt: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۹:۱۵',
    currentOperatorId: 'OP-02',
    currentOperatorName: 'اکبر نوری',
    location: 'سالن شماره ۲ - بخش پوسته‌ها و قطعات دوار سنگین',
    specifications: 'قطر میز ۱۶۰۰ میلی‌متر - حداکثر وزن قطعه کار ۵ تن - کله‌گی رنده با چرخش هیدرولیک',
    lastMaintenanceDate: '۱۴۰۳/۰۴/۱۸',
    healthPercent: 62
  },
  // Outsourced Virtual Stations
  {
    id: 'MC-OUT-CYL-GRIND',
    code: 'OUT-CG-01',
    name: 'ایستگاه برون‌سپاری: سنگ محور قطر بزرگ و دقیق',
    type: 'outsourced',
    category: 'outsourced_cylindrical_grind',
    status: 'active',
    location: 'کارگاه پیمانکار طرف قرارداد (صنایع سنگ دقیق صبا)',
    specifications: 'امکان سنگ‌زنی شفت‌ها تا طول ۲ متر و قطر ۴۰۰ میلی‌متر با تلورانس ۰.۰۰۵ میلی‌متر',
    lastMaintenanceDate: '۱۴۰۳/۰۶/۰۱',
    healthPercent: 98
  },
  {
    id: 'MC-OUT-WIRECUT',
    code: 'OUT-WC-01',
    name: 'ایستگاه برون‌سپاری: برش وایرکات CNC میکرونی',
    type: 'outsourced',
    category: 'outsourced_wirecut',
    status: 'idle',
    location: 'پیمانکار تخصصی وایرکات (دقیق تراش پویا)',
    specifications: 'دستگاه Sodick پنج محور مجهز به ژنراتور سوپر فینیش برای زبری سطحی Ra 0.2',
    lastMaintenanceDate: '۱۴۰۳/۰۶/۰۵',
    healthPercent: 100
  },
  {
    id: 'MC-OUT-LAPPING',
    code: 'OUT-LAP-01',
    name: 'ایستگاه برون‌سپاری: لپینگ مسطح و آینه‌ای مکانیکال سیل',
    type: 'outsourced',
    category: 'outsourced_lap',
    status: 'idle',
    location: 'پیمانکار تخصصی فیس‌های سرامیک و سیلیکون (آب‌بند پارس)',
    specifications: 'دستگاه لپینگ ۳ دیسکه با خمیر الماسه میکرونی جهت تختی کمتر از یک باند نوری',
    lastMaintenanceDate: '۱۴۰۳/۰۵/۲۸',
    healthPercent: 99
  }
];

export const INITIAL_FOUNDRIES: FoundryPartner[] = [
  {
    id: 'FND-01',
    name: 'شرکت ریخته‌گری دقیق اصفهان',
    manager: 'مهندس کاظمی',
    phone: '۰۳۱-۳۳۸۰۵۰۰۰',
    city: 'اصفهان - شهرک صنعتی مورچه‌خورت',
    capabilities: ['ریخته‌گری چدن نشکن GGG40 و GGG50', 'کوره القایی ۵ تنی', 'تست التراسونیک قطعات ریختگی'],
    qualityRating: 4.8,
    activeOrdersCount: 2
  },
  {
    id: 'FND-02',
    name: 'صنایع ریخته‌گری ساوه چدن',
    manager: 'مهندس شمس',
    phone: '۰۲۱-۸۸۲۲۳۳۴۴',
    city: 'ساوه - شهرک صنعتی کاوه',
    capabilities: ['ریخته‌گری پوسته‌های چدن خاکستری GG25 تا ۱۰ تن', 'قالب‌گیری CO2 و ماسه رزینی'],
    qualityRating: 4.6,
    activeOrdersCount: 1
  },
  {
    id: 'FND-03',
    name: 'مجتمع آلیاژریزان نوین',
    manager: 'مهندس احمدی‌پور',
    phone: '۰۲۱-۶۶۷۷۸۸۹۹',
    city: 'تهران - شهرک صنعتی شمس‌آباد',
    capabilities: ['ریخته‌گری برنز فسفردار و آلومینیوم برنز', 'فولادهای ریختگی ضدسایش و استنلس استیل'],
    qualityRating: 4.5,
    activeOrdersCount: 0
  }
];

export const INITIAL_OPERATORS: OperatorProfile[] = [
  {
    id: 'OP-01',
    name: 'صابر رادمنش',
    personnelCode: 'PR-1042',
    specialty: 'تکنسین ارشد فرزکاری دروازه‌ای و ماشین‌های ۵ محور',
    assignedMachineId: 'MC-MILL-GANTRY-01',
    currentWorkOrderId: 'PO-1403-089',
    currentStageName: 'تراش پروفیل ۳ لوپ روتور بلوئر',
    shift: 'morning',
    totalPartsProducedToday: 2,
    status: 'working'
  },
  {
    id: 'OP-02',
    name: 'اکبر نوری',
    personnelCode: 'PR-1018',
    specialty: 'استادکار تراش منوال سنگین و کاروسل عمودی',
    assignedMachineId: 'MC-CAROUSEL-01',
    shift: 'morning',
    totalPartsProducedToday: 1,
    status: 'idle'
  },
  {
    id: 'OP-03',
    name: 'وحید قاسمی',
    personnelCode: 'PR-1088',
    specialty: 'برنامه‌نویس و اپراتور تراش و فرز CNC',
    assignedMachineId: 'MC-LATHE-CNC-01',
    currentWorkOrderId: 'PO-1403-090',
    currentStageName: 'تراش پروفیل مارپیچ ماردون اسکرو',
    shift: 'morning',
    totalPartsProducedToday: 4,
    status: 'working'
  },
  {
    id: 'OP-04',
    name: 'علی میرزایی',
    personnelCode: 'PR-1055',
    specialty: 'اپراتور سنگ مغناطیس تخت و کنترل ابعادی فینیشینگ',
    assignedMachineId: 'MC-GRIND-01',
    currentWorkOrderId: 'PO-1403-088',
    currentStageName: 'سنگ‌زنی فیس آب‌بندی پوسته',
    shift: 'morning',
    totalPartsProducedToday: 3,
    status: 'working'
  },
  {
    id: 'OP-05',
    name: 'رضا محمودی',
    personnelCode: 'PR-1070',
    specialty: 'اپراتور دستگاه بورینگ افقی فلور تایپ',
    assignedMachineId: 'MC-BORING-01',
    shift: 'evening',
    totalPartsProducedToday: 0,
    status: 'idle'
  }
];

export const INITIAL_ORDERS: ProductionOrder[] = [
  {
    id: 'PO-1403-088',
    orderNumber: 'PO-88/SC500',
    title: 'تولید پوسته چدنی ایراند کمپرسور اسکرو SC-500',
    isCustomOrder: false,
    compressorModelId: 'MOD-SC500',
    compressorModelName: 'کمپرسور اسکرو فشار قوی دائم‌کار صنعتی SC-500',
    partId: 'PART-SC500-01',
    partName: 'پوسته و محفظه چدنی ایراند اسکرو',
    partNumber: 'CP-CS-5001',
    quantity: 4,
    priority: 'urgent',
    deadlineDate: '۱۴۰۳/۰۶/۲۸',
    createdDate: '۱۴۰۳/۰۶/۱۰',
    createdByRole: 'ceo',
    createdByName: 'دکتر جمشیدی (مدیرعامل)',
    status: 'in_production',
    completionPercentage: 75,
    notes: 'پوسته برای سفارش صادراتی شرکت پتروشیمی است؛ تلورانس‌های سنتر یاتاقان‌ها شدیداً بحرانی است.',
    quotes: [
      {
        id: 'Q-088-1',
        orderId: 'PO-1403-088',
        supplierName: 'ریخته‌گری دقیق اصفهان',
        supplierType: 'foundry',
        amountRials: 1850000000,
        deliveryTimeDays: 14,
        dateSubmitted: '۱۴۰۳/۰۶/۱۱',
        status: 'approved_by_ceo',
        attachmentFileName: 'PishFactor-IsfahanFoundry-088.pdf',
        attachmentFileType: 'pdf',
        notes: '۴ عدد پوسته چدن GGG40 با گواهی آنالیز متالوژی اسپکترومتری',
        submittedBy: 'مهندس رضایی (برنامه‌ریزی)',
        decidedAt: '۱۴۰۳/۰۶/۱۲'
      }
    ],
    engineeringDocs: [
      {
        stageNumber: 1,
        stageName: 'کاروسل: کف‌تراشی و پیش‌تراش پله‌ها',
        drawingNumber: 'DWG-CS-5001-STG1',
        drawingFileName: 'DWG-CS-5001-CAROUSEL.pdf',
        stepFileName: 'STP-CS-5001-PHASE1.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۳',
        uploadedBy: 'مهندس کریمی (مهندسی)',
        cadPreviewData: {
          primitiveShape: 'casing_block',
          dimensions: { length: 550, diameter: 320, extra: 'GGG40 Cast' }
        }
      },
      {
        stageNumber: 2,
        stageName: 'فرز دروازه‌ای: شیارهای روغن و نشیمن',
        drawingNumber: 'DWG-CS-5001-STG2',
        drawingFileName: 'DWG-CS-5001-MILL.pdf',
        stepFileName: 'STP-CS-5001-PHASE2.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۳',
        uploadedBy: 'مهندس کریمی (مهندسی)'
      },
      {
        stageNumber: 3,
        stageName: 'بورینگ: سیلندرهای ماردون',
        drawingNumber: 'DWG-CS-5001-STG3',
        drawingFileName: 'DWG-CS-5001-BORING.pdf',
        stepFileName: 'STP-CS-5001-PHASE3.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۳',
        uploadedBy: 'مهندس کریمی (مهندسی)'
      },
      {
        stageNumber: 4,
        stageName: 'سنگ مغناطیس: سنگ‌زنی فیس',
        drawingNumber: 'DWG-CS-5001-STG4',
        drawingFileName: 'DWG-CS-5001-GRIND.pdf',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۳',
        uploadedBy: 'مهندس کریمی (مهندسی)'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        stageName: 'کاروسل: کف‌تراشی و پیش‌تراش پله‌ها',
        machineToolId: 'MC-CAROUSEL-01',
        machineToolName: 'دستگاه کاروسل عمودی قطر ۱۶۰',
        operatorId: 'OP-02',
        operatorName: 'اکبر نوری',
        status: 'completed',
        plannedQty: 4,
        producedQty: 4,
        scrapQty: 0,
        qcApproved: true,
        qcInspectorName: 'مهندس اسدی (کنترل کیفیت)',
        qcNotes: 'ابعاد نشیمن مطابق نقشه است؛ زبری قابل قبول.'
      },
      {
        stageNumber: 2,
        stageName: 'فرز دروازه‌ای: شیارهای روغن و نشیمن',
        machineToolId: 'MC-MILL-GANTRY-01',
        machineToolName: 'فرز دروازه‌ای ۴ متری سنگین',
        operatorId: 'OP-01',
        operatorName: 'صابر رادمنش',
        status: 'completed',
        plannedQty: 4,
        producedQty: 4,
        scrapQty: 0,
        qcApproved: true,
        qcInspectorName: 'مهندس اسدی (کنترل کیفیت)',
        qcNotes: 'سوراخ‌های فیس با شابلون مستر چک شد.'
      },
      {
        stageNumber: 3,
        stageName: 'بورینگ: سیلندرهای ماردون',
        machineToolId: 'MC-BORING-01',
        machineToolName: 'دستگاه بورینگ افقی ۱۱۰ میلی‌متر',
        operatorId: 'OP-05',
        operatorName: 'رضا محمودی',
        status: 'completed',
        plannedQty: 4,
        producedQty: 4,
        scrapQty: 0,
        qcApproved: true,
        qcInspectorName: 'مهندس اسدی (کنترل کیفیت)',
        qcNotes: 'فاصله سنتر ۱۲۵.۰۱۲ میلی‌متر، تلورانس پاس شد.'
      },
      {
        stageNumber: 4,
        stageName: 'سنگ مغناطیس: سنگ‌زنی فیس',
        machineToolId: 'MC-GRIND-01',
        machineToolName: 'دستگاه سنگ مغناطیس تخت ۶۰×۱۵۰',
        operatorId: 'OP-04',
        operatorName: 'علی میرزایی',
        status: 'in_progress',
        plannedQty: 4,
        producedQty: 3,
        scrapQty: 0,
        qcApproved: false
      }
    ]
  },
  {
    id: 'PO-1403-089',
    orderNumber: 'PO-89/RB350',
    title: 'تولید روتور تری‌لپ سه‌گوش بلوئر RB-350',
    isCustomOrder: false,
    compressorModelId: 'MOD-RB350',
    compressorModelName: 'بلوئر هوادهی روتس تایپ تری‌لپ RB-350',
    partId: 'PART-RB350-01',
    partName: 'روتور تری‌لپ سه‌گوش بلوئر روتس',
    partNumber: 'RB-TL-3501',
    quantity: 6,
    priority: 'normal',
    deadlineDate: '۱۴۰۳/۰۷/۰۵',
    createdDate: '۱۴۰۳/۰۶/۱۲',
    createdByRole: 'planning',
    createdByName: 'مهندس رضایی (برنامه‌ریزی)',
    status: 'in_production',
    completionPercentage: 45,
    notes: 'تولید بچ جدید روتورهای بلوئر برای خط مونتاژ هفتگی',
    quotes: [
      {
        id: 'Q-089-1',
        orderId: 'PO-1403-089',
        supplierName: 'ریخته‌گری دقیق اصفهان',
        supplierType: 'foundry',
        amountRials: 980000000,
        deliveryTimeDays: 10,
        dateSubmitted: '۱۴۰۳/۰۶/۱۳',
        status: 'approved_by_ceo',
        attachmentFileName: 'Factor-Isfahan-Rotors.pdf',
        submittedBy: 'مهندس رضایی',
        decidedAt: '۱۴۰۳/۰۶/۱۴'
      }
    ],
    engineeringDocs: [
      {
        stageNumber: 1,
        stageName: 'کاروسل: پیش‌تراش قطر',
        drawingNumber: 'DWG-RB-3501-1',
        drawingFileName: 'DWG-RB350-CAROUSEL.pdf',
        stepFileName: 'STP-RB350-TRILOBE.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۵',
        uploadedBy: 'مهندس کریمی (مهندسی)'
      },
      {
        stageNumber: 2,
        stageName: 'فرز دروازه‌ای: تراش پروفیل ۳ لوپ',
        drawingNumber: 'DWG-RB-3501-2',
        drawingFileName: 'DWG-RB350-GANTRY.pdf',
        stepFileName: 'STP-RB350-GANTRY.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۵',
        uploadedBy: 'مهندس کریمی (مهندسی)'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        stageName: 'کاروسل: پیش‌تراش قطر و پخ‌زنی',
        machineToolId: 'MC-CAROUSEL-01',
        machineToolName: 'دستگاه کاروسل عمودی',
        status: 'completed',
        plannedQty: 6,
        producedQty: 6,
        scrapQty: 0,
        qcApproved: true,
        qcInspectorName: 'مهندس اسدی'
      },
      {
        stageNumber: 2,
        stageName: 'فرز دروازه‌ای: تراش پروفیل ۳ لوپ',
        machineToolId: 'MC-MILL-GANTRY-01',
        machineToolName: 'فرز دروازه‌ای ۴ متری سنگین',
        operatorId: 'OP-01',
        operatorName: 'صابر رادمنش',
        status: 'qc_pending',
        plannedQty: 6,
        producedQty: 6,
        scrapQty: 0,
        qcApproved: false
      }
    ]
  },
  {
    id: 'PO-1403-090',
    orderNumber: 'PO-90/MR500',
    title: 'ساخت ماردون نری فولاد VCN200 کمپرسور اسکرو SC-500',
    isCustomOrder: false,
    compressorModelId: 'MOD-SC500',
    compressorModelName: 'کمپرسور اسکرو فشار قوی دائم‌کار صنعتی SC-500',
    partId: 'PART-SC500-02',
    partName: 'ماردون نری (Male Rotor) اسکرو سنگین',
    partNumber: 'CP-MR-5002',
    quantity: 4,
    priority: 'emergency',
    deadlineDate: '۱۴۰۳/۰۶/۲۵',
    createdDate: '۱۴۰۳/۰۶/۱۴',
    createdByRole: 'ceo',
    createdByName: 'دکتر جمشیدی (مدیرعامل)',
    status: 'in_production',
    completionPercentage: 55,
    notes: 'فوری اورژانسی برای جایگزینی در واحد اورهال پالایشگاه گاز',
    quotes: [
      {
        id: 'Q-090-1',
        orderId: 'PO-1403-090',
        supplierName: 'فولاد آلیاژی اصفهان - بارازگانی شایان',
        supplierType: 'raw_material',
        amountRials: 620000000,
        deliveryTimeDays: 3,
        dateSubmitted: '۱۴۰۳/۰۶/۱۴',
        status: 'approved_by_ceo',
        attachmentFileName: 'Pishfactor-Foolad-VCN200.pdf',
        submittedBy: 'مهندس رضایی',
        decidedAt: '۱۴۰۳/۰۶/۱۵'
      }
    ],
    engineeringDocs: [
      {
        stageNumber: 1,
        stageName: 'تراش منوال: خشن‌تراشی پیشانی',
        drawingNumber: 'DWG-MR-5002-S1',
        drawingFileName: 'DWG-MR-5002-LATHE.pdf',
        stepFileName: 'STP-MR-5002-ROTOR.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۵',
        uploadedBy: 'مهندس کریمی (مهندسی)',
        cadPreviewData: {
          primitiveShape: 'cylinder_rotor',
          dimensions: { length: 480, diameter: 145, extra: '5-Flute Helical' }
        }
      },
      {
        stageNumber: 2,
        stageName: 'تراش CNC: فرم پروفیل ۵ لوپ',
        drawingNumber: 'DWG-MR-5002-S2',
        drawingFileName: 'DWG-MR-5002-CNC.pdf',
        stepFileName: 'STP-MR-5002-CNC-PATH.step',
        isApproved: true,
        uploadedAt: '۱۴۰۳/۰۶/۱۵',
        uploadedBy: 'مهندس کریمی (مهندسی)'
      }
    ],
    stages: [
      {
        stageNumber: 1,
        stageName: 'تراش منوال: خشن‌تراشی پیشانی',
        machineToolId: 'MC-LATHE-MAN-01',
        machineToolName: 'تراش منوال سنگین ۳ متری تبریز',
        status: 'engineering_qc_pending',
        plannedQty: 4,
        producedQty: 4,
        scrapQty: 0,
        qcApproved: true,
        qcInspectorName: 'مهندس کاظمی (کنترل کیفیت)',
        qcNotes: 'تلرانس‌های محوری و ابعادی کنترل شد؛ زبری سطح مطلوب Ra 0.8',
        qcReport: {
          reportNumber: 'QC-1403-882',
          inspectedAt: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۸:۵۰',
          inspectorName: 'مهندس کاظمی',
          inspectorPersonnelCode: 'EMP-4001',
          passedQty: 4,
          rejectedQty: 0,
          conditionalQty: 0,
          decision: 'approved',
          dimensionalCheckPassed: true,
          surfaceRoughnessPassed: true,
          hardnessRockwell: '58 HRC',
          roughnessRa: 'Ra 0.8 µm',
          measuredTolerances: 'انحراف لنگی شعاعی کمتر از ۰.۰۰۵ میلی‌متر',
          notes: 'قطعات مطابق نقشه DWG-MR-5002-S1 بازرسی شد و ابعاد کاملاً منطبق است.',
          sheetFileName: 'QC_Inspection_Sheet_MR5002_Stg1.pdf',
          sheetFileSize: '1.4 MB',
          sheetUploadedAt: '۱۴۰۳/۰۶/۱۹ - ۰۸:۵۵'
        }
      },
      {
        stageNumber: 2,
        stageName: 'تراش CNC: تراش فرم دقیق پروفیل ۵ لوپ',
        machineToolId: 'MC-LATHE-CNC-01',
        machineToolName: 'تراش CNC دقیق ۲ محور',
        operatorId: 'OP-03',
        operatorName: 'وحید قاسمی',
        status: 'in_progress',
        plannedQty: 4,
        producedQty: 2,
        scrapQty: 0,
        qcApproved: false
      }
    ]
  },
  {
    id: 'PO-1403-091',
    orderNumber: 'PO-91/CUSTOM',
    title: 'سفارش ساخت سفارشی: روتور دوفاز پمپ خلاء لوب تایپ صنایع دارویی',
    isCustomOrder: true,
    customDetails: {
      partName: 'روتور دوار ضدخوردگی پمپ وکیوم لوب تایپ',
      application: 'کاربرد در محیط دارویی خلاء بالا و مقاوم به اسید نیتریک و الکل',
      material: 'استنلس استیل ۳۱۶L فورج شده نگیر (1.4404)',
      technicalSpecs: 'قطر خارجی ۲۱۰ میلی‌متر، طول کاری ۳۴۰ میلی‌متر، تلورانس هم‌محوری ۰.۰۰۸، صافی سطح آینه‌ای Ra 0.2',
      sampleProvided: true
    },
    partName: 'روتور دوار ضدخوردگی پمپ وکیوم ۳۱۶L',
    partNumber: 'CUST-VC-9101',
    quantity: 2,
    priority: 'urgent',
    deadlineDate: '۱۴۰۳/۰۷/۱۵',
    createdDate: '۱۴۰۳/۰۶/۱۶',
    createdByRole: 'ceo',
    createdByName: 'دکتر جمشیدی (مدیرعامل)',
    status: 'pending_ceo_quote',
    completionPercentage: 10,
    notes: 'سفارش دستی ویژه مدیرعامل؛ پیش‌فاکتور شمش استیل ۳۱۶L توسط برنامه‌ریزی استعلام شده و منتظر تایید مدیرعامل است.',
    quotes: [
      {
        id: 'Q-091-1',
        orderId: 'PO-1403-091',
        supplierName: 'فولاد استیل پارس خاورمیانه',
        supplierType: 'raw_material',
        amountRials: 890000000,
        deliveryTimeDays: 7,
        dateSubmitted: '۱۴۰۳/۰۶/۱۷',
        status: 'pending_ceo',
        attachmentFileName: 'Pishfactor-Steel316L-Pars.pdf',
        attachmentFileType: 'pdf',
        notes: 'دو شاخه میلگرد قطور استیل ۳۱۶L با سرتیفیکیت کمپانی آلمانی Outokumpu',
        submittedBy: 'مهندس رضایی (برنامه‌ریزی)'
      },
      {
        id: 'Q-091-2',
        orderId: 'PO-1403-091',
        supplierName: 'بازرگانی استیل ایران‌زمین',
        supplierType: 'raw_material',
        amountRials: 940000000,
        deliveryTimeDays: 5,
        dateSubmitted: '۱۴۰۳/۰۶/۱۸',
        status: 'pending_ceo',
        attachmentFileName: 'Pishfactor-IranZamin-Steel.pdf',
        attachmentFileType: 'pdf',
        notes: 'تحویل سریع‌تر انبار تهران با سرتیفیکیت هندی',
        submittedBy: 'مهندس رضایی (برنامه‌ریزی)'
      }
    ],
    engineeringDocs: [],
    stages: []
  },
  {
    id: 'PO-1403-092',
    orderNumber: 'PO-92/LC180',
    title: 'تولید سیلندر دو محفظه کمپرسور لوپ LC-180',
    isCustomOrder: false,
    compressorModelId: 'MOD-LC180',
    compressorModelName: 'کمپرسور لوپ تایپ صنعتی دو مرحله‌ای LC-180',
    partId: 'PART-LC180-01',
    partName: 'سیلندر دو محفظه کمپرسور لوپ تایپ',
    partNumber: 'LB-CS-1801',
    quantity: 2,
    priority: 'normal',
    deadlineDate: '۱۴۰۳/۰۷/۱۰',
    createdDate: '۱۴۰۳/۰۶/۱۷',
    createdByRole: 'planning',
    createdByName: 'مهندس رضایی (برنامه‌ریزی)',
    status: 'awaiting_engineering',
    completionPercentage: 20,
    notes: 'متریال ریختگی دریافت شد؛ درخواست نقشه‌ها و فایل STEP به واحد مهندسی ارسال گردیده است.',
    quotes: [
      {
        id: 'Q-092-1',
        orderId: 'PO-1403-092',
        supplierName: 'صنایع ریخته‌گری ساوه چدن',
        supplierType: 'foundry',
        amountRials: 1120000000,
        deliveryTimeDays: 12,
        dateSubmitted: '۱۴۰۳/۰۶/۱۶',
        status: 'approved_by_ceo',
        attachmentFileName: 'Pishfactor-SavehChodan-LC180.pdf',
        submittedBy: 'مهندس رضایی',
        decidedAt: '۱۴۰۳/۰۶/۱۷'
      }
    ],
    engineeringDocs: [],
    stages: []
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-01',
    title: 'هشدار توقف دستگاه کاروسل عمودی',
    message: 'دستگاه کاروسل عمودی (CR-601) توسط اپراتور اکبر نوری به علت داغ کردن یاتاقان هیدرواستاتیک متوقف شد.',
    type: 'error',
    targetRoles: ['super_admin', 'production', 'planning'],
    createdAt: '۱۴۰۳/۰۶/۱۹ - ۰۹:۱۵',
    isRead: false
  },
  {
    id: 'NOTIF-02',
    title: 'پیش‌فاکتور جدید در انتظار تایید مدیرعامل',
    message: 'دو پیش‌فاکتور برای شمش استیل ۳۱۶L سفارش سفارشی روتور وکیوم (PO-91/CUSTOM) آماده بررسی است.',
    type: 'warning',
    targetRoles: ['ceo', 'planning'],
    createdAt: '۱۴۰۳/۰۶/۱۸ - ۱۶:۳۰',
    isRead: false,
    linkOrderId: 'PO-1403-091'
  },
  {
    id: 'NOTIF-03',
    title: 'درخواست نقشه ساخت و فایل STEP از واحد مهندسی',
    message: 'سفارش PO-92/LC180 متریال را تحویل گرفته و نیازمند بارگذاری نقشه‌های فرز و بورینگ است.',
    type: 'info',
    targetRoles: ['engineering'],
    createdAt: '۱۴۰3/۰۶/۱۷ - ۱۱:۴۵',
    isRead: false,
    linkOrderId: 'PO-1403-092'
  },
  {
    id: 'NOTIF-04',
    title: 'اتمام مرحله ۳ ساخت پوسته ایراند SC-500',
    message: 'مرحله بورینگ با موفقیت پایان یافته و توسط کنترل کیفی تایید شد و قطعه به ایستگاه سنگ مغناطیس منتقل شد.',
    type: 'success',
    targetRoles: ['production', 'planning'],
    createdAt: '۱۴۰۳/۰۶/۱۸ - ۱۵:۲۰',
    isRead: true,
    linkOrderId: 'PO-1403-088'
  }
];

export const INITIAL_WAREHOUSE: WarehouseItem[] = [
  {
    id: 'WH-01',
    partNumber: 'CP-CS-5001',
    name: 'پوسته چدنی ایراند کمپرسور اسکرو SC-500 (نیمه‌ساخته)',
    type: 'semi_finished',
    quantity: 3,
    unit: 'عدد',
    shelfLocation: 'بخش A - قفسه سنگین ۱۰۴',
    lastUpdated: '۱۴۰۳/۰۶/۱۵'
  },
  {
    id: 'WH-02',
    partNumber: 'CP-BRG-5005',
    name: 'بلبرینگ دور بالا تماس زاویه‌ای دوبل SKF اصل',
    type: 'bought_out',
    quantity: 18,
    unit: 'ست',
    shelfLocation: 'انبار قطعات حساس - قفسه ۱۲',
    lastUpdated: '۱۴۰۳/۰۶/۱۷'
  },
  {
    id: 'WH-03',
    partNumber: 'ST-BLT-109',
    name: 'پیچ آلن سرسیلندر گرید 10.9 ضد برش M16x80',
    type: 'bought_out',
    quantity: 240,
    unit: 'عدد',
    shelfLocation: 'قفسه پیچ و مهره - ردیف ۳',
    lastUpdated: '۱۴۰۳/۰۶/۱۴'
  },
  {
    id: 'WH-04',
    partNumber: 'RB-TL-3501',
    name: 'روتور تری‌لپ آماده نصب بلوئر RB-350 (نهایی)',
    type: 'final_product',
    quantity: 6,
    unit: 'عدد',
    shelfLocation: 'انبار خط مونتاژ بلوئر - پالت ۴',
    lastUpdated: '۱۴۰۳/۰۶/۱۶'
  },
  {
    id: 'WH-05',
    partNumber: 'RAW-GGG40-BLK',
    name: 'شمش خام چدن داکتیل نشکن ریخته‌گری شده',
    type: 'raw_material',
    quantity: 12,
    unit: 'قالب',
    shelfLocation: 'انبار متریال ورودی کارخانه',
    lastUpdated: '۱۴۰۳/۰۶/۱۸'
  }
];

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'USR-01',
    username: 'admin',
    password: '123',
    fullName: 'مهندس کاظمی (مدیر ارشد سیستم)',
    role: 'super_admin',
    department: 'فناوری اطلاعات و مدیریت زیرساخت کارخانه',
    personnelCode: 'EMP-1001',
    phone: '09121112233',
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۰۱',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۸:۳۰'
  },
  {
    id: 'USR-02',
    username: 'ceo',
    password: '123',
    fullName: 'مهندس علوی (مدیرعامل)',
    role: 'ceo',
    department: 'مدیریت عامل و هیئت مدیره',
    personnelCode: 'EMP-1002',
    phone: '09122223344',
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۰۱',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۸:۴۵'
  },
  {
    id: 'USR-03',
    username: 'planning',
    password: '123',
    fullName: 'مهندس صادقی (مدیر برنامه‌ریزی)',
    role: 'planning',
    department: 'واحد برنامه‌ریزی تولید و تدارکات خرید',
    personnelCode: 'EMP-1003',
    phone: '09123334455',
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۰۵',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۹:۰۰'
  },
  {
    id: 'USR-04',
    username: 'engineering',
    password: '123',
    fullName: 'مهندس رحیمی (سرپرست مهندسی)',
    role: 'engineering',
    department: 'تحقیق و توسعه، نقشه‌کشی و CAD/CAM',
    personnelCode: 'EMP-1004',
    phone: '09124445566',
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۱۰',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۹:۱۵'
  },
  {
    id: 'USR-05',
    username: 'production',
    password: '123',
    fullName: 'مهندس اکبری (مدیر سالن تولید)',
    role: 'production',
    department: 'سالن ماشین‌کاری سنگین و خطوط ساخت',
    personnelCode: 'EMP-1005',
    phone: '09125556677',
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۱۵',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۹:۲۰'
  },
  {
    id: 'USR-06',
    username: 'operator',
    password: '123',
    fullName: 'علی مرادی (اپراتور ارشد تراشکاری و فرز)',
    role: 'operator',
    department: 'ایستگاه ماشین‌ابزار و اپراتوری سالن',
    personnelCode: 'EMP-2001',
    phone: '09126667788',
    isActive: true,
    createdAt: '۱۴۰۳/۰۲/۰۱',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۷:۳۰'
  },
  {
    id: 'USR-07',
    username: 'warehouse',
    password: '123',
    fullName: 'رضا حسینی (مسئول انبار مرکزی)',
    role: 'warehouse',
    department: 'انبار قطعات یدکی، نیمه‌ساخته و ریخته‌گری',
    personnelCode: 'EMP-3001',
    phone: '09127778899',
    isActive: true,
    createdAt: '۱۴۰۳/۰۲/۱۵',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۸:۰۰'
  },
  {
    id: 'USR-08',
    username: 'qc',
    password: '123',
    fullName: 'مهندس کاظمی (سرپرست کنترل کیفیت و CMM)',
    role: 'qc',
    department: 'واحد کنترل کیفیت، اندازه‌برداری دقیق و آزمایشگاه متالورژی',
    personnelCode: 'EMP-4001',
    phone: '09128889900',
    isActive: true,
    createdAt: '۱۴۰۳/۰۳/۰۱',
    lastLogin: '۱۴۰۳/۰۶/۱۹ - ساعت ۰۸:۳۰'
  }
];
