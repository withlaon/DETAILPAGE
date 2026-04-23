// =============================================
// 에디터 페이지 메인 로직
// =============================================

// 에디터 모드 플래그 (utils.js의 renderSectionHTML이 직접 클릭 UI 활성화)
window.DC_EDITOR = true;

let pageData = {
  id: null,
  title: '',
  category: '가방',
  sections: [],
};

let selectedSectionId = null;
let isSaved = true;
let uploadTargetSectionId = null;
let aiRegenStyle = 'standard';

const params = new URLSearchParams(location.search);

// ── 초기화 ────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const mode = params.get('mode');
  const id = params.get('id');
  const autoDownload = params.get('download');

  if (mode === 'new') {
    const saved = sessionStorage.getItem('dc_new_page');
    if (saved) {
      const np = JSON.parse(saved);
      pageData.title = np.title;
      pageData.category = np.category;
      pageData.sections = np.sections;
      sessionStorage.removeItem('dc_new_page');
    } else {
      pageData.sections = deepClone(TEMPLATES[0].sections).map(s => ({ ...s, id: generateId() }));
    }
  } else if (id) {
    await loadPageFromDb(id);
    if (autoDownload === '1') {
      setTimeout(() => downloadJpeg(), 1000);
    }
  } else {
    pageData.sections = deepClone(TEMPLATES[0].sections).map(s => ({ ...s, id: generateId() }));
  }

  // UI 초기화
  document.getElementById('pageTitle').value = pageData.title;
  document.getElementById('pageCategorySelect').value = pageData.category;

  // 이벤트 바인딩
  document.getElementById('pageTitle').addEventListener('input', (e) => {
    pageData.title = e.target.value;
    markUnsaved();
  });
  document.getElementById('pageCategorySelect').addEventListener('change', (e) => {
    pageData.category = e.target.value;
    markUnsaved();
  });

  // 이미지 파일 input
  document.getElementById('imageFileInput').addEventListener('change', handleImageUpload);

  // AI 재생성 버튼
  document.querySelectorAll('.ai-regen-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ai-regen-btn').forEach(b => {
        b.classList.remove('border-indigo-500', 'bg-indigo-50');
        b.classList.add('border-slate-200');
      });
      btn.classList.add('border-indigo-500', 'bg-indigo-50');
      btn.classList.remove('border-slate-200');
      aiRegenStyle = btn.dataset.style;
    });
  });

  initSortable();
  renderAll();
  isSaved = true;
  updateSaveStatus();
});

// ── DB 로드 ───────────────────────────────────

async function loadPageFromDb(id) {
  try {
    showToast('불러오는 중...', 'info');
    const data = await fetchPageById(id);
    pageData.id = data.id;
    pageData.title = data.title;
    pageData.category = data.category;
    pageData.sections = Array.isArray(data.sections) ? data.sections : [];
  } catch (e) {
    showToast('불러오기 실패: ' + e.message, 'error');
  }
}

// ── 전체 렌더 ─────────────────────────────────

function renderAll() {
  renderSectionList();
  renderCanvas();
  updateSectionCount();
}

function updateSectionCount() {
  const cnt = pageData.sections.length;
  document.getElementById('sectionCountBadge').textContent = cnt;
  document.getElementById('sectionCountInfo').textContent = cnt + '개 섹션';
}

// ── 섹션 목록 (왼쪽 패널) ────────────────────

function renderSectionList() {
  const list = document.getElementById('sectionList');
  const typeIcons = {
    hero:        `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 0l7 9 7-9M3 15h18"/></svg>`,
    promo:       `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>`,
    image:       `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    grid2:       `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/></svg>`,
    grid3:       `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="5" width="6" height="14" rx="1" stroke-width="2"/><rect x="9" y="5" width="6" height="14" rx="1" stroke-width="2"/><rect x="16" y="5" width="6" height="14" rx="1" stroke-width="2"/></svg>`,
    coloroption: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="12" r="3" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/><circle cx="18" cy="12" r="3" stroke-width="2"/></svg>`,
    detailview:  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>`,
    modelfit:    `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    sizeinfo:    `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
    text:        `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10"/></svg>`,
    spacer:      `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>`,
  };
  const typeColors = {
    hero:'text-pink-500', promo:'text-orange-500', image:'text-indigo-500',
    grid2:'text-purple-500', grid3:'text-violet-500',
    coloroption:'text-fuchsia-500', detailview:'text-violet-600',
    modelfit:'text-violet-500', sizeinfo:'text-indigo-600',
    text:'text-emerald-500', spacer:'text-amber-500'
  };
  const typeLabels = {
    hero:'히어로', promo:'홍보문구', image:'이미지',
    grid2:'2단 그리드', grid3:'3단 그리드',
    coloroption:'컬러 옵션', detailview:'디테일 컷',
    modelfit:'모델 핏', sizeinfo:'사이즈 정보',
    text:'텍스트', spacer:'여백'
  };

  list.innerHTML = pageData.sections.map((sec, idx) => {
    const isActive = sec.id === selectedSectionId;
    const label = sec.label || sec.label1 || sec.text?.substring(0, 12) || typeLabels[sec.type];
    return `
    <div class="section-item ${isActive ? 'active' : ''}" data-id="${sec.id}" onclick="selectSection('${sec.id}')">
      <span class="drag-handle mr-1.5 cursor-grab" title="드래그하여 순서 변경">
        <svg class="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a1 1 0 011 1v1h4V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm0 4H4v10h12V6H7z"/>
        </svg>
      </span>
      <span class="${typeColors[sec.type] || 'text-slate-400'} shrink-0">${typeIcons[sec.type] || ''}</span>
      <span class="text-xs text-slate-700 flex-1 truncate ml-1.5">${label}</span>
      <button onclick="event.stopPropagation();deleteSection('${sec.id}')"
        class="shrink-0 p-1 rounded text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-colors">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>`;
  }).join('');
}

// ── 캔버스 렌더 (가운데 패널) ─────────────────

function renderCanvas() {
  const canvas = document.getElementById('pageCanvas');
  canvas.innerHTML = pageData.sections.map((sec, idx) => {
    const isSelected = sec.id === selectedSectionId;
    const inner = renderSectionHTML(sec);
    const total = pageData.sections.length;
    return `
    <div class="section-overlay ${isSelected ? 'selected' : ''}" data-id="${sec.id}"
         onclick="selectSectionFromCanvas('${sec.id}')">
      ${inner}
      <div class="sec-controls">
        ${idx > 0 ? `<button class="sec-btn bg-white shadow text-slate-600 hover:bg-slate-50" onclick="event.stopPropagation();moveSectionUp('${sec.id}')" title="위로 이동">↑</button>` : ''}
        ${idx < total-1 ? `<button class="sec-btn bg-white shadow text-slate-600 hover:bg-slate-50" onclick="event.stopPropagation();moveSectionDown('${sec.id}')" title="아래로 이동">↓</button>` : ''}
        <button class="sec-btn bg-white shadow text-slate-600 hover:bg-slate-50" onclick="event.stopPropagation();duplicateSection('${sec.id}')" title="복제">⧉</button>
        <button class="sec-btn bg-rose-50 shadow text-rose-500 hover:bg-rose-100" onclick="event.stopPropagation();deleteSection('${sec.id}')" title="삭제">✕</button>
      </div>
      ${sec.type !== 'text' && sec.type !== 'spacer' ? `
      <div style="position:absolute;bottom:6px;left:6px;z-index:15;pointer-events:none;">
        <span style="background:rgba(0,0,0,0.55);color:#fff;font-size:10px;padding:2px 7px;
          border-radius:4px;font-family:'Noto Sans KR',sans-serif;">
          ${{grid2:'2단 그리드',grid3:'3단 그리드',coloroption:'컬러옵션',detailview:'디테일컷',hero:'히어로',modelfit:'모델핏',sizeinfo:'사이즈정보'}[sec.type] || (sec.label || sec.type)}
        </span>
      </div>` : ''}
    </div>`;
  }).join('');
}

