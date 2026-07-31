fetch('spanish_500.json')
  document.addEventListener('DOMContentLoaded', () => {
  // --- DOM элементы ---
  const homeScreen = document.getElementById('home-screen');
  const studyScreen = document.getElementById('study-screen');
  const celebrateScreen = document.getElementById('celebrate-screen');
  const topicsGrid = document.getElementById('topics-grid');
  const backBtn = document.getElementById('back-btn');
  const topicTitle = document.getElementById('topic-title');
  const studiedCount = document.getElementById('studied-count');
  const flashcard = document.getElementById('flashcard');
  const flipBtn = document.getElementById('flip-btn');
  const againBtn = document.getElementById('again-btn');
  const goodBtn = document.getElementById('good-btn');
  const speakBtn = document.getElementById('speak-btn');
  const wordEs = document.getElementById('word-es');
  const wordRu = document.getElementById('word-ru');
  const example = document.getElementById('example');
  const premiumModal = document.getElementById('premium-modal');
  const goPremiumBtn = document.getElementById('go-premium');
  const activateBtn = document.getElementById('activate-premium');
  const closeModal = document.getElementById('close-modal');
  const premiumMessage = document.getElementById('premium-message');
  const premiumCodeInput = document.getElementById('premium-code');
  const celebrateStat = document.getElementById('celebrate-stat');
  const celebratePremiumBtn = document.getElementById('celebrate-premium');
  const celebrateSkipBtn = document.getElementById('celebrate-skip');

  // --- Глобальные переменные ---
  let allTopics = {};
  let currentTopicKey = '';
  let currentWords = [];
  let dueWords = [];
  let currentIndex = 0;
  let isFlipping = false; // блокировка повторных кликов во время анимации

  // ===== ЗАГРУЗКА СЛОВ =====
  fetch('spanish_1500.json')   // ← новый файл с 1500 словами
    .then(res => res.json())
    .then(data => {
      allTopics = data.temas;
      renderTopics();
    })
    .catch(err => {
      topicsGrid.innerHTML = '<p>Ошибка загрузки данных. Пожалуйста, обновите страницу.</p>';
      console.error(err);
    });

  // ===== ОТРИСОВКА ТЕМ =====
  function renderTopics() {
    topicsGrid.innerHTML = '';
    for (let [key, topic] of Object.entries(allTopics)) {
      const card = document.createElement('div');
      card.className = 'topic-card';
      const locked = topic.premium && !isPremium();
      if (locked) {
        card.classList.add('locked');
        card.innerHTML = `<strong>${topic.title}</strong><small>${topic.words.length} слов</small><span class="lock-badge">Премиум</span>`;
        card.addEventListener('click', openPremiumModal);
      } else {
        const badge = topic.premium ? '' : '<span class="free-badge">Бесплатно</span>';
        card.innerHTML = `<strong>${topic.title}</strong><small>${topic.words.length} слов</small>${badge}`;
        card.addEventListener('click', () => startStudy(key));
      }
      topicsGrid.appendChild(card);
    }
  }

  // ===== НАЧАЛО ТРЕНИРОВКИ =====
  function startStudy(topicKey) {
    const topic = allTopics[topicKey];
    if (topic.premium && !isPremium()) {
      openPremiumModal();
      return;
    }
    currentTopicKey = topicKey;
    currentWords = topic.words;
    dueWords = getDueWords(topicKey);
    if (dueWords.length === 0) {
      alert('🎉 На сегодня все слова этой темы повторены. Возвращайтесь позже!');
      return;
    }
    currentIndex = 0;
    studiedCount.textContent = '0';
    topicTitle.textContent = topic.title;
    showWord(dueWords[currentIndex]);
    homeScreen.classList.add('hidden');
    celebrateScreen.classList.add('hidden');
    studyScreen.classList.remove('hidden');
  }

  function showWord(wordObj) {
    // Сбрасываем блокировку, если была
    isFlipping = false;
    wordEs.textContent = wordObj.es;
    wordRu.textContent = wordObj.ru;
    example.textContent = wordObj.example || '';
    flashcard.classList.remove('flipped');
    againBtn.classList.add('hidden');
    goodBtn.classList.add('hidden');
    flipBtn.classList.remove('hidden');
  }

  // ===== ПЕРЕВОРОТ КАРТОЧКИ (с защитой от повторного клика) =====
  function flipCard() {
    if (isFlipping) return;
    isFlipping = true;
    flashcard.classList.add('flipped');
    againBtn.classList.remove('hidden');
    goodBtn.classList.remove('hidden');
    flipBtn.classList.add('hidden');
    // Снимаем блокировку после завершения анимации
    setTimeout(() => {
      isFlipping = false;
    }, 700); // чуть больше длительности transition (0.6s)
  }

  flipBtn.addEventListener('click', flipCard);

  flashcard.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    if (!flashcard.classList.contains('flipped')) {
      flipCard();
    }
  });

  // ===== ОТВЕТЫ =====
  goodBtn.addEventListener('click', () => {
    if (isFlipping) return;
    updateSRS(dueWords[currentIndex].id, 'good');
    nextWord();
  });

  againBtn.addEventListener('click', () => {
    if (isFlipping) return;
    updateSRS(dueWords[currentIndex].id, 'again');
    // Показываем ту же карточку заново (без переворота)
    flashcard.classList.remove('flipped');
    againBtn.classList.add('hidden');
    goodBtn.classList.add('hidden');
    flipBtn.classList.remove('hidden');
    // Не увеличиваем счётчик изученных
  });

  function nextWord() {
    studiedCount.textContent = parseInt(studiedCount.textContent) + 1;
    currentIndex++;
    if (currentIndex >= dueWords.length) {
      finishTopic();
    } else {
      showWord(dueWords[currentIndex]);
    }
  }

  // ===== ЗАВЕРШЕНИЕ ТЕМЫ =====
  function finishTopic() {
    const finishedTopic = allTopics[currentTopicKey];
    const wasFree = !finishedTopic.premium;
    if (wasFree && !isPremium()) {
      showCelebrate();
    } else {
      alert('✅ Вы повторили все запланированные слова!');
      backToHome();
    }
  }

  function showCelebrate() {
    let freeWords = 0;
    for (let t of Object.values(allTopics)) {
      if (!t.premium) freeWords += t.words.length;
    }
    celebrateStat.textContent = `Вам открыто уже ${freeWords} слов`;
    studyScreen.classList.add('hidden');
    homeScreen.classList.add('hidden');
    celebrateScreen.classList.remove('hidden');
    fireConfetti();
    setTimeout(fireConfetti, 700);
  }

  celebratePremiumBtn.addEventListener('click', () => {
    celebrateScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderTopics();
    openPremiumModal();
  });
  celebrateSkipBtn.addEventListener('click', () => {
    celebrateScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderTopics();
  });

  // ===== ОЗВУЧКА =====
  speakBtn.addEventListener('click', () => {
    if (dueWords.length === 0 || currentIndex >= dueWords.length) return;
    const utterance = new SpeechSynthesisUtterance(dueWords[currentIndex].es);
    utterance.lang = 'es-ES';
    speechSynthesis.speak(utterance);
  });

  // ===== ВОЗВРАТ НА ГЛАВНУЮ =====
  backBtn.addEventListener('click', backToHome);

  function backToHome() {
    studyScreen.classList.add('hidden');
    celebrateScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderTopics();
  }

  // ===== ПРЕМИУМ ЛОГИКА =====
  const PREMIUM_HASH = '7a2f5099bf9b59a7d2885737c912ea64960fd2cf6919860bce18414bf4946db7';

  function openPremiumModal() {
    premiumModal.classList.remove('hidden');
    premiumMessage.textContent = '';
    premiumCodeInput.value = '';
  }

  goPremiumBtn.addEventListener('click', openPremiumModal);

  closeModal.addEventListener('click', () => {
    premiumModal.classList.add('hidden');
  });

  activateBtn.addEventListener('click', async () => {
    const code = premiumCodeInput.value.trim();
    if (!code) {
      premiumMessage.textContent = 'Введите код.';
      premiumMessage.style.color = '#e63946';
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === PREMIUM_HASH) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('premium_expiry', expiry.toString());
      premiumMessage.style.color = '#2e9d5a';
      premiumMessage.textContent = '✅ Премиум активирован на 30 дней!';
      fireConfetti();
      setTimeout(() => {
        premiumModal.classList.add('hidden');
        renderTopics();
      }, 1200);
    } else {
      premiumMessage.style.color = '#e63946';
      premiumMessage.textContent = '❌ Неверный код. Попробуйте снова.';
    }
  });

  premiumCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activateBtn.click();
  });

  function isPremium() {
    const expiry = localStorage.getItem('premium_expiry');
    return expiry && Date.now() < parseInt(expiry);
  }

  // ===== АЛГОРИТМ SRS (упрощённый SM-2) =====
  function getDueWords(topicKey) {
    const storageKey = `srs_${topicKey}`;
    let srsData = JSON.parse(localStorage.getItem(storageKey)) || {};
    let due = [];

    for (let word of currentWords) {
      const wordId = word.es;
      const record = srsData[wordId] || {
        dueDate: Date.now(),
        interval: 0,
        easeFactor: 2.5
      };
      if (Date.now() >= record.dueDate) {
        due.push({ ...word, id: wordId, ...record });
      }
    }

    if (due.length === 0) {
      due = currentWords.map(w => ({
        ...w,
        id: w.es,
        dueDate: Date.now(),
        interval: 0,
        easeFactor: 2.5
      }));
    }
    return due;
  }

  function updateSRS(wordId, quality) {
    if (!currentTopicKey) return;
    const storageKey = `srs_${currentTopicKey}`;
    let srsData = JSON.parse(localStorage.getItem(storageKey)) || {};

    let record = srsData[wordId] || {
      interval: 0,
      easeFactor: 2.5,
      dueDate: Date.now()
    };

    if (quality === 'good') {
      if (record.interval === 0) record.interval = 1;
      else if (record.interval === 1) record.interval = 3;
      else record.interval = Math.round(record.interval * record.easeFactor);
      record.easeFactor = Math.min(2.5, record.easeFactor + 0.1);
    } else {
      record.interval = 0;
      record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
    }

    record.dueDate = Date.now() + record.interval * 24 * 60 * 60 * 1000;
    srsData[wordId] = record;
    localStorage.setItem(storageKey, JSON.stringify(srsData));
  }

  // ===== КОНФЕТТИ =====
  const confCanvas = document.getElementById('confettiCanvas');
  const confCtx = confCanvas.getContext('2d');
  let confParticles = [];
  let confRAF = null;
  const CONF_COLORS = ['#ff7a18', '#e63946', '#ffb703', '#ff9e40', '#ffd166'];

  function confResize() {
    confCanvas.width = window.innerWidth;
    confCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', confResize);
  confResize();

  function fireConfetti() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.35;
    const count = window.innerWidth < 600 ? 90 : 150;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      confParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 7,
        color: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }
    if (!confRAF) confLoop();
  }

  function confLoop() {
    confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
    confParticles.forEach(p => {
      p.vy += 0.22;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.008;
      confCtx.save();
      confCtx.globalAlpha = Math.max(0, p.life);
      confCtx.translate(p.x, p.y);
      confCtx.rotate(p.rot);
      confCtx.fillStyle = p.color;
      if (p.shape === 'rect') {
        confCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        confCtx.beginPath();
        confCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        confCtx.fill();
      }
      confCtx.restore();
    });
    confParticles = confParticles.filter(p => p.life > 0 && p.y < confCanvas.height + 40);
    if (confParticles.length > 0) {
      confRAF = requestAnimationFrame(confLoop);
    } else {
      confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
      confRAF = null;
    }
  }
});
