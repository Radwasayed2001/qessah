let timerIdJ = null, wordTimerId = null;
function clearTimersJ() {
  clearInterval(timerIdJ);
  clearInterval(wordTimerId);
}
document.addEventListener('DOMContentLoaded', () => {
  const playersJawwal = loadPlayers();
  let settingsJawwal       = { time: 60, categories: [] };
  let order = [], idx = 0;
  let currentPlayerJawwal  = 0, correctCount = 0;
  const roundResultsJ = [];

  // عتبة الميل بالنسبة للـ delta عن baseline
  const TILT_THRESHOLD = 30;  
  let baselineBeta = null;
  let tiltHandled  = false;

  // DOM refs
  const timeSlider    = document.getElementById('timeSlider');
  const timeValueJ     = document.getElementById('timeValue');
  const catsJ          = [...document.querySelectorAll('.checkbox-list input')];
  const startBtnJ      = document.getElementById('startHeadsUp');
  const backSettingsJ  = document.getElementById('backToGamesBtnJ');

  const passName      = document.getElementById('headsUpPlayerName');
  const passCount     = document.getElementById('headsUpCount');
  const gameWord      = document.getElementById('headsUpWord');
  const gameTimer     = document.getElementById('headsUpTimer');
  const btnCorrect    = document.getElementById('btnCorrect');
  const btnSkip       = document.getElementById('btnSkip');

  const endCount      = document.getElementById('headsUpCountCorrect');
  const nextPlayerBtnJ = document.getElementById('btnNextPlayer');

  const resultsBody   = document.getElementById('headsUpResultsBody');
  const replayBtn     = document.getElementById('btnReplayHeadsUp');
  const backGameBtnJ   = document.getElementById('btnBackHeadsUp');

  // يمسح كل المؤقتات
  

  // ضبط نص السلايدر
  timeSlider.addEventListener('input', e => {
    const v = +e.target.value;
    settingsJawwal.time = v;
    timeValueJ.textContent = v === 60 ? '1 دقيقة'
                          : v === 90 ? '1.5 دقيقة'
                                     : '2 دقائق';
  });

  // العودة للقائمة
  backSettingsJ.onclick = () => showScreen('gamesScreen');

  // زر/ابدأ
  startBtnJ.addEventListener('click', () => {
    settingsJawwal.categories = catsJ.filter(c => c.checked).map(c => c.value);
    if (!settingsJawwal.categories.length) {
       showAlert('warning','اختر مجموعة واحدة على الأقل!');
       return;
    }
    order = [];
    for (const cat of settingsJawwal.categories) {
      if (Array.isArray(WORDS[cat])) {
          order.push(...WORDS[cat]);
      } else {
          console.warn(`WORDS[${cat}] is undefined or not an array`);
      }
  }
  
    shuffle(order);
    idx = 0;
    currentPlayerJawwal = 0;
    roundResultsJ.length = 0;
    runTurn();
  });

  
  // معايرة نقطة المرجع وتصفير tiltHandled
  function resetTilt() {
    baselineBeta = null;
    tiltHandled  = false;
  }

  // كشف الميل بالنسبة للـ baseline
  function onTilt(e) {
    if (baselineBeta === null) {
      baselineBeta = e.beta;
      return;
    }
    const delta = e.beta - baselineBeta;
    if (!tiltHandled && delta > TILT_THRESHOLD) {
      tiltHandled = true;
      nextWord();
      setTimeout(() => tiltHandled = false, 800);
    }
  }

  // بداية دور لاعب
  function runTurn() {
    clearTimersJ();
    correctCount = 0;
    passName.textContent  = `📱 أعطِ الهاتف إلى: ${playersJawwal[currentPlayerJawwal]}`;
    passCount.textContent = '3';
    showScreen('headsUpPassPhone');

    let c = 3;
    wordTimerId = setInterval(() => {
      passCount.textContent = --c;
      if (c <= 0) {
        clearInterval(wordTimerId);
        startRound();
      }
    }, 1000);
  }

  // بدء الجولة
  function startRound() {
    clearTimersJ();
    resetTilt();
    showScreen('headsUpGameScreen');

    // إظهار أزرار ✓ و✗
    btnCorrect.style.display = btnSkip.style.display = 'inline-block';

    // تفعيل مستمع الميل
    window.addEventListener('deviceorientation', onTilt);

    let timeLeft = settingsJawwal.time;
    gameTimer.textContent = `⏰ ${timeLeft}s`;
    timerIdJ = setInterval(() => {
      timeLeft--;
      gameTimer.textContent = `⏰ ${timeLeft}s`;
      if (timeLeft <= 0) endRound();
    }, 1000);

    nextWord();
  }

  // عرض الكلمة التالية
  function nextWord() {
    if (idx >= order.length) {
      idx = 0;
      shuffle(order);
    }
    gameWord.textContent = order[idx++];
  }

  // الإجابة صحيحة
  btnCorrect.addEventListener('click', () => {
    correctCount++;
    nextWord();
  });

  // تخطي كلمة
  btnSkip.addEventListener('click', nextWord);

  // نهاية الجولة
  function endRound() {
    clearTimersJ();
    window.removeEventListener('deviceorientation', onTilt);
    btnCorrect.style.display = btnSkip.style.display = 'none';

    const name  = playersJawwal[currentPlayerJawwal];
    const score = correctCount * 5;
    const prev  = parseInt(localStorage.getItem(name)) || 0;
    const total = prev + score;
    localStorage.setItem(name, total);

    roundResultsJ.push({ name, correct: correctCount, score, total });
    endCount.textContent = correctCount;
    showScreen('headsUpEndTurn');
  }

  // التالي أو النتائج
  nextPlayerBtnJ.addEventListener('click', () => {
    currentPlayerJawwal++;
    if (currentPlayerJawwal < playersJawwal.length) runTurn();
    else showResults();
  });

  // عرض النتائج النهائية
  function showResults() {
    roundResultsJ.sort((a,b) => b.correct - a.correct);
    resultsBody.innerHTML = roundResultsJ.map((r,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${r.name}</td>
        <td>${r.correct}</td>
        <td>${r.score}</td>
        <td>${r.total}</td>
      </tr>
    `).join('');
    showScreen('headsUpResults');
  }

  // إعادة لعب أو عودة
  replayBtn.onclick   = () => showScreen('headsUpSettings');
  backGameBtnJ.onclick = () => showScreen('gamesScreen');
});

// تقليب مصفوفة
function shuffle(a) {
  return a.sort(() => Math.random() - 0.5);
}

const WORDS = {
  food: [
    'تفاح','موز','برتقال','عنب','كيوي','خوخ','رمان','فراولة','كرز','مانجو',
    'أناناس','جوافة','ليمون','بطيخ','تين','باذنجان','خيار','طماطم','جزر','بطاطس',
    'بروكلي','سبانخ','جزر_أصفر','بصل','ثوم','زنجبيل','جرجير','خس','بقدونس','نعناع',
    'ريحان','زعتر','فلفل_رومي','خيار_مخلل','زيتون','جمبري','سلطة','شوربة','بيتزا','برجر',
    'شاورما','سندويتش','كبسة','مكرونة','كسكسي','رز','برغل','تمر','كعك','بسطرمة'
  ],
  places: [
    'حديقة','مطار','مستشفى','مدرسة','جامعة','مكتبة','متحف','سينما','مسرح','مطعم',
    'مقهى','سوق','محطة_قطار','محطة_حافلات','ميناء','شاطئ','جبل','وادي','نهر','بحيرة',
    'جزيرة','قرية','مدينة','عاصمة','شارع','برج','قصر','قلعة','معبد','كنيسة',
    'جامع','فندق','منتجع','مستودع','مصنع','مزرعة','ملعب','ملاهي','حديقة_الحيوان','مكتبة_رقمية',
    'ساحة','مركز_تسوق','محمية','مخيم','خيمة','مغارة','كهف','غابة','صحراء','وادٍ'
  ],
  animals: [
    'أسد','نمر','فيل','زرافة','ثعلب','ذئب','قرد','خنزير','بقرة','حصان',
    'جمل','ماعز','خروف','دجاج','ديك','بط','وزة','بطة','سمكة','حوت',
    'دلفين','قرش','سلحفاة','تمساح','ضفدع','عقرب','نحلة','نملة','عقاب','صقر',
    'بومة','بطريق','كنغر','باندا','راكون','فأر','جرذ','هامستر','خنزير_غينيا','نمس',
    'طاووس','ديك_رومي','حمار','بغل','كاميل','ظبي','زنجبيل' // مثال على كلمة إضافية
  ],
  sports: [
    'كرة_قدم','تنس','كرة_سلة','سباحة','جري','دراجات','كرة_طائرة','ملاكمة','جودو','تايكوندو',
    'هوكي','رجبي','بيسبول','كريكيت','غولف','تزلج','تنس_طاولة','بولينج','فروسية','ترياتلون',
    'ماراثون','يوغا','بيلاتس','جمباز','زومبا','كرنفال','سباق_خيل','رماية','تسلق','صيد',
    'كرة_ماء','كرة_يد','رقص','الرياضات_الإلكترونية','سنوكر','بلياردو','غوص','ركض','قفز_عالي','قفز_مضمار'
  ],
  clothes: [
    'قميص','بنطال','فستان','تنورة','جاكيت','سترة','معطف','حذاء','حذاء_رياضي','قبعة',
    'وشاح','قفازات','بوكسر','يوجينا','نظارة_شمسية','حزام','جوارب','بدلة','تيشيرت','بيجاما',
    'مئزر','شال','جرزة','قبقاب','حذاء_جلد','شبشب','بلوزة','جينز','شورت','بوما'
  ],
  produce: [
    'خس','خيار','طماطم','جزر','بطاطس','بصل','ثوم','زنجبيل','فلفل','بروكلي',
    'قرنبيط','سبانخ','جرجير','كرفس','باذنجان','كوسا','قرع','بازلاء','ذرة','فاصولياء',
    'عدس','حمص','فطر','فجل','بازيلاء','بامية','لوبيا','بامية','بازلاء_خضراء','ذرة_حلوة'
  ],
  drinks: [
    'ماء','شاي','قهوة','عصير_برتقال','عصير_تفاح','عصير_ميموزا','حليب','شوكولاتة_ساخنة','كوكتيل','سودا',
    'بيبسي','كوكاكولا','سبرايت','مونتانا','اسبريسو','لاتيه','كابتشينو','موهيتو','ميلكشيك','عرقسوس',
    'عرق','نبيذ','جعة','مشروب_طاقة','عصير_رمان','عصير_مانجو','عصير_كرز','عصير_أناناس','ليموناضة','شاي_أخضر',
    'شاي_كركدية','شاي_نعناع'
  ],
  household: [
    'كرسي','طاولة','سرير','أريكة','خزانة','دولاب','ثلاجة','فرن','ميكرويف','غسالة',
    'مكواة','ناموسية','مروحة','مكيف','سخان','مصباح','مقلاة','قدر','مغسلة','مقعد',
    'رف','ستارة','سجادة','لوحة','مرآة','ساعة','تلفزيون','حاسوب','جهاز_صوت','محمصة'
  ],
  vehicles: [
    'سيارة','دراجة','حافلة','قطار','طائرة','سفينة','قارب','مركب','ترم','شاحنة',
    'دراجة_نارية','سكوتر','ترام','مترو','قطار_سريع','دراجة_هوائية','حافلة_مدارس','شاحنة_قمامة','رافعة','جرار',
    'سيارة_أجرة','ليموزين','يخت','زورق','ناقلة','صاروخ','درون','قاذفة','سفين','زورق_مجداف'
  ],
  cities: [
    'رياض','جدة','مكة','المدينة','دمشق','بيروت','القاهرة','بغداد','الاسكندرية','الدوحة',
    'عمان','الخرطوم','رام الله','الدار_البيضاء','طنجة','تونس','الجزائر','طرابلس','المنامة','مسقط',
    'القدس','لندن','باريس','نيويورك','روما','مدريد','برلين','لوس_أنجلوس','ساو_باولو','بكين'
  ],
  cartoons: [
    'مكي_ماوس','باتمان','سبايدرمان','سيمبسون','توم_وجيري','بيكاتشو','سلاحف_ننجا','باب_سماحة','باغز_باني','بيتلز',
    'نينجا_جسترو','كارز','حرب_النجوم','بوكيمون','دورا','آنا_إلسا','هيلاري','تشارلي_شابلن','توم_هولاند','ماجيك_جونز'
  ],
  games: [
    'شطرنج','دومينو','مونوبولي','لعبة_الورق','بازوكا','سوليتير','بوكر','ماينكرافت','فورتنايت','ببجي',
    'كود','أوفرواتش','ليغ_أوف_ليجيندز','فيفا','نيد_فور_سبيد','تيكن','ستريت_فايتر','بوبر','سنيك','تيتانفول'
  ],
  jobs: [
    'طبيب','مهندس','معلم','محامي','جزار','خباز','سائق','مزارع','طيار','بحار',
    'شرطي','جندي','حلاق','مغني','راقص','رسام','كاتب','صحفي','مترجم','مطور_برمجيات'
  ],
  langs: [
    'عربية','انجليزية','فرنسية','إسبانية','ألمانية','إيطالية','روسية','يابانية','صينية','كورية',
    'تركية','هولندية','هندية','فارسی','برتغالية','إندونيسية','ماليزية','فيتنامية','أردية','مالطية'
  ],
  countries: [
    'السعودية','مصر','العراق','سوريا','الأردن','لبنان','تونس','الجزائر','المغرب','الإمارات',
    'قطر','الكويت','عمان','البحرين','تركيا','فرنسا','ألمانيا','إيطاليا','إسبانيا','الولايات_المتحدة',
    'كندا','أستراليا','البرازيل','الأرجنتين','الهند','الصين','اليابان','كوريا_الجنوبية','المكسيك','روسيا'
  ]
};
function startJawwalGame(){
  if (players.length < 2) {
    showAlert('error', 'لعبة التوازن تتطلب لاعبين 2 على الأقل  ');
    return; 
  } 
  showScreen('headsUpSettings')
}
