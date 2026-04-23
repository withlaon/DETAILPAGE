// =============================================
// 대시보드 페이지 로직
// =============================================

let allPages = [];
let currentCategory = 'all';
let selectedTemplate = 'tpl_basic';
let selectedAIStyle = 'standard';

// ── 초기화 ────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  renderTemplateGrid();
  setupCategoryTabs();
  setupSearch();

  if (!CONFIG.SUPABASE_ANON_KEY) {
    document.getElementById('setupBanner').classList.remove('hidden');
    showEmptyState('Supabase 키를 설정하면 저장된 페이지를 불러올 수 있습니다.', true);
    return;
  }
  await loadPages();
});

// ── 페이지 로드 ───────────────────────────────

async function loadPages() {
  showLoadingState();
  try {
    allPages = await fetchAllPages();
    updateStats();
    renderPages();
  } catch (e) {
    console.error(e);
    showEmptyState('데이터를 불러오는 중 오류가 발생했습니다. 설정을 확인하세요.');
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = allPages.length;
  document.getElementById('stat-bag').textContent = allPages.filter(p => p.category === '가방').length;
  document.getElementById('stat-clothing').textContent = allPages.filter(p => p.category === '의류').length;
  const other = allPages.filter(p => !['가방', '의류'].includes(p.category)).length;
  document.getElementById('stat-other').textContent = other;
}

function renderPages() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;

  let pages = allPages.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchQ = !query || p.title.toLowerCase().includes(query) || p.category.includes(query);
    return matchCat && matchQ;
  });

  pages = pages.sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const grid = document.getElementById('pagesGrid');
  if (pages.length === 0) {
    showEmptyState(query ? `"${query}" 검색 결과가 없습니다.` : '아직 제작된 상세페이지가 없습니다.\n새 페이지를 만들어 시작해보세요!');
    return;
  }

  grid.innerHTML = pages.map(page => createPageCard(page)).join('');
}

function createPageCard(page) {
  const catColor = CATEGORY_COLORS[page.category] || CATEGORY_COLORS['기타'];
  const sectionCount = Array.isArray(page.sections) ? page.sections.length : 0;
  const date = timeAgo(page.updated_at || page.created_at);

  const thumb = page.thumbnail_url
    ? `<img src="${page.thumbnail_url}" alt="${page.title}" class="w-full h-full object-cover">`
    : `<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <svg class="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span class="text-xs text-slate-400">미리보기 없음</span>
      </div>`;

  return `
  <div class="bg-white rounded-2xl border border-slate-100 shadow-sm card-hover overflow-hidden group">
    <div class="aspect-[3/4] relative overflow-hidden bg-slate-50">
      ${thumb}
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button onclick="editPage('${page.id}')" class="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-colors">편집</button>
        <button onclick="downloadPage('${page.id}')" class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">다운로드</button>
      </div>
    </div>
    <div class="p-3">
      <div class="flex items-start justify-between gap-2 mb-1.5">
        <h3 class="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">${page.title}</h3>
        <span class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${catColor}">${page.category}</span>
      </div>
      <p class="text-xs text-slate-400">${sectionCount}개 섹션 · ${date}</p>
      <div class="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
        <button onclick="editPage('${page.id}')" class="flex-1 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          편집
        </button>
        <button onclick="downloadPage('${page.id}')" class="flex-1 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
          다운로드
        </button>
        <button onclick="confirmDeletePage('${page.id}', '${page.title.replace(/'/g,"\\'")}') " class="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>`;
}

function showLoadingState() {
  const grid = document.getElementById('pagesGrid');
  grid.innerHTML = Array.from({length: 8}, () => `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="aspect-[3/4] skeleton"></div>
      <div class="p-3 space-y-2">
        <div class="h-4 skeleton rounded-lg"></div>
        <div class="h-3 skeleton rounded-lg w-2/3"></div>
      </div>
    </div>`).join('');
}

