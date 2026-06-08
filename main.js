const phaseIndicator = document.getElementById('phase-indicator');
const matchLog = document.getElementById('match-log');
const endTurnBtn = document.getElementById('end-turn-btn');
const impact = document.getElementById('impact-effect');
const menuArea = document.getElementById('menu-area');

const CARD_DB = {
  YIBING_WU: {
    type: 'YIBING_WU',
    name: 'Yibing Wu',
    class: 'BASELINER',
    nation: 'CHINA',
    flag: '🇨🇳',
    cost: 1,
    attack: 1,
    health: 1,
    image: 'yibing.png',
    ability: '',
    lore: 'Zwykła karta chińskiego zawodnika.'
  },
  RINKY_HIJIKATA: {
    type: 'RINKY_HIJIKATA',
    name: 'Rinky Hijikata',
    class: 'BASELINER',
    nation: 'AUSTRALIA',
    flag: '🇦🇺',
    cost: 1,
    attack: 2,
    health: 2,
    image: 'rinky.png',
    ability: '',
    lore: 'Zwykła karta australijskiego tenisisty.'
  },
  KIMMER_COPPEJANS: {
    type: 'KIMMER_COPPEJANS',
    name: 'Kimmer Coppejans',
    class: 'BASELINER',
    nation: 'BELGIUM',
    flag: '🇧🇪',
    cost: 0,
    attack: 1,
    health: 1,
    image: 'kimmer.png',
    ability: 'Za każdym razem, gdy belgijska jednostka otrzyma obrażenia lub zostanie zniszczona, wszystkie pozostałe belgijskie jednostki otrzymują +1 Attack i +1 Health.',
    lore: 'Waleczny Belg, który zyskuje siłę, gdy jego rodacy cierpią na korcie.'
  },
  ASPIRYNA: {
    type: 'ASPIRYNA',
    name: 'Aspiryna',
    class: 'Skill',
    nation: 'ITEM',
    flag: '💊',
    cost: 1,
    attack: 0,
    health: 0,
    image: 'aspirin.jpg',
    ability: 'Podwaja obecne punkty życia (Health) wybranej sojuszniczej jednostki.',
    lore: 'Szybki zastrzyk regeneracyjny.'
  },
  DAMIR_DZUMHUR: {
    type: 'DAMIR_DZUMHUR',
    name: 'Damir Džumhur',
    class: 'BASELINER',
    nation: 'BOSNIA',
    flag: '🇧🇦',
    cost: 1,
    attack: 1,
    health: 1,
    image: 'damir.png',
    ability: '',
    lore: 'Zwykła karta tenisisty z Bośni i Hercegowiny.'
  },
  GRYPA: {
    type: 'GRYPA',
    name: 'Grypa',
    class: 'Skill',
    nation: 'ITEM',
    flag: '🦠',
    cost: 1,
    attack: 0,
    health: 0,
    image: 'grypa.jpg',
    ability: 'Nałóż na jednostkę przeciwnika. Otrzymuje -1 Attack i -1 Health.',
    lore: 'Kaszlzący przeciwnik to połowa sukcesu.'
  },
  SHO_SHIMABUKURO: {
    type: 'SHO_SHIMABUKURO',
    name: 'Sho Shimabukuro',
    class: 'Debel',
    nation: 'JAPAN',
    flag: '🇯🇵',
    cost: 1,
    attack: 1,
    health: 2,
    image: 'sho.png',
    ability: '',
    lore: 'Debel — może zostać wystawiony za inną własną jednostką. Dopóki jednostka z przodu żyje, wszystkie obrażenia trafiają najpierw w nią.'
  }
};

let playerPoints = 0;
let botPoints = 0;
let currentTurn = 0;

let playerMaxMana = 0;
let playerCurrentMana = 0;
let botMaxMana = 0;
let botCurrentMana = 0;

let botHand = []; // Bot hand as an array of card objects

let isDragging = false;
let draggedCard = null;
let offsetX = 0;
let offsetY = 0;
let currentPhase = 'BOT_PLAY';

function updateScoreUI() {
  document.getElementById('score-bot').textContent = botPoints;
  document.getElementById('score-you').textContent = playerPoints;
}

function showEndGameOverlay(msg) {
  const overlay = document.getElementById('endgame-overlay');
  const overlayMsg = document.getElementById('endgame-message');
  overlayMsg.textContent = msg;
  overlay.classList.add('active');
  if(socket) socket.disconnect();
}

