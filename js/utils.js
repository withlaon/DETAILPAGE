// =============================================
// 유틸리티 함수 모음
// =============================================

// ── JPEG 다운로드 ─────────────────────────────

async function downloadAsJpeg(canvasEl, filename = '상세페이지') {
  showToast('JPEG 파일 생성 중...', 'info');

  const opt = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: canvasEl.scrollWidth,
    height: canvasEl.scrollHeight,
    windowWidth: canvasEl.scrollWidth,
    windowHeight: canvasEl.scrollHeight,
  };

  try {
    const canvas = await html2canvas(canvasEl, opt);
    const link = document.createElement('a');
    link.download = `${filename}_${formatDate(new Date())}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
    showToast('다운로드 완료!', 'success');
    return canvas;
  } catch (e) {
    console.error('다운로드 오류:', e);
    showToast('다운로드 실패. 이미지 CORS 설정을 확인하세요.', 'error');
    throw e;
  }
}

async function captureAsBlob(canvasEl) {
  try {
    const canvas = await html2canvas(canvasEl, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
  } catch (e) {
    return null;
  }
}

// ── 날짜 포맷 ─────────────────────────────────

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateKo(date) {
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return formatDateKo(dateStr);
}

// ── 토스트 알림 ───────────────────────────────

let _toastTimer = null;
function showToast(msg, type = 'info') {
  let toast = document.getElementById('dc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dc-toast';
    toast.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      z-index:9999;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:500;
      box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:all 0.3s;pointer-events:none;
      font-family:'Noto Sans KR',sans-serif;`;
    document.body.appendChild(toast);
  }
  const colors = {
    success: 'background:#10b981;color:#fff;',
    error: 'background:#ef4444;color:#fff;',
    info: 'background:#1e293b;color:#fff;',
    warning: 'background:#f59e0b;color:#fff;',
  };
  toast.style.cssText += colors[type] || colors.info;
  toast.textContent = msg;
  toast.style.opacity = '1';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ── 확인 다이얼로그 ───────────────────────────

