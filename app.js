document.addEventListener('DOMContentLoaded', () => {
  // ⚙️ ЗАМЕНИ на адрес своего бэкенда после деплоя на Timeweb:
  const HISPANIST_API = 'https://ЗАМЕНИ-НА-АДРЕС-БЭКЕНДА';
  const PREMIUM_PRICE = '249';
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

  // ===== ЗАГРУЗКА СЛОВ =====
  fetch('spanish_500.json')
    .then(res => res.json())
    .then(data => {
      allTopics = data.temas;
      renderTopics();
    })
    .catch(err => {
      topicsGrid.innerHTML = '<p>Ошибка загрузки данных. Пожалуйста, обновите страницу.</p>';
      console.error(err);
    });

  // Разделяем эмодзи и текст в названии темы
  function splitEmoji(title) {
    const m = title.match(/^(\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic})*(?:\uFE0F)?)\s*(.*)$/u);
    if (m) return { emoji: m[1], text: m[2] };
    return { emoji: '📚', text: title };
  }

  // ===== ОТРИСОВКА ТЕМ =====
  function renderTopics() {
    topicsGrid.innerHTML = '';
    for (let [key, topic] of Object.entries(allTopics)) {
      const card = document.createElement('div');
      card.className = 'topic-card';
      const locked = topic.premium && !isPremium();
      if (locked) {
        card.classList.add('locked');
        const e1 = splitEmoji(topic.title);
        card.innerHTML = `<span class="topic-emoji">${e1.emoji}</span><strong>${e1.text}</strong><small>${topic.words.length} слов</small><span class="lock-badge">🔒 Премиум</span>`;
        // Клик по замку — открываем окно премиума (а не просто alert)
        card.addEventListener('click', openPremiumModal);
      } else {
        const e2 = splitEmoji(topic.title);
        const badge = topic.premium ? '' : '<span class="free-badge">Бесплатно</span>';
        card.innerHTML = `<span class="topic-emoji">${e2.emoji}</span><strong>${e2.text}</strong><small>${topic.words.length} слов</small>${badge}`;
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
    wordEs.textContent = wordObj.es;
    wordRu.textContent = wordObj.ru;
    example.textContent = wordObj.example || '';
    flashcard.classList.remove('flipped');
    againBtn.classList.add('hidden');
    goodBtn.classList.add('hidden');
    flipBtn.classList.remove('hidden');
  }

  // ===== ПЕРЕВОРОТ КАРТОЧКИ =====
  flipBtn.addEventListener('click', () => {
    flashcard.classList.add('flipped');
    againBtn.classList.remove('hidden');
    goodBtn.classList.remove('hidden');
    flipBtn.classList.add('hidden');
  });

  flashcard.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    if (!flashcard.classList.contains('flipped')) {
      flashcard.classList.add('flipped');
      againBtn.classList.remove('hidden');
      goodBtn.classList.remove('hidden');
      flipBtn.classList.add('hidden');
    }
  });

  // ===== ОТВЕТЫ =====
  goodBtn.addEventListener('click', () => {
    updateSRS(dueWords[currentIndex].id, 'good');
    nextWord();
  });

  againBtn.addEventListener('click', () => {
    updateSRS(dueWords[currentIndex].id, 'again');
    flashcard.classList.remove('flipped');
    againBtn.classList.add('hidden');
    goodBtn.classList.add('hidden');
    flipBtn.classList.remove('hidden');
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
    // Триггерный экран показываем, только если тема бесплатная И премиум ещё не куплен
    if (wasFree && !isPremium()) {
      showCelebrate();
    } else {
      alert('✅ Вы повторили все запланированные слова!');
      backToHome();
    }
  }

  function showCelebrate() {
    // Подсчёт: сколько бесплатных слов всего доступно
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
    if (dueWords.length === 0) return;
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
  // Оплата премиума через бэкенд (ЮKassa)
  function openPremiumModal() {
    premiumModal.classList.remove('hidden');
    premiumMessage.textContent = '';
    premiumCodeInput.value = '';
  }

  goPremiumBtn.addEventListener('click', openPremiumModal);

  // ===== ОПЛАТА через ЮKassa =====
  const buyBtn = document.getElementById('buy-premium');
  if (buyBtn) {
    buyBtn.addEventListener('click', async () => {
      buyBtn.disabled = true;
      buyBtn.textContent = 'Переходим к оплате…';
      try {
        const returnUrl = location.origin + location.pathname.replace(/index\.html$/, '') + 'return.html';
        const res = await fetch(`${HISPANIST_API}/api/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ return_url: returnUrl })
        });
        if (!res.ok) throw new Error('pay failed');
        const data = await res.json();
        // сохраним id платежа, чтобы страница возврата показала код
        localStorage.setItem('last_payment_id', data.payment_id);
        window.location.href = data.confirmation_url;
      } catch (e) {
        buyBtn.disabled = false;
        buyBtn.textContent = `Оплатить ${PREMIUM_PRICE} ₽`;
        premiumMessage.style.color = '#e63946';
        premiumMessage.textContent = '❌ Не удалось начать оплату. Попробуйте позже.';
      }
    });
  }


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
    premiumMessage.style.color = '#a87a63';
    premiumMessage.textContent = 'Проверяем код…';
    try {
      const res = await fetch(`${HISPANIST_API}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
      if (res.ok) {
        const data = await res.json();
        const days = data.days || 30;
        const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
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
        premiumMessage.textContent = '❌ Неверный код или он ещё не оплачен.';
      }
    } catch (e) {
      premiumMessage.style.color = '#e63946';
      premiumMessage.textContent = '❌ Ошибка связи. Проверьте интернет и попробуйте снова.';
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