function updateManaUI() {
  document.getElementById('bot-mana-current').textContent = botCurrentMana;
  document.getElementById('bot-mana-max').textContent = botMaxMana;
  
  document.getElementById('player-mana-current').textContent = playerCurrentMana;
  document.getElementById('player-mana-max').textContent = playerMaxMana;
}

function logMessage(msg) {
  matchLog.style.animation = 'none';
  void matchLog.offsetWidth;
  matchLog.textContent = msg;
  matchLog.style.display = 'block';
  matchLog.style.animation = 'fadeInOut 2.5s ease-in-out forwards';
}

function drawRandomCard() {
  const keys = Object.keys(CARD_DB);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return CARD_DB[randomKey];
}

function createCard(cardData, owner) {
  const card = document.createElement('div');
  card.className = `card ${owner === 'BOT' ? 'bot-card' : 'player-card-item'}`;
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="card-cost">${cardData.cost}</div>
        <div class="card-glare"></div>
        ${cardData.class !== 'Skill' && !cardData.hideStatsOnFront ? `
        <div class="card-header">
          <h2>${cardData.name}</h2>
          <div class="nation-flag">${cardData.flag}</div>
          <div class="class-badge">${cardData.class}</div>
        </div>
        <div class="card-image-wrapper">
          <div class="player-photo" style="background-image: url('${cardData.image}');"></div>
          <div class="image-overlay-gradient"></div>
        </div>
        <div class="card-stats">
          <div class="stat attack">
            <span class="stat-icon">⚔️</span>
            <span class="stat-val atk-val">${cardData.attack}</span>
          </div>
          <div class="stat health">
            <span class="stat-icon">❤️</span>
            <span class="stat-val hp-val">${cardData.health}</span>
          </div>
        </div>
        ` : `
        <div class="card-image-wrapper" style="height: 75%; top: 10%; border-bottom: none;">
          <div class="player-photo" style="background-image: url('${cardData.image}');"></div>
          <div class="image-overlay-gradient" style="background: linear-gradient(to top, rgba(20, 20, 20, 1) 0%, transparent 40%);"></div>
        </div>
        <div class="spell-name-bottom">
          <h2>${cardData.name}</h2>
        </div>
        `}
      </div>
      <div class="card-back">
        <h3>${cardData.name}</h3>
        ${cardData.class !== 'Skill' ? `
        <div class="card-lore" style="text-align: left; margin-bottom: 10px; font-size: 11px; color: #ddd;">
           <strong>Kraj:</strong> ${cardData.nation === 'BOSNIA' ? 'Bośnia i Hercegowina' : (cardData.nation === 'CHINA' ? 'Chiny' : (cardData.nation === 'BELGIUM' ? 'Belgia' : cardData.nation))} ${cardData.flag}
        </div>
        ` : ''}
        <div class="card-lore">"${cardData.lore}"</div>
        ${cardData.ability ? `<div class="card-ability-text">${cardData.ability}</div>` : ''}
      </div>
    </div>
  `;
  card.dataset.type = cardData.type;
  card.dataset.nation = cardData.nation;
  card.dataset.attack = cardData.attack;
  card.dataset.health = cardData.health;
  card.dataset.cost = cardData.cost;
  card.dataset.owner = owner;
  card.dataset.cardClass = cardData.class;
  card.dataset.raw = JSON.stringify(cardData);
  
  // INSPECTOR LOGIC
  card.addEventListener('mousedown', (e) => {
    dragStartX = e.clientX; dragStartY = e.clientY;
  });
  card.addEventListener('mouseup', (e) => {
    if (Math.abs(e.clientX - dragStartX) < 5 && Math.abs(e.clientY - dragStartY) < 5) {
      // It's a click, not a drag!
      inspectCard(card);
    }
  });
  
  return card;
}

let inspectedCardOriginalParent = null;
let inspectedCardOriginalNextSibling = null;
let inspectedCardOriginalStyles = {};
let inspectedCardWasOnBoard = false;

function inspectCard(cardEl) {
  const overlay = document.getElementById('card-inspector-overlay');
  
  inspectedCardOriginalParent = cardEl.parentNode;
  inspectedCardOriginalNextSibling = cardEl.nextSibling;
  inspectedCardWasOnBoard = cardEl.classList.contains('on-board');
  
  inspectedCardOriginalStyles.position = cardEl.style.position;
  inspectedCardOriginalStyles.transform = cardEl.style.transform;
  inspectedCardOriginalStyles.left = cardEl.style.left;
  inspectedCardOriginalStyles.top = cardEl.style.top;
  inspectedCardOriginalStyles.margin = cardEl.style.margin;
  inspectedCardOriginalStyles.zIndex = cardEl.style.zIndex;
  inspectedCardOriginalStyles.transition = cardEl.style.transition;
  
  // Zdobądź obecne rozmiary na ekranie (skalowane)
  const rect = cardEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Nieskalowane rozmiary karty to 140x200
  let fixedLeft = centerX - 70;
  let fixedTop = centerY - 100;
  
  const targetScale = 1.75;
  
  // Usuwamy klase on-board by jej !important nie nadpisało naszych wyliczonych koordynatów
  if (inspectedCardWasOnBoard) {
    cardEl.classList.remove('on-board');
  }
  
  cardEl.classList.add('card-inspected');
  overlay.appendChild(cardEl);
  overlay.classList.add('active');
  
  // Ustaw pozycję fixed w aktualnym miejscu (wymaga wyłączenia transition by nie było skoku z 0,0)
  cardEl.style.transition = 'none';
  cardEl.style.position = 'fixed';
  cardEl.style.left = fixedLeft + 'px';
  cardEl.style.top = fixedTop + 'px';
  cardEl.style.margin = '0';
  
  const initialScale = inspectedCardWasOnBoard ? 0.65 : 1;
  cardEl.style.transform = `scale(${initialScale})`;
  
  // Wymuś reflow
  void cardEl.offsetWidth;
  
  // Włącz animację i przenieś do wyliczonego, bezpiecznego miejsca z dużą skalą
  cardEl.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  cardEl.style.transform = `scale(${targetScale})`;
  
  setTimeout(() => {
    cardEl.classList.add('flipped');
  }, 150);
}

document.getElementById('card-inspector-overlay')?.addEventListener('click', function(e) {
  if(this.classList.contains('active')) {
    const cardEl = this.querySelector('.card-inspected');
    if (cardEl) {
      cardEl.classList.remove('flipped');
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        cardEl.classList.remove('card-inspected');
        if (inspectedCardWasOnBoard) {
          cardEl.classList.add('on-board');
        }
        Object.assign(cardEl.style, inspectedCardOriginalStyles);
        cardEl.style.opacity = '1';
        
        if (inspectedCardOriginalNextSibling) {
          inspectedCardOriginalParent.insertBefore(cardEl, inspectedCardOriginalNextSibling);
        } else {
          inspectedCardOriginalParent.appendChild(cardEl);
        }
      }, 300);
    }
    this.classList.remove('active');
  }
});

let socket;
let myRole = null;

window.addEventListener('load', () => {
  updateScoreUI();
  updateManaUI();
  
  initNetwork();
});

function initNetwork() {
  socket = io({
    transports: ['polling', 'websocket'],
    extraHeaders: {
      "Bypass-Tunnel-Reminder": "true"
    }
  });
  
  socket.on('connect', () => {
    console.log("Connected to server.");
    const statusEl = document.getElementById('waiting-status');
    if (statusEl) statusEl.textContent = "WAITING FOR OPPONENT...";
  });
  
  socket.on('role', (data) => {
    myRole = data.role;
    logMessage(`Connected as ${myRole}`);
    
    const pName = document.querySelector('.player-bar .hero-name');
    const bName = document.querySelector('.bot-bar .hero-name');
    if (myRole === 'P1') {
      pName.textContent = 'PLAYER 1';
      bName.textContent = 'PLAYER 2 (OPPONENT)';
    } else {
      pName.textContent = 'PLAYER 2';
      bName.textContent = 'PLAYER 1 (OPPONENT)';
    }
  });

  socket.on('gameStart', () => {
    document.getElementById('waiting-overlay').style.display = 'none';
    startGame();
  });

  socket.on('playCard', (data) => {
    handleOpponentPlay(data.play);
  });

  socket.on('startCombat', () => {
    currentPhase = 'COMBAT';
    phaseIndicator.textContent = "COMBAT PHASE!";
    resolveCombat();
  });

  socket.on('error', (data) => {
    alert(data.msg);
  });

  socket.on('opponentDisconnected', () => {
    showEndGameOverlay("Opponent Left!");
  });
}

function startGame() {
  currentTurn = 1;
  playerMaxMana = currentTurn;
  playerCurrentMana = playerMaxMana;
  botMaxMana = currentTurn;
  botCurrentMana = botMaxMana;
  updateScoreUI();
  updateManaUI();
  
  // Clean up any remaining cards
  document.querySelectorAll('.slot .card').forEach(c => c.remove());
  document.querySelectorAll('.used-cards-area .card').forEach(c => c.remove());
  document.querySelectorAll('#menu-area .card').forEach(c => c.remove());
  
  // Initial draw: 3 cards (plus 1 in startPlayerTurn makes 4)
  for(let i=0; i<3; i++) {
    const cardData = drawRandomCard();
    const newCard = createCard(cardData, 'PLAYER');
    menuArea.appendChild(newCard);
  }
  
  startPlayerTurn();
}

function handleOpponentPlay(play) {
  let lane = play.lane;
  // Odbicie lustrzane dla drugiego gracza
  lane = lane === 5 ? 5 : 5 - lane;
  
  const slot = document.querySelector(`.lane[data-lane="${lane}"] .bot-slot`);
  
  if (play.isSpell) {
    if (play.cardData.type === 'ASPIRYNA') {
      const targetCard = slot.children[play.targetIndex || 0];
      if (targetCard) {
        let curHp = parseInt(targetCard.dataset.health);
        targetCard.dataset.health = curHp * 2;
        targetCard.querySelector('.hp-val').textContent = curHp * 2;
        try { showImpact(targetCard); } catch(e){}
      }
    } else if (play.cardData.type === 'GRYPA') {
      const pSlot = document.querySelector(`.lane[data-lane="${lane}"] .player-slot`);
      const targetCard = pSlot.children[play.targetIndex || 0];
      if (targetCard) applyGrypa(targetCard);
    }
  } else {
    const oppCard = createCard(play.cardData, 'BOT');
    oppCard.classList.add('on-board');
    slot.appendChild(oppCard);
  }
  
  botCurrentMana -= play.cardData.cost;
  updateManaUI();
  updateTotalAttackUI();
  logMessage("OPPONENT PLAYED A CARD!");
}

function startPlayerTurn() {
  currentPhase = 'PLAYER_PLAY';
  phaseIndicator.textContent = `TURN ${currentTurn} - PREPARE FOR COMBAT`;
  endTurnBtn.style.display = 'block';
  logMessage("PLAY CARDS & READY UP!");
  
  // Dobieramy dokładnie 1 kartę co turę bez względu na ilość kart w ręce
  const cardData = drawRandomCard();
  const newCard = createCard(cardData, 'PLAYER');
  menuArea.appendChild(newCard);
  
  updateHandLayout();
}

function updateHandLayout() {
  // Przeniesiono ułożenie do czystego CSS (Flexbox z margin-left). 
  // Funkcja pozostaje pusta jako hook dla ewentualnych przyszłych efektów.
}

// === DRAG & DROP ===
let dragStartX = 0;
let dragStartY = 0;
let dragThresholdMet = false;

document.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || currentPhase !== 'PLAYER_PLAY') return;
  
  const cardEl = e.target.closest('.card');
  if (!cardEl || cardEl.dataset.owner !== 'PLAYER' || cardEl.classList.contains('on-board') || cardEl.closest('#used-cards-area')) return;
  
  // Sprawdzenie Many Przed Podniesieniem
  const cost = parseInt(cardEl.dataset.cost);
  if (playerCurrentMana < cost) {
    logMessage("NOT ENOUGH MANA!");
    return;
  }
  
  e.preventDefault();
  isDragging = true;
  dragThresholdMet = false;
  draggedCard = cardEl;
  
  // Calculate offset relative to card center
  const rect = draggedCard.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging || !draggedCard) return;
  
  if (!dragThresholdMet) {
    if (Math.abs(e.clientX - dragStartX) < 5 && Math.abs(e.clientY - dragStartY) < 5) {
      return; // Czekamy na przekroczenie progu
    }
    dragThresholdMet = true;
    draggedCard.classList.add('dragging');
    draggedCard.style.zIndex = 1000;
    
    if (draggedCard.parentNode !== document.body) {
      draggedCard.style.position = 'absolute';
      draggedCard.style.margin = '0';
      draggedCard.style.left = (e.clientX - offsetX) + 'px';
      draggedCard.style.top = (e.clientY - offsetY) + 'px';
      document.body.appendChild(draggedCard);
    }
    draggedCard.style.cursor = 'grabbing';
  }
  
  draggedCard.style.left = (e.clientX - offsetX) + 'px';
  draggedCard.style.top = (e.clientY - offsetY) + 'px';
  
  document.querySelectorAll('.player-slot, .bot-slot').forEach(slot => slot.classList.remove('drag-over'));
  
  const cardRect = draggedCard.getBoundingClientRect();
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;
  
  const isAspirin = draggedCard.dataset.type === 'ASPIRYNA';
  const isGrypa = draggedCard.dataset.type === 'GRYPA';
  const isSpell = isAspirin || isGrypa;
  const isDebel = draggedCard.dataset.type === 'SHO_SHIMABUKURO';
  
  document.querySelectorAll('.player-slot, .bot-slot').forEach(slot => {
    slot.classList.remove('drag-over');
    if (isSpell && slot.children.length > 0) {
      slot.children[0].classList.remove('drag-over-spell');
    }
  });
  
  const slotsToTarget = isGrypa ? document.querySelectorAll('.bot-slot') : document.querySelectorAll('.player-slot');
  
  slotsToTarget.forEach(slot => {
    const rect = slot.getBoundingClientRect();
    if (
      cardCenterX > rect.left && cardCenterX < rect.right &&
      cardCenterY > rect.top && cardCenterY < rect.bottom
    ) {
      if (isSpell) {
        if (slot.children.length > 0) {
          slot.children[0].classList.add('drag-over-spell');
        }
      } else {
        if (isDebel) {
          if (slot.children.length < 2) slot.classList.add('drag-over');
        } else {
          if (slot.children.length === 0) slot.classList.add('drag-over');
        }
      }
    }
  });
});

document.addEventListener('mouseup', () => {
  if (!isDragging || !draggedCard) return;
  isDragging = false;
  
  if (!dragThresholdMet) {
    // To było tylko kliknięcie. Usuwamy flagi i ignorujemy logikę upuszczania.
    draggedCard = null;
    return;
  }
  
  draggedCard.classList.remove('dragging');
  draggedCard.style.cursor = 'grab';
  draggedCard.style.transition = 'transform 0.2s';
  
  const cardRect = draggedCard.getBoundingClientRect();
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;
  
  let snapped = false;
  const isAspirin = draggedCard.dataset.type === 'ASPIRYNA';
  const isGrypa = draggedCard.dataset.type === 'GRYPA';
  const isSpell = isAspirin || isGrypa;
  const isDebel = draggedCard.dataset.type === 'SHO_SHIMABUKURO';
  
  document.querySelectorAll('.player-slot, .bot-slot').forEach(slot => {
    slot.classList.remove('drag-over');
    if (slot.children.length > 0) slot.children[0].classList.remove('drag-over-spell');
  });
  
  const slotsToTarget = isGrypa ? document.querySelectorAll('.bot-slot') : document.querySelectorAll('.player-slot');
  
  slotsToTarget.forEach(slot => {
    const rect = slot.getBoundingClientRect();
    if (
      cardCenterX > rect.left && cardCenterX < rect.right &&
      cardCenterY > rect.top && cardCenterY < rect.bottom
    ) {
      if (slot.parentNode.dataset.lane === "5" && !isDebel && !isSpell) {
        logMessage("GOLDEN COURT - ONLY DOUBLE CARDS ALLOWED!");
        return; // Zablokuj kładzenie zwykłych kart (ale pozwól na czary i deble)
      }
      
      const cost = parseInt(draggedCard.dataset.cost);
      if (playerCurrentMana < cost) {
         logMessage("NOT ENOUGH MANA!");
         return;
      }
      
      if (isSpell) {
        if (slot.children.length > 0) {
          if (slot.children.length === 2 && slot.parentNode.dataset.lane === "5") {
             // DEBEL NA ZŁOTYM TORZE - Otwórz modal z wyborem celu
             showTargetSelectionOverlay(slot, draggedCard, cost, isAspirin, isGrypa, parseInt(slot.parentNode.dataset.lane));
             snapped = true;
          } else {
             // Zwykły tor lub 1 karta na złotym - od razu nałóż efekt
             applySpell(slot.children[0], draggedCard, cost, isAspirin, isGrypa, parseInt(slot.parentNode.dataset.lane), 0);
             snapped = true;
          }
        }

      } else {
        const canPlace = isDebel ? slot.children.length < 2 : slot.children.length === 0;
        if (canPlace) {
          playerCurrentMana -= cost;
          updateManaUI();
          
          slot.appendChild(draggedCard);
          draggedCard.classList.add('on-board');
          
          draggedCard.style.removeProperty('--fan-x');
          draggedCard.style.removeProperty('--fan-y');
          draggedCard.style.removeProperty('--fan-r');
          draggedCard.style.removeProperty('--fan-z');
          
          socket.emit('playCard', {
            play: { cardData: JSON.parse(draggedCard.dataset.raw), lane: parseInt(slot.parentNode.dataset.lane), isSpell: false }
          });
          
          snapped = true;
        }
      }
    }
  });
  
  if (!snapped) {
    // Return to hand
    draggedCard.style.left = '';
    draggedCard.style.top = '';
    draggedCard.style.position = '';
    draggedCard.style.margin = '';
    menuArea.appendChild(draggedCard);
  }
  
// Zaktualizuj wachlarz kart niezależnie od tego czy puściliśmy czy zrzuciliśmy
  updateHandLayout();
  updateTotalAttackUI();
  
  draggedCard = null;
});

function applySpell(targetCard, spellCard, cost, isAspirin, isGrypa, lane, targetIndex) {
  playerCurrentMana -= cost;
  updateManaUI();

  if (isAspirin) {
     let curHp = parseInt(targetCard.dataset.health);
     targetCard.dataset.health = curHp * 2;
     targetCard.querySelector('.hp-val').textContent = curHp * 2;
     logMessage("ASPIRYNA USED!");
     try { showImpact(targetCard); } catch(e){}
  } else if (isGrypa) {
     applyGrypa(targetCard);
  }

  spellCard.classList.remove('on-board');
  spellCard.style.transform = 'scale(0.4)';
  spellCard.style.position = 'absolute';
  spellCard.style.left = '';
  spellCard.style.top = '';
  spellCard.style.margin = '';
  document.getElementById('used-cards-area').appendChild(spellCard);

  socket.emit('playCard', {
    play: { cardData: JSON.parse(spellCard.dataset.raw), lane: lane, isSpell: true, targetIndex: targetIndex }
  });
}

function showTargetSelectionOverlay(slot, spellCard, cost, isAspirin, isGrypa, lane) {
  const overlay = document.getElementById('target-selection-overlay');
  const btnsContainer = document.getElementById('target-buttons-container');
  btnsContainer.innerHTML = '';
  
  Array.from(slot.children).forEach((childCard, idx) => {
    const rawData = JSON.parse(childCard.dataset.raw);
    const btn = document.createElement('button');
    btn.textContent = rawData.name || "Target " + (idx+1);
    btn.onclick = () => {
      overlay.classList.remove('active');
      applySpell(childCard, spellCard, cost, isAspirin, isGrypa, lane, idx);
      updateHandLayout();
    };
    btnsContainer.appendChild(btn);
  });
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.background = "#555";
  cancelBtn.onclick = () => {
    overlay.classList.remove('active');
    spellCard.style.left = '';
    spellCard.style.top = '';
    spellCard.style.position = '';
    spellCard.style.margin = '';
    document.getElementById('menu-area').appendChild(spellCard);
    updateHandLayout();
  };
  btnsContainer.appendChild(cancelBtn);
  
  overlay.classList.add('active');
}

// === COMBAT PHASE ===
endTurnBtn.addEventListener('click', () => {
  endTurnBtn.style.display = 'none';
  phaseIndicator.textContent = "WAITING FOR OPPONENT...";
  socket.emit('readyForCombat');
});

async function resolveCombat() {
  console.log("Combat Start");
  const lanes = [1, 2, 3, 4, 5];
  
  for (let laneIdx of lanes) {
    if (playerPoints >= 11 || botPoints >= 11) break;
    
    const laneEl = document.querySelector(`.lane[data-lane="${laneIdx}"]`);
    const botSlot = laneEl.querySelector('.bot-slot');
    const playerSlot = laneEl.querySelector('.player-slot');
    
    const botCard = botSlot.children[0];
    const pCard = playerSlot.children[0];
    
    if (!botCard && !pCard) continue; 
    
    laneEl.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
    
    try {
      await sleep(500);
      
      if (botCard && pCard) {
        console.log(`Bot Attack (Lane ${laneIdx})`);
        await doAttackAnim(botCard, pCard);
        
        console.log(`Player Attack (Lane ${laneIdx})`);
        await doAttackAnim(pCard, botCard);
        
        const bAtk = Array.from(botSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        const pAtk = Array.from(playerSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        
        applyDamageToCard(botCard, pAtk);
        applyDamageToCard(pCard, bAtk);
        console.log("Damage Applied");
        
      } else if (botCard && !pCard) {
        console.log(`Bot Attack (Lane ${laneIdx} -> Face)`);
        await doAttackAnim(botCard, document.getElementById('player-hero'));
        const bAtk = Array.from(botSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        botPoints += bAtk;
        triggerScreenShake();
        try { showImpact(document.getElementById('player-hero')); } catch(e) {}
        updateScoreUI();
        if (botPoints >= 11) {
            laneEl.style.backgroundColor = 'transparent';
            break;
        }
        
      } else if (pCard && !botCard) {
        console.log(`Player Attack (Lane ${laneIdx} -> Face)`);
        await doAttackAnim(pCard, document.getElementById('bot-hero'));
        const pAtk = Array.from(playerSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        playerPoints += pAtk;
        triggerScreenShake();
        try { showImpact(document.getElementById('bot-hero')); } catch(e) {}
        updateScoreUI();
        if (playerPoints >= 11) {
            laneEl.style.backgroundColor = 'transparent';
            break;
        }
      }
    } catch (e) {
      console.error("Combat Animation Error", e);
      if (botCard && pCard) {
        const bAtk = Array.from(botSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        const pAtk = Array.from(playerSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        applyDamageToCard(botCard, pAtk);
        applyDamageToCard(pCard, bAtk);
      } else if (botCard && !pCard) {
        const bAtk = Array.from(botSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        botPoints += bAtk;
        updateScoreUI();
        if (botPoints >= 11) break;
      } else if (pCard && !botCard) {
        const pAtk = Array.from(playerSlot.children).reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        playerPoints += pAtk;
        updateScoreUI();
        if (playerPoints >= 11) break;
      }
    }
    
    laneEl.style.backgroundColor = 'transparent';
    try { await sleep(400); } catch(e) {}
  }
  
  console.log("Combat End");
  
  if (playerPoints >= 11 || botPoints >= 11) {
    phaseIndicator.textContent = "MATCH OVER!";
    showEndGameOverlay(playerPoints >= 11 ? "YOU WIN THE MATCH!" : "OPPONENT WINS!");
  } else {
    phaseIndicator.textContent = "NEXT TURN...";
    setTimeout(() => {
      currentTurn++;
      playerMaxMana = Math.min(10, currentTurn);
      playerCurrentMana = playerMaxMana;
      botMaxMana = Math.min(10, currentTurn);
      botCurrentMana = botMaxMana;
      updateManaUI();
      startPlayerTurn();
    }, 1500);
  }
}

function applyDamageToCard(cardEl, dmg, sourceType = 'COMBAT') {
  let hp = parseInt(cardEl.dataset.health);
  hp -= dmg;
  cardEl.dataset.health = hp;
  cardEl.querySelector('.hp-val').textContent = hp;
  
  // KIMMER COPPEJANS PASSIVE ABILITY
  // Zdolność odpala się na każdy DMG w belga (niezależnie czy przeżył czy zginął)
  if (sourceType === 'COMBAT' && cardEl.dataset.nation === 'BELGIUM') {
    const kimmers = document.querySelectorAll('.card.on-board[data-type="KIMMER_COPPEJANS"]');
    if (kimmers.length > 0) {
      for (let kimmer of kimmers) {
        // Pomijamy zaatakowaną jednostkę i sprawdzamy WŁAŚCICIELA!
        if (kimmer !== cardEl && kimmer.dataset.owner === cardEl.dataset.owner) {
          let kAtk = parseInt(kimmer.dataset.attack) + 1;
          let kHp = parseInt(kimmer.dataset.health) + 1;
          kimmer.dataset.attack = kAtk;
          kimmer.dataset.health = kHp;
          kimmer.querySelector('.atk-val').textContent = kAtk;
          kimmer.querySelector('.hp-val').textContent = kHp;
          
          kimmer.style.boxShadow = "0 0 30px #FFD700";
          setTimeout(() => { kimmer.style.boxShadow = "0 15px 35px rgba(0,0,0,0.7), 0 0 10px rgba(0, 0, 0, 0.5)"; }, 500);
        }
      }
    }
  }

  if (hp <= 0) {
    setTimeout(() => {
      const graveyard = document.getElementById('used-cards-area');
      if(graveyard && cardEl.parentNode) {
        graveyard.appendChild(cardEl);
        cardEl.classList.remove('on-board');
        cardEl.style.transform = 'scale(0.4)';
        cardEl.style.position = 'absolute';
        cardEl.style.left = '';
        cardEl.style.top = '';
        cardEl.style.margin = '';
      } else {
        cardEl.remove();
      }
      updateTotalAttackUI();
    }, 200);
  } else {
    cardEl.querySelector('.hp-val').textContent = hp;
  }
}

function doAttackAnim(attacker, target) {
  return new Promise(resolve => {
    try {
      attacker.style.transition = 'transform 0.15s ease-in';
      const aRect = attacker.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      
      const moveY = tRect.top < aRect.top ? -40 : 40;
      
      attacker.style.transform = `scale(0.65) translateY(${moveY}px)`;
      
      setTimeout(() => {
        try { showImpact(target); } catch(e) {}
        attacker.style.transition = 'transform 0.3s ease-out';
        attacker.style.transform = `scale(0.65) translateY(0)`;
        setTimeout(resolve, 300);
      }, 150);
    } catch(e) {
      console.error("Anim error", e);
      resolve();
    }
  });
}

function showImpact(element) {
  if (!impact || !element) return;
  const rect = element.getBoundingClientRect();
  impact.style.left = (rect.left + rect.width/2) + 'px';
  impact.style.top = (rect.top + rect.height/2) + 'px';
  impact.style.animation = 'none';
  void impact.offsetWidth;
  impact.style.animation = 'impactHit 0.4s ease-out forwards';
}

function triggerScreenShake() {
  document.body.classList.add('shake');
  const flash = document.getElementById('flash-overlay');
  if(flash) {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 100);
  }
  setTimeout(() => document.body.classList.remove('shake'), 300);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function applyGrypa(cardEl) {
  let atk = parseInt(cardEl.dataset.attack);
  let hp = parseInt(cardEl.dataset.health);
  
  atk = Math.max(0, atk - 1);
  hp = Math.max(0, hp - 1);
  
  cardEl.dataset.attack = atk;
  cardEl.dataset.health = hp;
  cardEl.querySelector('.atk-val').textContent = atk;
  cardEl.querySelector('.hp-val').textContent = hp;
  
  logMessage("GRYPA APPLIED!");
  try { showImpact(cardEl); } catch(e){}
  
  if (hp === 0) {
    applyDamageToCard(cardEl, 0, 'EFFECT'); // Triggers death animation and graveyard logic without triggering Kimmer
  } else {
    if (!cardEl.querySelector('.grypa-status')) {
      const statusIcon = document.createElement('div');
      statusIcon.className = 'grypa-status';
      statusIcon.textContent = '🤧';
      cardEl.appendChild(statusIcon);
    }
  }
}

function updateTotalAttackUI() {
  document.querySelectorAll('.player-slot, .bot-slot').forEach(slot => {
    let oldBadge = slot.querySelector('.total-attack-badge');
    if (oldBadge) oldBadge.remove();
    
    if (slot.children.length > 1) {
      let totalAtk = Array.from(slot.children)
        .filter(c => c.classList.contains('card'))
        .reduce((sum, c) => sum + (parseInt(c.dataset.attack) || 0), 0);
        
      if (totalAtk > 0) {
        let badge = document.createElement('div');
        badge.className = 'total-attack-badge';
        badge.textContent = `Total Attack: ${totalAtk}`;
        slot.appendChild(badge);
      }
    }
  });
}