function showEmptyState(msg, isSetup = false) {
  const grid = document.getElementById('pagesGrid');
  grid.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
        ${isSetup
          ? `<svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`
          : `<svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`
        }
      </div>
      <p class="text-slate-500 text-sm whitespace-pre-line">${msg}</p>
      ${!isSetup ? `<button onclick="openNewPageModal()" class="mt-5 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">+ 새 페이지 만들기</button>` : ''}
    </div>`;
}

// ── 카테고리 탭 ───────────────────────────────

function setupCategoryTabs() {
  document.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderPages();
    });
  });
}

// ── 검색 & 정렬 ──────────────────────────────

function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', () => renderPages());
  document.getElementById('sortSelect').addEventListener('change', () => renderPages());
}

// ── 페이지 편집 ───────────────────────────────

function editPage(id) {
  window.location.href = `editor.html?id=${id}`;
}

// ── 페이지 다운로드 ───────────────────────────

async function downloadPage(id) {
  const page = allPages.find(p => p.id === id);
  if (!page) return;

  showToast('미리보기 창에서 다운로드하세요...', 'info');
  window.location.href = `editor.html?id=${id}&download=1`;
}

// ── 페이지 삭제 ───────────────────────────────

function confirmDeletePage(id, title) {
  showConfirm(`"${title}" 을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`, async () => {
    try {
      await deletePage(id);
      showToast('삭제되었습니다.', 'success');
      await loadPages();
    } catch (e) {
      showToast('삭제 실패: ' + e.message, 'error');
    }
  });
}

// ── 새 페이지 모달 ────────────────────────────

function renderTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  if (!grid) return;
  grid.innerHTML = TEMPLATES.map(t => `
    <div class="template-card border-2 rounded-xl p-4 cursor-pointer transition-all ${t.id === selectedTemplate ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}"
         onclick="selectTemplate('${t.id}')" data-id="${t.id}">
      <div class="aspect-[2/3] bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg mb-3 flex items-center justify-center">
        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        </svg>
      </div>
      <div class="font-semibold text-slate-800 text-sm">${t.name}</div>
      <div class="text-xs text-slate-400 mt-0.5">${t.description}</div>
    </div>`).join('');

  // AI 스타일 버튼
  document.querySelectorAll('.ai-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ai-style-btn').forEach(b => {
        b.classList.remove('bg-indigo-100', 'text-indigo-700', 'border-indigo-400');
        b.classList.add('bg-white', 'text-slate-600', 'border-transparent');
      });
      btn.classList.add('bg-indigo-100', 'text-indigo-700', 'border-indigo-400');
      btn.classList.remove('bg-white', 'text-slate-600', 'border-transparent');
      selectedAIStyle = btn.dataset.style;
    });
  });
}

function selectTemplate(id) {
  selectedTemplate = id;
  document.querySelectorAll('.template-card').forEach(card => {
    if (card.dataset.id === id) {
      card.classList.add('border-indigo-500', 'bg-indigo-50');
      card.classList.remove('border-slate-200');
    } else {
      card.classList.remove('border-indigo-500', 'bg-indigo-50');
      card.classList.add('border-slate-200');
    }
  });
}

function openNewPageModal() {
  document.getElementById('newPageModal').classList.remove('hidden');
  renderTemplateGrid();
}

function closeNewPageModal() {
  document.getElementById('newPageModal').classList.add('hidden');
}

function createNewPage() {
  const title = document.getElementById('newPageTitle').value.trim();
  const category = document.getElementById('newPageCategory').value;
  if (!title) {
    showToast('제목을 입력해주세요.', 'warning');
    document.getElementById('newPageTitle').focus();
    return;
  }
  const tpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
  const newPage = {
    title,
    category,
    sections: deepClone(tpl.sections).map(s => ({ ...s, id: generateId() })),
  };
  sessionStorage.setItem('dc_new_page', JSON.stringify(newPage));
  window.location.href = 'editor.html?mode=new';
}

function generateAndCreate() {
  const category = document.getElementById('newPageCategory').value;
  const title = document.getElementById('newPageTitle').value.trim() || `AI 생성 - ${category}`;
  const aiPage = generateAITemplate(category, selectedAIStyle);
  aiPage.title = title;
  sessionStorage.setItem('dc_new_page', JSON.stringify(aiPage));
  closeNewPageModal();
  window.location.href = 'editor.html?mode=new';
}

// ── 설정 모달 ─────────────────────────────────

function openSettingsModal() {
  document.getElementById('settingAnonKey').value = CONFIG.SUPABASE_ANON_KEY;
  document.getElementById('settingOpenAIKey').value = CONFIG.OPENAI_API_KEY;
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettingsAndReload() {
  const key = document.getElementById('settingAnonKey').value.trim();
  const openaiKey = document.getElementById('settingOpenAIKey').value.trim();
  if (!key) {
    showToast('Supabase Anon Key를 입력하세요.', 'warning');
    return;
  }
  saveSettings(key, openaiKey);
  resetClient();
  closeSettingsModal();
  document.getElementById('setupBanner').classList.add('hidden');
  showToast('설정이 저장되었습니다!', 'success');
  setTimeout(() => loadPages(), 500);
}
