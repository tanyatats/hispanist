document.addEventListener('DOMContentLoaded', () => {
  // --- DOM элементы ---
  const homeScreen = document.getElementById('home-screen');
  const studyScreen = document.getElementById('study-screen');
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

  // ===== ОТРИСОВКА ТЕМ =====
  function renderTopics() {
    topicsGrid.innerHTML = '';
    for (let [key, topic] of Object.entries(allTopics)) {
      const card = document.createElement('div');
      card.className = 'topic-card';
      if (topic.premium && !isPremium()) {
        card.classList.add('locked');
        card.innerHTML = `<strong>${topic.title}</strong><br><small>🔒 Премиум</small>`;
      } else {
        card.innerHTML = `<strong>${topic.title}</strong><br><small>${topic.words.length} слов</small>`;
        card.addEventListener('click', () => startStudy(key));
      }
      topicsGrid.appendChild(card);
    }
  }

  // ===== НАЧАЛО ТРЕНИРОВКИ =====
  function startStudy(topicKey) {
    const topic = allTopics[topicKey];
    if (topic.premium && !isPremium()) {
      alert('Эта тема доступна только с премиум-доступом. Активируйте код.');
      return;
    }
    currentTopicKey = topicKey;
    currentWords = topic.words;
    dueWords = getDueWords(topicKey);
    if (dueWords.length === 0) {
      alert('🎉 Поздравляем! На сегодня все слова выучены. Возвращайтесь позже.');
      return;
    }
    currentIndex = 0;
    studiedCount.textContent = '0';
    topicTitle.textContent = topic.title;
    showWord(dueWords[currentIndex]);
    homeScreen.classList.add('hidden');
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

  // Клик по самой карточке тоже переворачивает
  flashcard.addEventListener('click', (e) => {
    // Чтобы не срабатывало при нажатии на кнопки
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
    nextWord();
  });

  function nextWord() {
    studiedCount.textContent = parseInt(studiedCount.textContent) + 1;
    currentIndex++;
    if (currentIndex >= dueWords.length) {
      alert('✅ Вы повторили все запланированные слова!');
      backToHome();
    } else {
      showWord(dueWords[currentIndex]);
    }
  }

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
    homeScreen.classList.remove('hidden');
    renderTopics(); // обновить, например, прогресс
  }

  // ===== ПРЕМИУМ ЛОГИКА =====
  // Замените этот хэш на SHA-256 от вашего реального кода доступа!
  const PREMIUM_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // это хэш от "password"

  goPremiumBtn.addEventListener('click', () => {
    premiumModal.classList.remove('hidden');
    premiumMessage.textContent = '';
    premiumCodeInput.value = '';
  });

  closeModal.addEventListener('click', () => {
    premiumModal.classList.add('hidden');
  });

  activateBtn.addEventListener('click', async () => {
    const code = premiumCodeInput.value.trim();
    if (!code) {
      premiumMessage.textContent = 'Введите код.';
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === PREMIUM_HASH) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 дней
      localStorage.setItem('premium_expiry', expiry.toString());
      premiumMessage.textContent = '✅ Премиум активирован на 30 дней!';
      setTimeout(() => {
        premiumModal.classList.add('hidden');
        renderTopics();
      }, 1000);
    } else {
      premiumMessage.textContent = '❌ Неверный код. Попробуйте снова.';
    }
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
      const wordId = word.es; // используем испанское слово как уникальный идентификатор
      const record = srsData[wordId] || {
        dueDate: Date.now(),
        interval: 0,
        easeFactor: 2.5
      };
      if (Date.now() >= record.dueDate) {
        due.push({ ...word, id: wordId, ...record });
      }
    }

    // Если ни одно слово не созрело, повторяем все (например, после сброса)
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
});
