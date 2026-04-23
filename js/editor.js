// =============================================
// 에디터 페이지 메인 로직
// =============================================

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
    image: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    grid2: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/></svg>`,
    text: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10"/></svg>`,
    spacer: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>`,
  };
  const typeColors = { image: 'text-indigo-500', grid2: 'text-purple-500', text: 'text-emerald-500', spacer: 'text-amber-500' };
  const typeLabels = { image: '이미지', grid2: '2단 그리드', text: '텍스트', spacer: '여백' };

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
    return `
    <div class="section-overlay ${isSelected ? 'selected' : ''}" data-id="${sec.id}"
         onclick="selectSectionFromCanvas('${sec.id}')">
      ${inner}
      <div class="sec-controls">
        ${idx > 0 ? `<button class="sec-btn bg-white shadow text-slate-600 hover:bg-slate-50" onclick="event.stopPropagation();moveSectionUp('${sec.id}')" title="위로">↑</button>` : ''}
        ${idx < pageData.sections.length-1 ? `<button class="sec-btn bg-white shadow text-slate-600 hover:bg-slate-50" onclick="event.stopPropagation();moveSectionDown('${sec.id}')" title="아래로">↓</button>` : ''}
        <button class="sec-btn bg-white shadow text-slate-600 hover:bg-slate-50" onclick="event.stopPropagation();duplicateSection('${sec.id}')" title="복제">⧉</button>
        <button class="sec-btn bg-rose-50 shadow text-rose-500 hover:bg-rose-100" onclick="event.stopPropagation();deleteSection('${sec.id}')" title="삭제">✕</button>
      </div>
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

  if (sec.type === 'image') renderImageProps(sec);
  else if (sec.type === 'grid2') renderGrid2Props(sec);
  else if (sec.type === 'text') renderTextProps(sec);
  else if (sec.type === 'spacer') renderSpacerProps(sec);
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
  // 해당 섹션만 부분 업데이트
  const overlayEl = document.querySelector(`#pageCanvas [data-id="${id}"]`);
  if (overlayEl) {
    const sec = pageData.sections.find(s => s.id === id);
    const controls = overlayEl.querySelector('.sec-controls');
    const controlsHTML = controls ? controls.outerHTML : '';
    overlayEl.innerHTML = renderSectionHTML(sec) + controlsHTML;
    if (!controls && overlayEl.classList.contains('selected')) {
      // controls 재추가
      renderCanvas();
    }
  }
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
  if (type === 'image') {
    newSec = { id: generateId(), type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '새 이미지' };
  } else if (type === 'grid2') {
    newSec = { id: generateId(), type: 'grid2', imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 2, label1: '왼쪽 이미지', label2: '오른쪽 이미지' };
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
  try {
    let url;
    if (CONFIG.SUPABASE_ANON_KEY) {
      url = await uploadImage(file, 'sections');
    } else {
      // Supabase 없을 때 Base64로 임시 처리
      url = await fileToBase64(file);
      showToast('Supabase 미연결: 로컬 미리보기 모드', 'warning');
    }
    updateSectionAndRender(uploadTargetSectionId, 'imageUrl', url);
    renderPropPanel();
    showToast('이미지 업로드 완료!', 'success');
  } catch (err) {
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
  try {
    let url;
    if (CONFIG.SUPABASE_ANON_KEY) {
      url = await uploadImage(file, 'sections');
    } else {
      url = await fileToBase64(file);
      showToast('Supabase 미연결: 로컬 미리보기 모드', 'warning');
    }
    const key = uploadGrid2Slot === 1 ? 'imageUrl1' : 'imageUrl2';
    updateSectionAndRender(uploadGrid2SectionId, key, url);
    renderPropPanel();
    showToast('이미지 업로드 완료!', 'success');
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
