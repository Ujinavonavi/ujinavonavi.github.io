
const dialogues = {
  a1: [
    "Ce produit est trop cher.",
    "Vous pourriez me rembourser ?",
    "Il est en promotion aujourd’hui."
  ],
  b1: [
    "Tu as vu cette promotion ?",
    "Oui, je compare les prix avant d’acheter.",
    "Je vais commander en ligne."
  ],
  b5_1: ["fidélité"],
  b5_2: ["livraison"],
  b5_3: ["écologique"],
  b5_4: ["remboursement"]
};

function normalize(str){
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .normalize("NFC");
}

let currentChip = null;
function clearActiveChip(){
  if(currentChip){
    currentChip.classList.remove('active');
    currentChip = null;
  }
}

function speakSequence(items, buttons = []){
  if(!('speechSynthesis' in window)) {
    alert('У цьому браузері немає підтримки озвучення.');
    return;
  }
  window.speechSynthesis.cancel();
  clearActiveChip();
  let index = 0;

  function speakNext(){
    if(index >= items.length){
      clearActiveChip();
      return;
    }
    const utter = new SpeechSynthesisUtterance(items[index]);
    utter.lang = 'fr-FR';
    utter.rate = 0.92;
    utter.pitch = 1;
    if(buttons[index]){
      clearActiveChip();
      currentChip = buttons[index];
      currentChip.classList.add('active');
    }
    utter.onend = () => {
      if(buttons[index]){
        buttons[index].classList.remove('active');
      }
      index += 1;
      setTimeout(speakNext, 220);
    };
    speechSynthesis.speak(utter);
  }

  speakNext();
}

document.querySelectorAll('.chip-speak').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.chip-speak.show-translation').forEach(other => {
      if(other !== btn) other.classList.remove('show-translation');
    });
    const ua = btn.dataset.ua || '';
    const en = btn.dataset.en || '';
    const box = btn.querySelector('.chip-translation');
    if(box){
      box.innerHTML = `<strong>UA:</strong> ${ua}<br><strong>EN:</strong> ${en}`;
      btn.classList.toggle('show-translation');
    }
    speakSequence([btn.dataset.text || btn.textContent.trim()], [btn]);
    e.stopPropagation();
  });
});

document.addEventListener('click', (e) => {
  if(!e.target.closest('.chip-speak')){
    document.querySelectorAll('.chip-speak.show-translation').forEach(el => el.classList.remove('show-translation'));
  }
});

document.querySelectorAll('.speak-all').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const chips = Array.from(target.querySelectorAll('.chip-speak'));
    const texts = chips.map(ch => ch.dataset.text || ch.textContent.trim());
    speakSequence(texts, chips);
  });
});

document.querySelectorAll('.play-dialogue').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.dialogue;
    if(dialogues[key]) speakSequence(dialogues[key]);
  });
});

document.querySelectorAll('.stop-audio').forEach(btn => {
  btn.addEventListener('click', () => {
    if('speechSynthesis' in window) speechSynthesis.cancel();
    clearActiveChip();
  });
});

const exercises = document.querySelectorAll('.exercise');
const doneSet = new Set();

function updateTotals(){
  let total = 0;
  let max = 0;
  let count = 0;
  exercises.forEach((ex) => {
    const points = Number(ex.dataset.points || 0);
    if(points > 0) count += 1;
    max += points;
    total += Number(ex.dataset.score || 0);
  });
  document.getElementById('exerciseCount').textContent = count;
  document.getElementById('doneCount').textContent = doneSet.size;
  document.getElementById('totalScore').textContent = total;
  document.getElementById('maxScore').textContent = max;
}

function markField(el, ok){
  el.classList.remove('correct-field', 'wrong-field');
  el.classList.add(ok ? 'correct-field' : 'wrong-field');
}

function correctLabel(radio){
  const label = radio.closest('label');
  return label ? label.textContent.trim() : '';
}

function getCorrectAnswers(ex){
  const answers = [];
  ex.querySelectorAll('select[data-answer], input[type="text"][data-answer]').forEach(field => {
    const prompt = field.closest('.q')?.querySelector('label')?.textContent?.trim() || 'Відповідь';
    answers.push(`${prompt} → ${field.dataset.answer}`);
  });

  const radioGroups = new Set();
  ex.querySelectorAll('input[type="radio"]').forEach(r => radioGroups.add(r.name));
  Array.from(radioGroups).forEach(name => {
    const correct = Array.from(ex.querySelectorAll(`input[name="${name}"]`)).find(r => r.value === 'correct');
    if(correct) answers.push(correctLabel(correct));
  });

  ex.querySelectorAll('input[type="checkbox"]').forEach(ch => {
    if(ch.dataset.answer === 'true'){
      answers.push(ch.closest('label')?.textContent?.trim() || '✔');
    }
  });

  return answers;
}

exercises.forEach((ex, idx) => {
  const btn = ex.querySelector('.check-btn');
  if(!btn) return;
  const feedback = ex.querySelector('.feedback');

  btn.addEventListener('click', () => {
    let score = 0;
    const possible = Number(ex.dataset.points || 0);

    ex.querySelectorAll('select[data-answer]').forEach(field => {
      const ok = normalize(field.value) === normalize(field.dataset.answer);
      if(ok) score += 1;
      markField(field, ok);
    });

    ex.querySelectorAll('input[type="text"][data-answer]').forEach(field => {
      const ok = normalize(field.value) === normalize(field.dataset.answer);
      if(ok) score += 1;
      markField(field, ok);
    });

    const radioGroups = new Set();
    ex.querySelectorAll('input[type="radio"]').forEach(r => radioGroups.add(r.name));
    radioGroups.forEach(name => {
      const radios = Array.from(ex.querySelectorAll(`input[name="${name}"]`));
      const selected = radios.find(r => r.checked);
      if(selected && selected.value === 'correct') score += 1;
      radios.forEach(r => {
        const label = r.closest('label');
        if(!label) return;
        label.classList.remove('good', 'bad');
        if(r.value === 'correct') label.classList.add('good');
        if(r.checked && r.value === 'wrong') label.classList.add('bad');
      });
    });

    const checkboxes = Array.from(ex.querySelectorAll('input[type="checkbox"]'));
    if(checkboxes.length){
      checkboxes.forEach(ch => {
        const should = ch.dataset.answer === 'true';
        const ok = ch.checked === should;
        if(ok) score += 1;
        const label = ch.closest('label');
        if(label){
          label.classList.remove('good', 'bad');
          label.classList.add(should ? 'good' : (ch.checked ? 'bad' : ''));
        }
      });
    }

    ex.dataset.score = score;
    if(possible > 0) doneSet.add(idx);

    const answers = getCorrectAnswers(ex);
    feedback.className = 'feedback show';
    feedback.innerHTML = `<div><strong>Результат:</strong> <span class="${score === possible ? 'good' : 'bad'}">${score}/${possible}</span></div>
      <div class="correct-answer"><strong>Правильні відповіді:</strong><br>${answers.join('<br>')}</div>`;
    updateTotals();
  });
});

updateTotals();


document.querySelectorAll('.lex').forEach(el => {
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    const ua = el.getAttribute('data-ua');
    const en = el.getAttribute('data-en');
    const box = document.getElementById('translation-box');
    box.innerHTML = "<b>UA:</b> " + ua + "<br><b>EN:</b> " + en;
    box.style.display = 'block';
  });
});