// ── 섹션 선택 ─────────────────────────────────

function selectSection(id) {
  selectedSectionId = id;
  renderSectionList();
  // 캔버스 오버레이만 업데이트 (전체 재렌더 방지)
  document.querySelectorAll('#pageCanvas .section-overlay').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });
  renderPropPanel();
  // 스크롤로 이동
  const el = document.querySelector(`#pageCanvas [data-id="${id}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectSectionFromCanvas(id) {
  selectSection(id);
}

// ── 속성 패널 ─────────────────────────────────

function renderPropPanel() {
  const sec = pageData.sections.find(s => s.id === selectedSectionId);
  const empty = document.getElementById('propEmpty');
  const panel = document.getElementById('propPanel');

  if (!sec) {
    empty.classList.remove('hidden');
    panel.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  panel.classList.remove('hidden');

  if      (sec.type === 'hero')        renderHeroProps(sec);
  else if (sec.type === 'promo')       renderPromoProps(sec);
  else if (sec.type === 'image')       renderImageProps(sec);
  else if (sec.type === 'grid2')       renderGrid2Props(sec);
  else if (sec.type === 'grid3')       renderGrid3Props(sec);
  else if (sec.type === 'coloroption') renderColorOptionProps(sec);
  else if (sec.type === 'detailview')  renderDetailViewProps(sec);
  else if (sec.type === 'modelfit')    renderModelFitProps(sec);
  else if (sec.type === 'sizeinfo')    renderSizeInfoProps(sec);
  else if (sec.type === 'text')        renderTextProps(sec);
  else if (sec.type === 'spacer')      renderSpacerProps(sec);
}

function renderHeroProps(sec) {
  const panel = document.getElementById('propPanel');
  panel.innerHTML = `
    <div class="px-4 py-3 bg-pink-50 border-b border-pink-100">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-pink-500 rounded flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/>
          </svg>
        </div>
        <span class="text-sm font-bold text-pink-800">히어로 섹션 (3:4 대표컷)</span>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">이미지 업로드</label>
      ${sec.imageUrl ? `<img src="${sec.imageUrl}" class="w-full rounded-lg mb-2 object-cover max-h-32">` : ''}
      <div class="upload-zone" onclick="triggerImageUpload('${sec.id}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="handleDrop(event,'${sec.id}')">
        <p class="text-xs text-indigo-600 font-medium">클릭 또는 드래그하여 업로드 (3:4 비율 권장)</p>
      </div>
      <input type="text" class="prop-input mt-2" placeholder="이미지 URL 직접 입력" value="${sec.imageUrl||''}"
        onchange="updateSectionAndRender('${sec.id}','imageUrl',this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">하단 텍스트 — 메인 (한글)</label>
      <input type="text" class="prop-input" placeholder="일상에 특별함을 더하다" value="${sec.subText||''}"
        oninput="updateSectionAndRender('${sec.id}','subText',this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">브랜드명 — 필기체(Great Vibes) 고정</label>
      <input type="text" class="prop-input" placeholder="Withlaon" value="${sec.brandText!==undefined?sec.brandText:'Withlaon'}"
        oninput="updateSectionAndRender('${sec.id}','brandText',this.value)">
      <p class="text-xs text-slate-400 mt-1" style="font-family:'Great Vibes',cursive;font-size:16px;color:#555;padding:4px 0;">
        미리보기: ${sec.brandText||'Withlaon'}
      </p>
    </div>

    <div class="prop-section">
      <label class="prop-label">텍스트 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.textColor||'#333333'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','textColor',this.value)">
        <input type="text" class="prop-input" value="${sec.textColor||'#333333'}"
          onchange="updateSectionAndRender('${sec.id}','textColor',this.value)">
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">그라데이션 시작점: <span id="gsVal">${sec.gradStop!==undefined?sec.gradStop:42}</span>%</label>
      <input type="range" min="10" max="80" value="${sec.gradStop!==undefined?sec.gradStop:42}"
        oninput="document.getElementById('gsVal').textContent=this.value; updateSectionAndRender('${sec.id}','gradStop',parseInt(this.value))">
      <p class="text-xs text-slate-400 mt-1">숫자가 클수록 그라데이션 영역이 넓어집니다</p>
    </div>

    <div class="prop-section">
      <label class="prop-label">그라데이션 색상 (주로 흰색)</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.gradColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','gradColor',this.value)">
        <input type="text" class="prop-input" value="${sec.gradColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','gradColor',this.value)">
      </div>
    </div>

    <div class="prop-section grid grid-cols-2 gap-3">
      <div>
        <label class="prop-label">바깥 여백: <span id="hpadVal">${sec.padding!==undefined?sec.padding:16}</span>px</label>
        <input type="range" min="0" max="40" value="${sec.padding!==undefined?sec.padding:16}"
          oninput="document.getElementById('hpadVal').textContent=this.value; updateSectionAndRender('${sec.id}','padding',parseInt(this.value))">
      </div>
      <div>
        <label class="prop-label">모서리 둥글기: <span id="hradVal">${sec.radius!==undefined?sec.radius:10}</span>px</label>
        <input type="range" min="0" max="30" value="${sec.radius!==undefined?sec.radius:10}"
          oninput="document.getElementById('hradVal').textContent=this.value; updateSectionAndRender('${sec.id}','radius',parseInt(this.value))">
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>

    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

function renderPromoProps(sec) {
  const panel = document.getElementById('propPanel');
  panel.innerHTML = `
    <div class="px-4 py-3 bg-orange-50 border-b border-orange-100">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
        </div>
        <span class="text-sm font-bold text-orange-800">홍보 문구 섹션</span>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">홍보 문구</label>
      <textarea class="prop-input resize-none" rows="5" placeholder="홍보 문구를 입력하세요"
        oninput="updateSectionAndRender('${sec.id}','subText',this.value)">${sec.subText||''}</textarea>
    </div>

    <div class="prop-section">
      <label class="prop-label">글자 크기: <span id="sfsVal">${sec.subFontSize||16}</span>px</label>
      <input type="range" min="12" max="32" value="${sec.subFontSize||16}"
        oninput="document.getElementById('sfsVal').textContent=this.value; updateSectionAndRender('${sec.id}','subFontSize',parseInt(this.value))">
    </div>

    <div class="prop-section">
      <label class="prop-label">정렬</label>
      <div class="flex gap-2">
        <button class="toggle-btn ${(sec.textAlign||'center')==='left'?'active':''}" onclick="setPromoAlign('${sec.id}','left',this)">왼쪽</button>
        <button class="toggle-btn ${(sec.textAlign||'center')==='center'?'active':''}" onclick="setPromoAlign('${sec.id}','center',this)">가운데</button>
        <button class="toggle-btn ${(sec.textAlign||'center')==='right'?'active':''}" onclick="setPromoAlign('${sec.id}','right',this)">오른쪽</button>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">글자 색상 (진한 회색 기본)</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.subColor||'#444444'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','subColor',this.value)">
        <input type="text" class="prop-input" value="${sec.subColor||'#444444'}"
          onchange="updateSectionAndRender('${sec.id}','subColor',this.value)">
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>

    <div class="prop-section grid grid-cols-2 gap-3">
      <div>
        <label class="prop-label">상하 여백: <span id="ppvVal">${sec.paddingV||50}</span>px</label>
        <input type="range" min="10" max="100" value="${sec.paddingV||50}"
          oninput="document.getElementById('ppvVal').textContent=this.value; updateSectionAndRender('${sec.id}','paddingV',parseInt(this.value))">
      </div>
      <div>
        <label class="prop-label">좌우 여백: <span id="pphVal">${sec.paddingH||40}</span>px</label>
        <input type="range" min="0" max="100" value="${sec.paddingH||40}"
          oninput="document.getElementById('pphVal').textContent=this.value; updateSectionAndRender('${sec.id}','paddingH',parseInt(this.value))">
      </div>
    </div>

    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

function setPromoAlign(id, align, btn) {
  document.querySelectorAll('#propPanel .toggle-btn[onclick*="setPromoAlign"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateSectionAndRender(id, 'textAlign', align);
}

function renderGrid2Props(sec) {
  const panel = document.getElementById('propPanel');
  panel.innerHTML = `
    <div class="px-4 py-3 bg-purple-50 border-b border-purple-100">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/></svg>
        </div>
        <span class="text-sm font-bold text-purple-800">2단 그리드 섹션</span>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">왼쪽 이미지 이름</label>
      <input type="text" class="prop-input" value="${sec.label1 || ''}"
        onchange="updateSection('${sec.id}', 'label1', this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">왼쪽 이미지 업로드</label>
      ${sec.imageUrl1 ? `<img src="${sec.imageUrl1}" class="w-full rounded-lg mb-2 object-cover max-h-24">` : ''}
      <div class="upload-zone" onclick="triggerGrid2Upload('${sec.id}', 1)"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="handleGrid2Drop(event,'${sec.id}',1)">
        <p class="text-xs text-indigo-600 font-medium">클릭하여 왼쪽 이미지 업로드</p>
      </div>
      <input type="text" class="prop-input mt-2" placeholder="또는 URL 직접 입력" value="${sec.imageUrl1||''}"
        onchange="updateSectionAndRender('${sec.id}','imageUrl1',this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">오른쪽 이미지 이름</label>
      <input type="text" class="prop-input" value="${sec.label2 || ''}"
        onchange="updateSection('${sec.id}', 'label2', this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">오른쪽 이미지 업로드</label>
      ${sec.imageUrl2 ? `<img src="${sec.imageUrl2}" class="w-full rounded-lg mb-2 object-cover max-h-24">` : ''}
      <div class="upload-zone" onclick="triggerGrid2Upload('${sec.id}', 2)"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="handleGrid2Drop(event,'${sec.id}',2)">
        <p class="text-xs text-indigo-600 font-medium">클릭하여 오른쪽 이미지 업로드</p>
      </div>
      <input type="text" class="prop-input mt-2" placeholder="또는 URL 직접 입력" value="${sec.imageUrl2||''}"
        onchange="updateSectionAndRender('${sec.id}','imageUrl2',this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">이미지 간격: <span id="gapVal">${sec.gap !== undefined ? sec.gap : 2}</span>px</label>
      <input type="range" min="0" max="20" value="${sec.gap !== undefined ? sec.gap : 2}"
        oninput="document.getElementById('gapVal').textContent=this.value; updateSectionAndRender('${sec.id}','gap',parseInt(this.value))">
    </div>

    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor || '#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor || '#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>

    <div class="prop-section flex justify-between gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

function renderImageProps(sec) {
  const panel = document.getElementById('propPanel');
  panel.innerHTML = `
    <div class="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
        </div>
        <span class="text-sm font-bold text-indigo-800">이미지 섹션</span>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">섹션 이름</label>
      <input type="text" class="prop-input" value="${sec.label || ''}"
        onchange="updateSection('${sec.id}', 'label', this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">이미지 업로드</label>
      ${sec.imageUrl ? `<img src="${sec.imageUrl}" class="w-full rounded-lg mb-2 object-cover max-h-32">` : ''}
      <div class="upload-zone" onclick="triggerImageUpload('${sec.id}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="handleDrop(event, '${sec.id}')">
        <svg class="w-8 h-8 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        <p class="text-xs text-indigo-600 font-medium">클릭 또는 드래그하여 업로드</p>
        <p class="text-xs text-slate-400 mt-0.5">PNG, JPG, WEBP 지원</p>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">이미지 URL 직접 입력</label>
      <input type="text" class="prop-input" placeholder="https://..." value="${sec.imageUrl || ''}"
        onchange="updateSectionAndRender('${sec.id}', 'imageUrl', this.value)">
    </div>

    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor || '#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}', 'bgColor', this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor || '#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}', 'bgColor', this.value)">
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">안쪽 여백 (padding): <span id="padVal">${sec.padding || 0}</span>px</label>
      <input type="range" min="0" max="60" value="${sec.padding || 0}"
        oninput="document.getElementById('padVal').textContent=this.value; updateSectionAndRender('${sec.id}', 'padding', parseInt(this.value))">
    </div>

    <div class="prop-section flex justify-between gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

// ── 속성 패널: 3단 그리드 ──────────────────────
function renderGrid3Props(sec) {
  const panel = document.getElementById('propPanel');
  const mkUploadZone = (slot, label) => {
    const key = `imageUrl${slot}`;
    const lbl = `label${slot}`;
    return `
    <div class="prop-section border-t border-violet-100">
      <label class="prop-label">${label} 이름</label>
      <input type="text" class="prop-input" value="${sec[lbl]||''}"
        onchange="updateSection('${sec.id}','${lbl}',this.value)">
      <label class="prop-label mt-2">이미지 업로드</label>
      ${sec[key] ? `<img src="${sec[key]}" class="w-full rounded-lg mb-2 object-cover max-h-24">` : ''}
      <div class="upload-zone" onclick="triggerGenericUpload('${sec.id}','${key}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="event.preventDefault();this.classList.remove('dragover');handleCanvasDropGeneric(event,'${sec.id}','${key}')">
        <p class="text-xs text-violet-600 font-medium">클릭 또는 드래그하여 업로드</p>
      </div>
    </div>`;
  };
  panel.innerHTML = `
    <div class="px-4 py-3 bg-violet-50 border-b border-violet-100">
      <span class="text-sm font-bold text-violet-800">3단 그리드 섹션</span>
    </div>
    ${mkUploadZone(1,'이미지 1')}
    ${mkUploadZone(2,'이미지 2')}
    ${mkUploadZone(3,'이미지 3')}
    <div class="prop-section">
      <label class="prop-label">간격: <span id="g3gVal">${sec.gap||4}</span>px</label>
      <input type="range" min="0" max="30" value="${sec.gap||4}"
        oninput="document.getElementById('g3gVal').textContent=this.value;updateSectionAndRender('${sec.id}','gap',parseInt(this.value))">
    </div>
    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>
    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

// ── 속성 패널: 컬러 옵션 ───────────────────────
function renderColorOptionProps(sec) {
  const panel = document.getElementById('propPanel');
  const cols = sec.cols || 4;

  let itemRows = '';
  for (let i = 1; i <= Math.min(cols, 6); i++) {
    const key = `imageUrl${i}`;
    const nameKey = `name${i}`;
    itemRows += `
    <div class="prop-section border-t border-fuchsia-100">
      <div class="flex items-center justify-between mb-2">
        <label class="prop-label !mb-0">옵션 ${i}</label>
        <button onclick="removeColorOptionSlot('${sec.id}',${i})"
          class="text-xs text-rose-400 hover:text-rose-600 px-2 py-0.5 border border-rose-200 rounded">✕ 삭제</button>
      </div>
      ${sec[key] ? `<img src="${sec[key]}" class="w-full rounded-lg mb-2 object-cover max-h-20" style="aspect-ratio:1;object-fit:cover;">` : ''}
      <div class="upload-zone" onclick="triggerGenericUpload('${sec.id}','${key}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="event.preventDefault();this.classList.remove('dragover');handleCanvasDropGeneric(event,'${sec.id}','${key}')">
        <p class="text-xs text-fuchsia-600 font-medium">클릭 또는 드래그</p>
      </div>
      <label class="prop-label mt-2">옵션명</label>
      <input type="text" class="prop-input" placeholder="예) 블랙" value="${sec[nameKey]||''}"
        oninput="updateSectionAndRender('${sec.id}','${nameKey}',this.value)">
    </div>`;
  }

  panel.innerHTML = `
    <div class="px-4 py-3 bg-fuchsia-50 border-b border-fuchsia-100">
      <span class="text-sm font-bold text-fuchsia-800">컬러 옵션 섹션 (${cols}개)</span>
    </div>
    <div class="prop-section">
      <label class="prop-label">제목 텍스트</label>
      <input type="text" class="prop-input" value="${sec.title||'Color Options'}"
        oninput="updateSectionAndRender('${sec.id}','title',this.value)">
    </div>
    ${itemRows}
    <div class="prop-section">
      <button onclick="addColorOptionSlot('${sec.id}')" ${cols>=6?'disabled style="opacity:0.4;"':''}
        class="w-full py-2 text-sm font-semibold text-fuchsia-600 border-2 border-dashed border-fuchsia-300
          rounded-lg hover:bg-fuchsia-50 transition-colors">
        + 옵션 슬롯 추가 (최대 6개)
      </button>
    </div>
    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>
    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

// ── 속성 패널: 디테일 컷 ───────────────────────
function renderDetailViewProps(sec) {
  const panel = document.getElementById('propPanel');
  const mkUploadZone = (i) => {
    const key = `imageUrl${i}`;
    return `
    <div class="prop-section border-t border-violet-100">
      <label class="prop-label">디테일 이미지 ${i}</label>
      ${sec[key] ? `<img src="${sec[key]}" class="w-full rounded-lg mb-2 object-cover max-h-20">` : ''}
      <div class="upload-zone" onclick="triggerGenericUpload('${sec.id}','${key}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="event.preventDefault();this.classList.remove('dragover');handleCanvasDropGeneric(event,'${sec.id}','${key}')">
        <p class="text-xs text-violet-600 font-medium">클릭 또는 드래그</p>
      </div>
    </div>`;
  };
  panel.innerHTML = `
    <div class="px-4 py-3 bg-violet-50 border-b border-violet-100">
      <span class="text-sm font-bold text-violet-800">디테일 컷 섹션</span>
    </div>
    <div class="prop-section">
      <label class="prop-label">제목 텍스트</label>
      <input type="text" class="prop-input" value="${sec.title||'Detail View'}"
        oninput="updateSectionAndRender('${sec.id}','title',this.value)">
    </div>
    ${mkUploadZone(1)}${mkUploadZone(2)}
    <div class="prop-section">
      <label class="prop-label">간격: <span id="dvGapVal">${sec.gap||6}</span>px</label>
      <input type="range" min="0" max="20" value="${sec.gap||6}"
        oninput="document.getElementById('dvGapVal').textContent=this.value;updateSectionAndRender('${sec.id}','gap',parseInt(this.value))">
    </div>
    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>
    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

// ── 슬롯 동적 관리: 컬러 옵션 ─────────────────
function addColorOptionSlot(sectionId) {
  const sec = pageData.sections.find(s => s.id === sectionId);
  if (!sec || (sec.cols || 4) >= 6) return;
  sec.cols = (sec.cols || 4) + 1;
  markUnsaved(); renderCanvas(); renderPropPanel();
}
function removeColorOptionSlot(sectionId, idx) {
  const sec = pageData.sections.find(s => s.id === sectionId);
  if (!sec || (sec.cols || 4) <= 1) return;
  const cols = sec.cols || 4;
  for (let i = idx; i < cols; i++) {
    sec[`imageUrl${i}`] = sec[`imageUrl${i+1}`] || '';
    sec[`name${i}`]     = sec[`name${i+1}`]     || '';
  }
  delete sec[`imageUrl${cols}`]; delete sec[`name${cols}`];
  sec.cols = cols - 1;
  markUnsaved(); renderCanvas(); renderPropPanel();
}

// ── 슬롯 동적 관리: 모델 핏 ───────────────────
function addModelFitSlot(sectionId) {
  const sec = pageData.sections.find(s => s.id === sectionId);
  if (!sec) return;
  sec.count = (sec.count || 2) + 1;
  markUnsaved(); renderCanvas(); renderPropPanel();
}
function removeModelFitSlot(sectionId, idx) {
  const sec = pageData.sections.find(s => s.id === sectionId);
  if (!sec || (sec.count || 2) <= 1) return;
  const count = sec.count || 2;
  for (let i = idx; i < count; i++) {
    sec[`imageUrl${i}`] = sec[`imageUrl${i+1}`] || '';
  }
  delete sec[`imageUrl${count}`];
  sec.count = count - 1;
  markUnsaved(); renderCanvas(); renderPropPanel();
}

// ── 속성 패널: 모델 핏 ──────────────────────────
function renderModelFitProps(sec) {
  const panel = document.getElementById('propPanel');
  const count = sec.count || 2;
  const perRow = sec.perRow || 2;

  let slots = '';
  for (let i = 1; i <= count; i++) {
    const key = `imageUrl${i}`;
    slots += `
    <div class="prop-section border-t border-violet-100">
      <div class="flex items-center justify-between mb-2">
        <label class="prop-label !mb-0">이미지 ${i}</label>
        <button onclick="removeModelFitSlot('${sec.id}',${i})"
          class="text-xs text-rose-400 hover:text-rose-600 px-2 py-0.5 border border-rose-200 rounded">✕ 삭제</button>
      </div>
      ${sec[key] ? `<img src="${sec[key]}" class="w-full rounded-lg mb-2 object-cover max-h-20" style="aspect-ratio:3/4;object-fit:cover;">` : ''}
      <div class="upload-zone" onclick="triggerGenericUpload('${sec.id}','${key}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="event.preventDefault();this.classList.remove('dragover');handleCanvasDropGeneric(event,'${sec.id}','${key}')">
        <p class="text-xs text-violet-600 font-medium">3:4 비율 · 클릭 또는 드래그</p>
      </div>
    </div>`;
  }

  panel.innerHTML = `
    <div class="px-4 py-3 bg-violet-50 border-b border-violet-100">
      <span class="text-sm font-bold text-violet-800">모델 핏 섹션</span>
    </div>
    <div class="prop-section">
      <label class="prop-label">제목</label>
      <input type="text" class="prop-input" value="${sec.title||'Model Fit'}"
        oninput="updateSectionAndRender('${sec.id}','title',this.value)">
    </div>
    <div class="prop-section">
      <label class="prop-label">한 줄 이미지 수</label>
      <div class="flex gap-2">
        ${[1,2,3].map(n=>`<button class="flex-1 py-1.5 text-xs rounded border ${perRow===n?'border-violet-500 bg-violet-50 text-violet-700':'border-slate-200 text-slate-600'}"
          onclick="updateSectionAndRender('${sec.id}','perRow',${n});renderPropPanel()">${n}개</button>`).join('')}
      </div>
    </div>
    ${slots}
    <div class="prop-section">
      <button onclick="addModelFitSlot('${sec.id}')"
        class="w-full py-2 text-sm font-semibold text-violet-600 border-2 border-dashed border-violet-300
          rounded-lg hover:bg-violet-50 transition-colors">
        + 이미지 슬롯 추가
      </button>
    </div>
    <div class="prop-section">
      <label class="prop-label">간격: <span id="mfGapVal">${sec.gap||4}</span>px</label>
      <input type="range" min="0" max="20" value="${sec.gap||4}"
        oninput="document.getElementById('mfGapVal').textContent=this.value;updateSectionAndRender('${sec.id}','gap',parseInt(this.value))">
    </div>
    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>
    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

// ── 속성 패널: 사이즈 정보 ─────────────────────
function renderSizeInfoProps(sec) {
  const panel = document.getElementById('propPanel');
  const mkMRow = (idx, label, value) => `
    <div class="flex gap-2 mb-2">
      <input type="text" class="prop-input" style="width:40%;" placeholder="항목명" value="${label}"
        oninput="updateSectionAndRender('${sec.id}','m${idx}Label',this.value)">
      <input type="text" class="prop-input" placeholder="치수값" value="${value}"
        oninput="updateSectionAndRender('${sec.id}','m${idx}Value',this.value)">
    </div>`;

  panel.innerHTML = `
    <div class="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
      <span class="text-sm font-bold text-indigo-800">사이즈 정보 섹션</span>
    </div>
    <div class="prop-section">
      <label class="prop-label">제목</label>
      <input type="text" class="prop-input" value="${sec.title||'SIZE INFORMATION'}"
        oninput="updateSectionAndRender('${sec.id}','title',this.value)">
    </div>
    <div class="prop-section">
      <label class="prop-label">상품 이미지 (왼쪽)</label>
      ${sec.imageUrl ? `<img src="${sec.imageUrl}" class="w-full rounded-lg mb-2 object-contain max-h-32 border border-slate-100">` : ''}
      <div class="upload-zone" onclick="triggerImageUpload('${sec.id}')"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="event.preventDefault();this.classList.remove('dragover');handleDrop(event,'${sec.id}')">
        <p class="text-xs text-indigo-600 font-medium">클릭 또는 드래그하여 업로드</p>
      </div>
    </div>
    <div class="prop-section">
      <label class="prop-label">치수 정보 (항목명 / 치수값)</label>
      ${mkMRow(1, sec.m1Label||'가로',   sec.m1Value||'- cm')}
      ${mkMRow(2, sec.m2Label||'세로',   sec.m2Value||'- cm')}
      ${mkMRow(3, sec.m3Label||'높이',   sec.m3Value||'- cm')}
      ${mkMRow(4, sec.m4Label||'손잡이', sec.m4Value||'- cm')}
    </div>
    <div class="prop-section">
      <label class="prop-label">무게 (WEIGHT)</label>
      <input type="text" class="prop-input" placeholder="예) 238 g" value="${sec.weight||''}"
        oninput="updateSectionAndRender('${sec.id}','weight',this.value)">
    </div>
    <div class="prop-section">
      <label class="prop-label">소재 (MATERIAL)</label>
      <input type="text" class="prop-input" placeholder="예) 캔버스" value="${sec.material||''}"
        oninput="updateSectionAndRender('${sec.id}','material',this.value)">
    </div>
    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor||'#f0eeff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}','bgColor',this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor||'#f0eeff'}"
          onchange="updateSectionAndRender('${sec.id}','bgColor',this.value)">
      </div>
    </div>
    <div class="prop-section flex gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

function renderTextProps(sec) {
  const panel = document.getElementById('propPanel');
  const isBold = sec.fontWeight === 'bold';
  panel.innerHTML = `
    <div class="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10"/></svg>
        </div>
        <span class="text-sm font-bold text-emerald-800">텍스트 섹션</span>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">텍스트 내용</label>
      <textarea class="prop-input resize-none" rows="5" placeholder="텍스트를 입력하세요..."
        oninput="updateSectionAndRender('${sec.id}', 'text', this.value)">${sec.text || ''}</textarea>
      <p class="text-xs text-slate-400 mt-1">줄바꿈(Enter)을 사용할 수 있습니다.</p>
    </div>

    <div class="prop-section">
      <label class="prop-label">글자 크기: <span id="fsVal">${sec.fontSize || 16}</span>px</label>
      <input type="range" min="10" max="60" value="${sec.fontSize || 16}"
        oninput="document.getElementById('fsVal').textContent=this.value; updateSectionAndRender('${sec.id}', 'fontSize', parseInt(this.value))">
    </div>

    <div class="prop-section">
      <label class="prop-label">스타일</label>
      <div class="flex gap-2">
        <button class="toggle-btn ${isBold ? 'active' : ''}" onclick="toggleBold('${sec.id}', this)">B 굵게</button>
        <button class="toggle-btn ${sec.textAlign==='left' ? 'active' : ''}" onclick="setAlign('${sec.id}', 'left', this)">왼쪽</button>
        <button class="toggle-btn ${sec.textAlign==='center' || !sec.textAlign ? 'active' : ''}" onclick="setAlign('${sec.id}', 'center', this)">가운데</button>
        <button class="toggle-btn ${sec.textAlign==='right' ? 'active' : ''}" onclick="setAlign('${sec.id}', 'right', this)">오른쪽</button>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">글자 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.color || '#333333'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}', 'color', this.value)">
        <input type="text" class="prop-input" value="${sec.color || '#333333'}"
          onchange="updateSectionAndRender('${sec.id}', 'color', this.value)">
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor || '#ffffff'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}', 'bgColor', this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor || '#ffffff'}"
          onchange="updateSectionAndRender('${sec.id}', 'bgColor', this.value)">
      </div>
    </div>

    <div class="prop-section grid grid-cols-2 gap-3">
      <div>
        <label class="prop-label">상하 여백: <span id="pvVal">${sec.paddingV || 20}</span>px</label>
        <input type="range" min="0" max="100" value="${sec.paddingV || 20}"
          oninput="document.getElementById('pvVal').textContent=this.value; updateSectionAndRender('${sec.id}', 'paddingV', parseInt(this.value))">
      </div>
      <div>
        <label class="prop-label">좌우 여백: <span id="phVal">${sec.paddingH || 20}</span>px</label>
        <input type="range" min="0" max="100" value="${sec.paddingH || 20}"
          oninput="document.getElementById('phVal').textContent=this.value; updateSectionAndRender('${sec.id}', 'paddingH', parseInt(this.value))">
      </div>
    </div>

    <div class="prop-section flex justify-between gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

function renderSpacerProps(sec) {
  const panel = document.getElementById('propPanel');
  panel.innerHTML = `
    <div class="px-4 py-3 bg-amber-50 border-b border-amber-100">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>
        </div>
        <span class="text-sm font-bold text-amber-800">여백 섹션</span>
      </div>
    </div>

    <div class="prop-section">
      <label class="prop-label">높이: <span id="hVal">${sec.height || 20}</span>px</label>
      <input type="range" min="1" max="200" value="${sec.height || 20}"
        oninput="document.getElementById('hVal').textContent=this.value; updateSectionAndRender('${sec.id}', 'height', parseInt(this.value))">
    </div>

    <div class="prop-section">
      <label class="prop-label">배경 색상</label>
      <div class="flex items-center gap-2">
        <input type="color" value="${sec.bgColor || '#f5f5f5'}" class="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
          oninput="updateSectionAndRender('${sec.id}', 'bgColor', this.value)">
        <input type="text" class="prop-input" value="${sec.bgColor || '#f5f5f5'}"
          onchange="updateSectionAndRender('${sec.id}', 'bgColor', this.value)">
      </div>
    </div>

    <div class="prop-section flex justify-between gap-2">
      <button onclick="moveSectionUp('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↑ 위로</button>
      <button onclick="moveSectionDown('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">↓ 아래로</button>
      <button onclick="duplicateSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg">복제</button>
      <button onclick="deleteSection('${sec.id}')" class="flex-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg">삭제</button>
    </div>`;
}

// ── 섹션 데이터 업데이트 ──────────────────────

function updateSection(id, key, value) {
  const sec = pageData.sections.find(s => s.id === id);
  if (!sec) return;
  sec[key] = value;
  markUnsaved();
}

function updateSectionAndRender(id, key, value) {
  updateSection(id, key, value);
  // 전체 캔버스 재렌더 (컨트롤/라벨 배지 포함 일관성 유지)
  renderCanvas();
}

// ── 텍스트 스타일 토글 ────────────────────────

function toggleBold(id, btn) {
  const sec = pageData.sections.find(s => s.id === id);
  if (!sec) return;
  const newBold = sec.fontWeight !== 'bold';
  sec.fontWeight = newBold ? 'bold' : 'normal';
  btn.classList.toggle('active', newBold);
  updateSectionAndRender(id, 'fontWeight', sec.fontWeight);
}

function setAlign(id, align, btn) {
  document.querySelectorAll(`#propPanel .toggle-btn[onclick*="setAlign"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateSectionAndRender(id, 'textAlign', align);
}

// ── 섹션 추가 ─────────────────────────────────

function addSection(type) {
  let newSec;
  if (type === 'modelfit') {
    newSec = { id: generateId(), type: 'modelfit', title: 'Model Fit',
      count: 2, perRow: 2, gap: 4, bgColor: '#ffffff', paddingV: 16, paddingH: 0,
      imageUrl1: '', imageUrl2: '' };
  } else if (type === 'sizeinfo') {
    newSec = { id: generateId(), type: 'sizeinfo', title: 'SIZE INFORMATION',
      imageUrl: '', bgColor: '#f0eeff', padding: 24,
      m1Label: '가로', m1Value: '- cm', m2Label: '세로', m2Value: '- cm',
      m3Label: '높이', m3Value: '- cm', m4Label: '손잡이', m4Value: '- cm',
      weight: '- g', material: '-' };
  } else if (type === 'grid3') {
    newSec = { id: generateId(), type: 'grid3',
      imageUrl1: '', imageUrl2: '', imageUrl3: '',
      label1: '이미지 1', label2: '이미지 2', label3: '이미지 3',
      bgColor: '#ffffff', gap: 4, padding: 0 };
  } else if (type === 'coloroption') {
    newSec = { id: generateId(), type: 'coloroption',
      title: 'Color Options', cols: 4, gap: 12,
      imageUrl1:'', name1:'', imageUrl2:'', name2:'',
      imageUrl3:'', name3:'', imageUrl4:'', name4:'',
      imageUrl5:'', name5:'', imageUrl6:'', name6:'',
      bgColor: '#ffffff', paddingV: 32, paddingH: 24 };
  } else if (type === 'detailview') {
    newSec = { id: generateId(), type: 'detailview',
      title: 'Detail View', gap: 6,
      imageUrl1:'', imageUrl2:'', imageUrl3:'', imageUrl4:'',
      bgColor: '#ffffff', paddingV: 20, paddingH: 20 };
  } else if (type === 'hero') {
    newSec = { id: generateId(), type: 'hero', imageUrl: '', bgColor: '#ffffff', padding: 16, radius: 10,
      subText: '일상에 특별함을 더하다', brandText: 'Withlaon',
      textColor: '#ffffff', gradStop: 42, gradColor: 'rgba(167,139,250,0.32)', label: '대표 컷' };
  } else if (type === 'promo') {
    newSec = { id: generateId(), type: 'promo',
      mainText: '', subText: '',
      subFontSize: 16, subColor: '#444444',
      lineColor: '#cccccc', textAlign: 'center', bgColor: '#ffffff', paddingV: 50, paddingH: 40 };
  } else if (type === 'image') {
    newSec = { id: generateId(), type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '새 이미지' };
  } else if (type === 'grid2') {
    newSec = { id: generateId(), type: 'grid2', imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 2, padding: 0, label1: '왼쪽 이미지', label2: '오른쪽 이미지' };
  } else if (type === 'text') {
    newSec = { id: generateId(), type: 'text', text: '텍스트를 입력하세요', fontSize: 16, fontWeight: 'normal', color: '#333333', textAlign: 'center', bgColor: '#ffffff', paddingV: 20, paddingH: 20 };
  } else if (type === 'spacer') {
    newSec = { id: generateId(), type: 'spacer', height: 30, bgColor: '#f5f5f5' };
  }
  if (newSec) {
    // 선택된 섹션 뒤에 삽입 (없으면 끝에)
    const idx = pageData.sections.findIndex(s => s.id === selectedSectionId);
    if (idx >= 0) {
      pageData.sections.splice(idx + 1, 0, newSec);
    } else {
      pageData.sections.push(newSec);
    }
    markUnsaved();
    renderAll();
    selectSection(newSec.id);
    // 스크롤
    setTimeout(() => {
      const el = document.querySelector(`#pageCanvas [data-id="${newSec.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

// ── 섹션 이동 ─────────────────────────────────

function moveSectionUp(id) {
  const idx = pageData.sections.findIndex(s => s.id === id);
  if (idx <= 0) return;
  [pageData.sections[idx-1], pageData.sections[idx]] = [pageData.sections[idx], pageData.sections[idx-1]];
  markUnsaved();
  renderAll();
  selectSection(id);
}

function moveSectionDown(id) {
  const idx = pageData.sections.findIndex(s => s.id === id);
  if (idx < 0 || idx >= pageData.sections.length - 1) return;
  [pageData.sections[idx], pageData.sections[idx+1]] = [pageData.sections[idx+1], pageData.sections[idx]];
  markUnsaved();
  renderAll();
  selectSection(id);
}

// ── 섹션 복제 ─────────────────────────────────

function duplicateSection(id) {
  const idx = pageData.sections.findIndex(s => s.id === id);
  if (idx < 0) return;
  const clone = deepClone(pageData.sections[idx]);
  clone.id = generateId();
  pageData.sections.splice(idx + 1, 0, clone);
  markUnsaved();
  renderAll();
  selectSection(clone.id);
}

// ── 섹션 삭제 ─────────────────────────────────

function deleteSection(id) {
  if (pageData.sections.length <= 1) {
    showToast('최소 1개 섹션이 필요합니다.', 'warning');
    return;
  }
  showConfirm('이 섹션을 삭제하시겠습니까?', () => {
    pageData.sections = pageData.sections.filter(s => s.id !== id);
    if (selectedSectionId === id) selectedSectionId = null;
    markUnsaved();
    renderAll();
    renderPropPanel();
  });
}

// ── 이미지 업로드 ─────────────────────────────

function triggerImageUpload(sectionId) {
  uploadTargetSectionId = sectionId;
  document.getElementById('imageFileInput').click();
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  // generic 키 업로드 분기 (grid3 / coloroption / detailview)
  if (uploadGenericSectionId) {
    await processGenericUpload(file);
    return;
  }

  // grid2 업로드 분기
  if (uploadGrid2SectionId && !uploadTargetSectionId) {
    await processGrid2Upload(file);
    uploadGrid2SectionId = null;
    return;
  }

  if (!uploadTargetSectionId) return;

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showToast('파일 크기는 10MB 이하여야 합니다.', 'error');
    return;
  }

  showToast('이미지 업로드 중...', 'info');
  const targetId = uploadTargetSectionId; // 비동기 중 변경 방지
  uploadTargetSectionId = null;           // 재사용 방지
  try {
    let url;
    if (CONFIG.SUPABASE_ANON_KEY) {
      try {
        url = await uploadImage(file, 'sections');
      } catch (storageErr) {
        // Storage 버킷 미설정 등 실패 시 base64 폴백
        console.warn('Storage 업로드 실패, base64 임시 저장:', storageErr.message);
        url = await fileToBase64(file);
        showToast('스토리지 미설정 → 임시 로컬 저장 (저장 시 Supabase에 반영되지 않을 수 있습니다)', 'warning');
      }
    } else {
      url = await fileToBase64(file);
    }
    updateSectionAndRender(targetId, 'imageUrl', url);
    renderPropPanel();
    showToast('이미지 적용 완료!', 'success');
  } catch (err) {
    uploadTargetSectionId = targetId; // 실패 시 복원
    showToast('업로드 실패: ' + err.message, 'error');
  }
}

function handleDrop(event, sectionId) {
  event.preventDefault();
  event.currentTarget.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  uploadTargetSectionId = sectionId;
  const fakeEvent = { target: { files: [file], value: '' } };
  handleImageUpload(fakeEvent);
}

// ── 캔버스 직접 클릭 업로드 (에디터 전용) ──────

function editorUploadImage(sectionId) {
  uploadTargetSectionId  = sectionId;
  uploadGrid2SectionId   = null;
  selectSection(sectionId);
  document.getElementById('imageFileInput').click();
}

function editorUploadGrid2(sectionId, slot) {
  uploadGrid2SectionId  = sectionId;
  uploadGrid2Slot       = slot;
  uploadTargetSectionId = null;
  selectSection(sectionId);
  document.getElementById('imageFileInput').click();
}

// ── Generic 키 기반 업로드 (grid3 / coloroption / detailview) ─
let uploadGenericSectionId = null;
let uploadGenericKey       = null;

function triggerGenericUpload(sectionId, key) {
  uploadGenericSectionId = sectionId;
  uploadGenericKey       = key;
  uploadTargetSectionId  = null;
  uploadGrid2SectionId   = null;
  document.getElementById('imageFileInput').click();
}

async function processGenericUpload(file) {
  const sid = uploadGenericSectionId;
  const key = uploadGenericKey;
  uploadGenericSectionId = null;
  uploadGenericKey       = null;
  if (!sid || !key) return;
  showToast('이미지 업로드 중...', 'info');
  try {
    let url;
    if (CONFIG.SUPABASE_ANON_KEY) {
      try { url = await uploadImage(file, 'sections'); }
      catch { url = await fileToBase64(file); showToast('스토리지 미설정 → 임시 저장', 'warning'); }
    } else {
      url = await fileToBase64(file);
    }
    updateSectionAndRender(sid, key, url);
    renderPropPanel();
    showToast('이미지 적용 완료!', 'success');
  } catch (err) {
    showToast('업로드 실패: ' + err.message, 'error');
  }
}

// 캔버스 드롭 — Generic 키
async function handleCanvasDropGeneric(event, sectionId, key) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.style.outline = '';
  event.currentTarget.style.opacity = '';
  const file = Array.from(event.dataTransfer.files).find(f => f.type.startsWith('image/'));
  if (!file) { showToast('이미지 파일을 드롭해 주세요.', 'error'); return; }
  uploadGenericSectionId = sectionId;
  uploadGenericKey       = key;
  uploadTargetSectionId  = null;
  uploadGrid2SectionId   = null;
  await processGenericUpload(file);
}

// 캔버스 이미지 영역 드래그앤드롭 (slot=0: 단일 이미지, slot=1/2: grid2)
async function handleCanvasDrop(event, sectionId, slot) {
  event.preventDefault();
  event.stopPropagation();
  // 드래그 하이라이트 제거
  event.currentTarget.style.outline = '';
  event.currentTarget.style.opacity = '';
  const file = Array.from(event.dataTransfer.files).find(f => f.type.startsWith('image/'));
  if (!file) { showToast('이미지 파일을 드롭해 주세요.', 'error'); return; }
  if (slot > 0) {
    uploadGrid2SectionId = sectionId;
    uploadGrid2Slot      = slot;
    uploadTargetSectionId = null;
    await processGrid2Upload(file);
  } else {
    uploadTargetSectionId = sectionId;
    uploadGrid2SectionId  = null;
    await handleImageUpload({ target: { files: [file], value: '' } });
  }
}

function handleCanvasDragOver(event, el) {
  event.preventDefault();
  event.stopPropagation();
  el.style.outline = '3px solid #7c3aed';
  el.style.opacity = '0.85';
}

function handleCanvasDragLeave(event, el) {
  el.style.outline = '';
  el.style.opacity = '';
}

// ── grid2 이미지 업로드 ───────────────────────

let uploadGrid2SectionId = null;
let uploadGrid2Slot = 1;

function triggerGrid2Upload(sectionId, slot) {
  uploadGrid2SectionId = sectionId;
  uploadGrid2Slot = slot;
  uploadTargetSectionId = null; // 단일 이미지 업로드와 구분
  document.getElementById('imageFileInput').click();
}

function handleGrid2Drop(event, sectionId, slot) {
  event.preventDefault();
  event.currentTarget.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  uploadGrid2SectionId = sectionId;
  uploadGrid2Slot = slot;
  uploadTargetSectionId = null;
  processGrid2Upload(file);
}

async function processGrid2Upload(file) {
  if (!file) return;
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) { showToast('파일 크기는 10MB 이하여야 합니다.', 'error'); return; }
  showToast('이미지 업로드 중...', 'info');
  const sid  = uploadGrid2SectionId;
  const slot = uploadGrid2Slot;
  try {
    let url;
    if (CONFIG.SUPABASE_ANON_KEY) {
      try {
        url = await uploadImage(file, 'sections');
      } catch (storageErr) {
        console.warn('Storage 업로드 실패, base64 임시 저장:', storageErr.message);
        url = await fileToBase64(file);
        showToast('스토리지 미설정 → 임시 로컬 저장', 'warning');
      }
    } else {
      url = await fileToBase64(file);
    }
    const key = slot === 1 ? 'imageUrl1' : 'imageUrl2';
    updateSectionAndRender(sid, key, url);
    renderPropPanel();
    showToast('이미지 적용 완료!', 'success');
  } catch (err) {
    showToast('업로드 실패: ' + err.message, 'error');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── 드래그 & 드롭 정렬 ───────────────────────

function initSortable() {
  const list = document.getElementById('sectionList');
  Sortable.create(list, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-40',
    onEnd: (evt) => {
      const moved = pageData.sections.splice(evt.oldIndex, 1)[0];
      pageData.sections.splice(evt.newIndex, 0, moved);
      markUnsaved();
      renderAll();
    }
  });
}

// ── 저장 ─────────────────────────────────────

async function savePage() {
  const title = document.getElementById('pageTitle').value.trim();
  if (!title) {
    showToast('제목을 입력해주세요.', 'warning');
    document.getElementById('pageTitle').focus();
    return;
  }
  if (!CONFIG.SUPABASE_ANON_KEY) {
    showToast('Supabase 설정이 필요합니다.', 'warning');
    return;
  }

  pageData.title = title;
  pageData.category = document.getElementById('pageCategorySelect').value;

  const btn = document.querySelector('button[onclick="savePage()"]');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    // 썸네일 생성
    const canvas = document.getElementById('pageCanvas');
    const thumbBlob = await captureAsBlob(canvas);
    if (thumbBlob) {
      pageData.thumbnail_url = await uploadThumbnail(thumbBlob);
    }

    const result = await savePageDB(pageData);
    pageData.id = result.id;
    isSaved = true;
    updateSaveStatus();
    showToast('저장되었습니다!', 'success');
    // URL 업데이트
    history.replaceState(null, '', `editor.html?id=${result.id}`);
  } catch (e) {
    showToast('저장 실패: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> 저장`; }
  }
}

// db.js의 savePage와 이름 충돌 방지
async function savePageDB(data) {
  return await savePage_db(data);
}

// ── JPEG 다운로드 ─────────────────────────────

async function downloadJpeg() {
  const canvas = document.getElementById('pageCanvas');
  const title = document.getElementById('pageTitle').value.trim() || '상세페이지';
  // 선택 해제 후 다운로드
  const prevSelected = selectedSectionId;
  selectedSectionId = null;
  document.querySelectorAll('#pageCanvas .section-overlay').forEach(el => el.classList.remove('selected'));
  await downloadAsJpeg(canvas, title);
  // 복원
  selectedSectionId = prevSelected;
  if (prevSelected) {
    document.querySelectorAll(`#pageCanvas [data-id="${prevSelected}"]`).forEach(el => el.classList.add('selected'));
  }
}

// ── 저장 상태 ─────────────────────────────────

function markUnsaved() {
  isSaved = false;
  updateSaveStatus();
}

function updateSaveStatus() {
  const el = document.getElementById('saveStatusText');
  if (isSaved) {
    el.textContent = '✓ 저장됨';
    el.parentElement.classList.remove('text-amber-500');
    el.parentElement.classList.add('text-emerald-500');
  } else {
    el.textContent = '● 미저장';
    el.parentElement.classList.remove('text-emerald-500');
    el.parentElement.classList.add('text-amber-500');
  }
}

// ── AI 템플릿 재생성 ──────────────────────────

function openAIModal() {
  document.getElementById('aiModal').classList.remove('hidden');
}

function applyAITemplate() {
  const category = document.getElementById('pageCategorySelect').value;
  const aiPage = generateAITemplate(category, aiRegenStyle);
  showConfirm('현재 작업 중인 내용이 모두 교체됩니다.\n계속하시겠습니까?', () => {
    pageData.sections = aiPage.sections;
    selectedSectionId = null;
    markUnsaved();
    renderAll();
    renderPropPanel();
    document.getElementById('aiModal').classList.add('hidden');
    showToast('AI 템플릿이 적용되었습니다!', 'success');
  });
}

// ── 페이지 이탈 경고 ──────────────────────────
window.addEventListener('beforeunload', (e) => {
  if (!isSaved) {
    e.preventDefault();
    e.returnValue = '';
  }
});