function showConfirm(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;
    display:flex;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;`;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px 32px;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <p style="font-size:16px;color:#1e293b;margin:0 0 24px;line-height:1.6;">${msg}</p>
      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button id="confirm-cancel" style="padding:10px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;cursor:pointer;font-size:14px;">취소</button>
        <button id="confirm-ok" style="padding:10px 20px;border:none;border-radius:8px;background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:600;">삭제</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('confirm-cancel').onclick = () => overlay.remove();
  document.getElementById('confirm-ok').onclick = () => { overlay.remove(); onConfirm(); };
}

// ── AI 템플릿 생성 ────────────────────────────

function generateAITemplate(category, style = 'standard') {
  const styles = {
    standard: {
      bgMain: '#ffffff',
      bgAccent: '#f8f8f8',
      textPrimary: '#111111',
      textSecondary: '#555555',
      textAccent: '#888888',
      accentColor: '#333333',
    },
    warm: {
      bgMain: '#fffbf5',
      bgAccent: '#fef3e2',
      textPrimary: '#3d2c1e',
      textSecondary: '#7c5c3e',
      textAccent: '#a87c5a',
      accentColor: '#d4843e',
    },
    cool: {
      bgMain: '#f8faff',
      bgAccent: '#eef2ff',
      textPrimary: '#1e2a4a',
      textSecondary: '#4a5a7a',
      textAccent: '#7a8aaa',
      accentColor: '#4a67d4',
    },
    dark: {
      bgMain: '#111111',
      bgAccent: '#1a1a1a',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      textAccent: '#888888',
      accentColor: '#c9a96e',
    },
  };

  const s = styles[style] || styles.standard;
  const categoryLabels = {
    '가방': { en: 'BAG', title: '핸드백', sub: '데일리 필수 아이템' },
    '모자': { en: 'HAT', title: '모자', sub: '스타일을 완성하는 헤드웨어' },
    '의류': { en: 'CLOTHING', title: '의류', sub: '트렌디한 패션 아이템' },
    '양산': { en: 'PARASOL', title: '양산', sub: 'UV차단 프리미엄 양산' },
  };
  const label = categoryLabels[category] || { en: 'PRODUCT', title: '상품', sub: '프리미엄 상품' };

  const sections = [
    { id: generateId(), type: 'spacer', height: 30, bgColor: s.bgAccent },
    { id: generateId(), type: 'text', text: label.en + ' COLLECTION', fontSize: 11, fontWeight: 'bold', color: s.accentColor, textAlign: 'center', bgColor: s.bgAccent, paddingV: 10, paddingH: 20 },
    { id: generateId(), type: 'text', text: label.title, fontSize: 30, fontWeight: 'bold', color: s.textPrimary, textAlign: 'center', bgColor: s.bgAccent, paddingV: 10, paddingH: 20 },
    { id: generateId(), type: 'text', text: label.sub, fontSize: 14, fontWeight: 'normal', color: s.textSecondary, textAlign: 'center', bgColor: s.bgAccent, paddingV: 10, paddingH: 20 },
    { id: generateId(), type: 'spacer', height: 30, bgColor: s.bgAccent },
    { id: generateId(), type: 'image', imageUrl: '', bgColor: s.bgMain, padding: 0, label: '메인 이미지' },
    { id: generateId(), type: 'image', imageUrl: '', bgColor: s.bgMain, padding: 0, label: '서브 이미지 1' },
    { id: generateId(), type: 'spacer', height: 40, bgColor: s.bgAccent },
    { id: generateId(), type: 'text', text: '✦ FEATURES ✦', fontSize: 18, fontWeight: 'bold', color: s.textPrimary, textAlign: 'center', bgColor: s.bgAccent, paddingV: 25, paddingH: 20 },
    { id: generateId(), type: 'image', imageUrl: '', bgColor: s.bgMain, padding: 10, label: '특징 이미지' },
    { id: generateId(), type: 'text', text: '상품 특징을 상세히 설명해 주세요.\n소재, 사이즈, 컬러 등의 정보를 입력하세요.', fontSize: 14, fontWeight: 'normal', color: s.textSecondary, textAlign: 'center', bgColor: s.bgMain, paddingV: 20, paddingH: 30 },
    { id: generateId(), type: 'spacer', height: 40, bgColor: s.bgAccent },
    { id: generateId(), type: 'image', imageUrl: '', bgColor: s.bgMain, padding: 0, label: '라이프스타일 이미지 1' },
    { id: generateId(), type: 'image', imageUrl: '', bgColor: s.bgMain, padding: 0, label: '라이프스타일 이미지 2' },
    { id: generateId(), type: 'spacer', height: 40, bgColor: s.bgAccent },
    { id: generateId(), type: 'text', text: 'DETAILS', fontSize: 11, fontWeight: 'bold', color: s.accentColor, textAlign: 'center', bgColor: s.bgAccent, paddingV: 10, paddingH: 20 },
    { id: generateId(), type: 'image', imageUrl: '', bgColor: s.bgMain, padding: 20, label: '디테일 이미지' },
    { id: generateId(), type: 'spacer', height: 40, bgColor: s.bgAccent },
    { id: generateId(), type: 'text', text: '주문 및 배송 안내', fontSize: 15, fontWeight: 'bold', color: s.textPrimary, textAlign: 'center', bgColor: s.bgAccent, paddingV: 20, paddingH: 20 },
    { id: generateId(), type: 'text', text: '• 주문 후 1~3 영업일 이내 발송됩니다.\n• 교환/반품은 수령 후 7일 이내 가능합니다.', fontSize: 13, fontWeight: 'normal', color: s.textAccent, textAlign: 'center', bgColor: s.bgAccent, paddingV: 15, paddingH: 30 },
    { id: generateId(), type: 'spacer', height: 30, bgColor: s.bgAccent },
  ];

  return {
    name: `AI 생성 - ${label.title} (${style})`,
    category,
    sections,
  };
}

// ── 섹션 렌더링 (공통) ─────────────────────────
// window.DC_EDITOR = true 일 때 에디터 전용 UI (직접 클릭 업로드) 활성화

function _imgPlaceholder(label, clickAttr, minH) {
  const h = minH || 260;
  const cursor = clickAttr ? 'cursor:pointer;' : '';
  return `<div ${clickAttr || ''} style="background:#f5f5f5;min-height:${h}px;display:flex;
    flex-direction:column;align-items:center;justify-content:center;
    color:#c0c0c0;border:2px dashed #e0e0e0;width:100%;${cursor}
    transition:background 0.15s,border-color 0.15s;"
    ${clickAttr ? `onmouseenter="this.style.background='#eef2ff';this.style.borderColor='#818cf8'"
    onmouseleave="this.style.background='#f5f5f5';this.style.borderColor='#e0e0e0'"` : ''}>
    <div style="width:48px;height:48px;border-radius:50%;background:#e8e8e8;display:flex;
      align-items:center;justify-content:center;margin-bottom:10px;">
      <svg width="24" height="24" fill="none" stroke="#aaa" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </div>
    <span style="font-size:13px;font-weight:600;color:#999;">${label || '이미지 업로드'}</span>
    ${clickAttr ? '<span style="font-size:11px;color:#b0b0b0;margin-top:4px;">클릭하여 이미지 선택</span>' : ''}
  </div>`;
}

function _imgWithOverlay(src, alt, clickAttr) {
  if (!clickAttr) {
    return `<img src="${src}" style="width:100%;display:block;" alt="${alt||''}">`;
  }
  return `<div style="position:relative;line-height:0;">
    <img src="${src}" style="width:100%;display:block;" alt="${alt||''}">
    <div ${clickAttr}
      style="position:absolute;inset:0;background:transparent;display:flex;align-items:center;
        justify-content:center;cursor:pointer;transition:background 0.2s;"
      onmouseenter="this.style.background='rgba(0,0,0,0.35)';this.querySelector('.chg-lbl').style.opacity='1'"
      onmouseleave="this.style.background='transparent';this.querySelector('.chg-lbl').style.opacity='0'">
      <div class="chg-lbl" style="opacity:0;transition:opacity 0.2s;background:rgba(0,0,0,0.7);
        color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;
        display:flex;align-items:center;gap:8px;pointer-events:none;">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        이미지 변경
      </div>
    </div>
  </div>`;
}

function renderSectionHTML(section) {
  const id = section.id;
  const isEditor = window.DC_EDITOR === true;

  // ── 단일 이미지 ──────────────────────────────
  if (section.type === 'image') {
    const bg = section.bgColor || '#ffffff';
    const pad = section.padding || 0;
    const click = isEditor ? `onclick="event.stopPropagation();editorUploadImage('${id}')"` : '';
    let inner;
    if (section.imageUrl) {
      inner = _imgWithOverlay(section.imageUrl, section.label, click);
    } else {
      inner = _imgPlaceholder(section.label || '이미지를 업로드하세요', click, 300);
    }
    return `<div id="${id}" style="background:${bg};padding:${pad}px;">${inner}</div>`;
  }

  // ── 2단 그리드 이미지 ──────────────────────────
  if (section.type === 'grid2') {
    const bg  = section.bgColor || '#ffffff';
    const gap = section.gap !== undefined ? section.gap : 2;
    const click1 = isEditor ? `onclick="event.stopPropagation();editorUploadGrid2('${id}',1)"` : '';
    const click2 = isEditor ? `onclick="event.stopPropagation();editorUploadGrid2('${id}',2)"` : '';
    const left  = section.imageUrl1
      ? _imgWithOverlay(section.imageUrl1, section.label1, click1)
      : _imgPlaceholder(section.label1 || '왼쪽 이미지', click1, 280);
    const right = section.imageUrl2
      ? _imgWithOverlay(section.imageUrl2, section.label2, click2)
      : _imgPlaceholder(section.label2 || '오른쪽 이미지', click2, 280);
    return `<div id="${id}" style="background:${bg};display:flex;gap:${gap}px;align-items:stretch;">
      <div style="flex:1;min-width:0;">${left}</div>
      <div style="flex:1;min-width:0;">${right}</div>
    </div>`;
  }

  // ── 텍스트 ───────────────────────────────────
  if (section.type === 'text') {
    const bg   = section.bgColor || '#ffffff';
    const pv   = section.paddingV || 20;
    const ph   = section.paddingH || 20;
    const size = section.fontSize || 16;
    const weight = section.fontWeight === 'bold' ? 'bold' : 'normal';
    const color = section.color || '#333333';
    const align = section.textAlign || 'center';
    const textContent = (section.text || '').replace(/\n/g, '<br>');
    return `<div id="${id}" style="background:${bg};padding:${pv}px ${ph}px;">
      <p style="font-size:${size}px;font-weight:${weight};color:${color};text-align:${align};
        margin:0;line-height:1.8;white-space:pre-wrap;font-family:'Noto Sans KR',sans-serif;">${textContent}</p>
    </div>`;
  }

  // ── 여백 ─────────────────────────────────────
  if (section.type === 'spacer') {
    const bg = section.bgColor || '#f5f5f5';
    const h  = section.height || 20;
    return `<div id="${id}" style="background:${bg};height:${h}px;"></div>`;
  }

  return '';
}
