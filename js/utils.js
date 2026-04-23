// =============================================
// 유틸리티 함수 모음
// =============================================

// ── JPEG 다운로드 ─────────────────────────────

async function downloadAsJpeg(canvasEl, filename = '상세페이지') {
  showToast('JPEG 파일 생성 중...', 'info');

  // 양사이드 여백 임시 제거: .section-overlay 바로 아래 섹션 루트 div의 좌우 padding을 0으로
  const modified = [];
  canvasEl.querySelectorAll('.section-overlay > div[id]').forEach(el => {
    const cs = window.getComputedStyle(el);
    const pl = parseFloat(cs.paddingLeft)  || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    if (pl > 0 || pr > 0) {
      const origStyle = el.getAttribute('style') || '';
      el.style.paddingLeft  = '0px';
      el.style.paddingRight = '0px';
      modified.push({ el, origStyle });
    }
  });

  const W = canvasEl.scrollWidth;
  const H = canvasEl.scrollHeight;

  const opt = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: W,
    height: H,
    windowWidth: W,
    windowHeight: H,
  };

  try {
    const img = await html2canvas(canvasEl, opt);
    const link = document.createElement('a');
    link.download = `${filename}_${formatDate(new Date())}.jpg`;
    link.href = img.toDataURL('image/jpeg', 0.92);
    link.click();
    showToast('다운로드 완료!', 'success');
    return img;
  } catch (e) {
    console.error('다운로드 오류:', e);
    showToast('다운로드 실패. 이미지 CORS 설정을 확인하세요.', 'error');
    throw e;
  } finally {
    // 여백 원복
    modified.forEach(({ el, origStyle }) => {
      el.setAttribute('style', origStyle);
    });
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

function _imgPlaceholder(label, clickAttr, minH, dropAttrs) {
  const h = minH || 260;
  const cursor = clickAttr ? 'cursor:pointer;' : '';
  const drag = dropAttrs || '';
  return `<div ${clickAttr || ''} ${drag}
    style="background:#f5f5f5;min-height:${h}px;display:flex;
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
    ${clickAttr ? '<span style="font-size:11px;color:#b0b0b0;margin-top:4px;">클릭 또는 드래그&드롭</span>' : ''}
  </div>`;
}

function _imgWithOverlay(src, alt, clickAttr, dropAttrs) {
  const drag = dropAttrs || '';
  if (!clickAttr && !drag) {
    return `<img src="${src}" style="width:100%;display:block;" alt="${alt||''}">`;
  }
  return `<div style="position:relative;line-height:0;">
    <img src="${src}" style="width:100%;display:block;" alt="${alt||''}">
    <div ${clickAttr || ''} ${drag}
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
        클릭 또는 드래그&드롭
      </div>
    </div>
  </div>`;
}

function renderSectionHTML(section) {
  const id = section.id;
  const isEditor = window.DC_EDITOR === true;

  // ── 히어로 (3:4 비율 + 하단 그라데이션 텍스트) ──
  if (section.type === 'hero') {
    const bg        = section.bgColor  || '#ffffff';
    const pad       = section.padding  !== undefined ? section.padding : 16;
    const radius    = section.radius   !== undefined ? section.radius  : 10;
    const subText   = section.subText  || '';
    const brandText = section.brandText !== undefined ? section.brandText : 'Withlaon';
    const textColor = section.textColor || '#ffffff';
    const gradStop  = section.gradStop  !== undefined ? section.gradStop : 42;
    const gradColor = section.gradColor || 'rgba(167,139,250,0.32)';
    // 에디터 전용 업로드 핸들러 (triggerImageUpload는 editor.js에 정의됨)
    const uploadFn = `triggerImageUpload('${id}')`;

    // 이미지 or 플레이스홀더
    const heroDrop = isEditor
      ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
         ondragleave="handleCanvasDragLeave(event,this)"
         ondrop="handleCanvasDrop(event,'${id}',0)"`
      : '';
    let imgEl = '';
    if (section.imageUrl) {
      imgEl = `<img src="${section.imageUrl}"
        style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:1;"
        alt="${section.label||''}">`;
    } else {
      const clickAttr = isEditor ? `onclick="event.stopPropagation();${uploadFn}"` : '';
      imgEl = `<div ${clickAttr} ${heroDrop}
        style="position:absolute;inset:0;z-index:1;background:#f0f0f0;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          color:#bbb;border:2px dashed #ddd;${isEditor?'cursor:pointer;':''}"
        ${isEditor ? `onmouseenter="this.style.background='#eef2ff';this.style.borderColor='#818cf8'"
          onmouseleave="this.style.background='#f0f0f0';this.style.borderColor='#ddd'"` : ''}>
        <div style="width:56px;height:56px;border-radius:50%;background:#e4e4e4;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
          <svg width="28" height="28" fill="none" stroke="#bbb" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
              a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2
              H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <span style="font-size:14px;font-weight:600;color:#bbb;">대표 이미지 업로드</span>
        <span style="font-size:12px;color:#ccc;margin-top:4px;">3:4 비율 권장</span>
        ${isEditor ? '<span style="font-size:11px;color:#aaa;margin-top:6px;background:#e8e8e8;padding:4px 12px;border-radius:20px;">클릭 또는 드래그&드롭</span>' : ''}
      </div>`;
    }

    // 하단 그라데이션 + 텍스트 오버레이 (z-index:3, pointer-events:none)
    const hasText = subText || brandText;
    const textOverlay = hasText ? `
      <div style="position:absolute;bottom:0;left:0;right:0;z-index:3;pointer-events:none;
        background:linear-gradient(to bottom, transparent 0%, ${gradColor} ${gradStop}%, ${gradColor} 100%);
        padding:80px 28px 30px;text-align:center;">
        ${subText ? `<p style="font-size:18px;color:${textColor};margin:0 0 10px;
          font-weight:700;letter-spacing:0.05em;text-shadow:0 1px 4px rgba(0,0,0,0.3);
          font-family:'Noto Sans KR',sans-serif;">${subText}</p>` : ''}
        ${brandText ? `<p style="font-size:30px;color:${textColor};margin:0;
          font-family:'Great Vibes','Dancing Script',cursive;
          text-shadow:0 1px 6px rgba(0,0,0,0.25);letter-spacing:0.02em;">${brandText}</p>` : ''}
      </div>` : '';

    // 이미지 있을 때 드롭 오버레이 (z-index:4)
    const heroDropOverlay = (isEditor && section.imageUrl) ? `
      <div ${heroDrop}
        style="position:absolute;inset:0;z-index:4;pointer-events:auto;background:transparent;"
        onmouseenter="this.style.background='rgba(109,40,217,0.08)'"
        onmouseleave="this.style.background='transparent'">
      </div>` : '';

    // 에디터 변경 버튼 (이미지 있을 때만, z-index:5)
    const changeBtn = (isEditor && section.imageUrl) ? `
      <button onclick="event.stopPropagation();${uploadFn}"
        style="position:absolute;top:10px;right:10px;z-index:5;
          background:rgba(0,0,0,0.55);color:#fff;border:none;
          padding:7px 14px;border-radius:8px;font-size:12px;cursor:pointer;
          font-family:'Noto Sans KR',sans-serif;display:flex;align-items:center;gap:5px;
          transition:background 0.2s;"
        onmouseenter="this.style.background='rgba(79,70,229,0.85)'"
        onmouseleave="this.style.background='rgba(0,0,0,0.55)'">
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
            a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2
            H5a2 2 0 01-2-2V9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        이미지 변경
      </button>` : '';

    return `<div id="${id}" style="background:${bg};padding:${pad}px;">
      <div style="position:relative;aspect-ratio:3/4;overflow:hidden;border-radius:${radius}px;">
        ${imgEl}
        ${textOverlay}
        ${heroDropOverlay}
        ${changeBtn}
      </div>
    </div>`;
  }

  // ── 홍보문구 (Promo) — subText 단일 필드 표시 ──
  if (section.type === 'promo') {
    const bg       = section.bgColor  || '#ffffff';
    const pv       = section.paddingV !== undefined ? section.paddingV : 50;
    const ph       = section.paddingH !== undefined ? section.paddingH : 40;
    const rawSub   = section.subText  || '';
    const promoTxt = rawSub.replace(/\n/g, '<br>');
    const subSize  = section.subFontSize !== undefined ? section.subFontSize : 16;
    const subColor = section.subColor || '#444444';
    const lineColor = section.lineColor || '#dddddd';
    const align    = section.textAlign || 'center';
    const isEmpty  = !rawSub;

    // 에디터에서 비어있을 때: 클릭 유도
    if (isEmpty && isEditor) {
      return `<div id="${id}" style="background:${bg};padding:${pv}px ${ph}px;text-align:center;
        border:2px dashed #d4b3fa;cursor:pointer;"
        onclick="event.stopPropagation();selectSection('${id}');setTimeout(()=>document.querySelector('#propPanel textarea')?.focus(),100)">
        <p style="font-size:14px;color:#c4b5d0;margin:0;font-family:'Noto Sans KR',sans-serif;">
          ✏️ 오른쪽 패널에서 홍보 문구를 입력하세요
        </p>
      </div>`;
    }

    return `<div id="${id}" style="background:${bg};padding:${pv}px ${ph}px;text-align:${align};">
      <div style="width:30px;height:2px;background:${lineColor};
        margin:0 ${align==='center'?'auto':align==='right'?'0 0 0 auto':'0'} 18px;"></div>
      <p style="font-size:${subSize}px;color:${subColor};margin:0;
        line-height:1.9;font-family:'Noto Sans KR',sans-serif;font-weight:500;">${promoTxt}</p>
    </div>`;
  }

  // ── 단일 이미지 ──────────────────────────────
  if (section.type === 'image') {
    const bg  = section.bgColor  || '#ffffff';
    const pad = section.padding  || 0;
    const click = isEditor ? `onclick="event.stopPropagation();editorUploadImage('${id}')"` : '';
    const drop  = isEditor
      ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
         ondragleave="handleCanvasDragLeave(event,this)"
         ondrop="handleCanvasDrop(event,'${id}',0)"` : '';
    let inner;
    if (section.imageUrl) {
      inner = _imgWithOverlay(section.imageUrl, section.label, click, drop);
    } else {
      inner = _imgPlaceholder(section.label || '이미지를 업로드하세요', click, 300, drop);
    }
    return `<div id="${id}" style="background:${bg};padding:${pad}px;">${inner}</div>`;
  }

  // ── 2단 그리드 이미지 ──────────────────────────
  if (section.type === 'grid2') {
    const bg  = section.bgColor || '#ffffff';
    const gap = section.gap     !== undefined ? section.gap     : 2;
    const pad = section.padding !== undefined ? section.padding : 0;
    const click1 = isEditor ? `onclick="event.stopPropagation();editorUploadGrid2('${id}',1)"` : '';
    const click2 = isEditor ? `onclick="event.stopPropagation();editorUploadGrid2('${id}',2)"` : '';
    const drop1  = isEditor
      ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
         ondragleave="handleCanvasDragLeave(event,this)"
         ondrop="handleCanvasDrop(event,'${id}',1)"` : '';
    const drop2  = isEditor
      ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
         ondragleave="handleCanvasDragLeave(event,this)"
         ondrop="handleCanvasDrop(event,'${id}',2)"` : '';
    const left  = section.imageUrl1
      ? _imgWithOverlay(section.imageUrl1, section.label1, click1, drop1)
      : _imgPlaceholder(section.label1 || '왼쪽 이미지', click1, 260, drop1);
    const right = section.imageUrl2
      ? _imgWithOverlay(section.imageUrl2, section.label2, click2, drop2)
      : _imgPlaceholder(section.label2 || '오른쪽 이미지', click2, 260, drop2);
    return `<div id="${id}" style="background:${bg};padding:${pad}px;">
      <div style="display:flex;gap:${gap}px;align-items:stretch;">
        <div style="flex:1;min-width:0;">${left}</div>
        <div style="flex:1;min-width:0;">${right}</div>
      </div>
    </div>`;
  }

  // ── 3단 그리드 이미지 ─────────────────────────
  if (section.type === 'grid3') {
    const bg  = section.bgColor || '#ffffff';
    const gap = section.gap     !== undefined ? section.gap     : 4;
    const pad = section.padding !== undefined ? section.padding : 0;
    const cols = [1, 2, 3];
    const cells = cols.map(i => {
      const imgUrl  = section[`imageUrl${i}`] || '';
      const lbl     = section[`label${i}`] || `이미지 ${i}`;
      const clickA  = isEditor ? `onclick="event.stopPropagation();triggerGenericUpload('${id}','imageUrl${i}')"` : '';
      const dropA   = isEditor
        ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
           ondragleave="handleCanvasDragLeave(event,this)"
           ondrop="handleCanvasDropGeneric(event,'${id}','imageUrl${i}')"` : '';
      return `<div style="flex:1;min-width:0;">
        ${imgUrl
          ? _imgWithOverlay(imgUrl, lbl, clickA, dropA)
          : _imgPlaceholder(lbl, clickA, 200, dropA)}
      </div>`;
    }).join('');
    return `<div id="${id}" style="background:${bg};padding:${pad}px;">
      <div style="display:flex;gap:${gap}px;">${cells}</div>
    </div>`;
  }

  // ── 컬러 옵션 이미지 (Color Options) ──────────
  if (section.type === 'coloroption') {
    const bg    = section.bgColor  || '#ffffff';
    const pv    = section.paddingV !== undefined ? section.paddingV : 32;
    const ph    = section.paddingH !== undefined ? section.paddingH : 24;
    const title = section.title    || 'Color Options';
    const cols  = Math.min(Math.max(section.cols || 4, 1), 6);
    const gap   = section.gap      !== undefined ? section.gap : 12;

    let cells = '';
    for (let i = 1; i <= cols; i++) {
      const imgUrl = section[`imageUrl${i}`] || '';
      const name   = section[`name${i}`]    || '';
      const clickA = isEditor ? `onclick="event.stopPropagation();triggerGenericUpload('${id}','imageUrl${i}')"` : '';
      const dropA  = isEditor
        ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
           ondragleave="handleCanvasDragLeave(event,this)"
           ondrop="handleCanvasDropGeneric(event,'${id}','imageUrl${i}')"` : '';
      const imgEl = imgUrl
        ? `<div ${clickA} ${dropA} style="${isEditor?'cursor:pointer;':''}position:relative;">
            <img src="${imgUrl}" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:6px;">
            ${isEditor ? `<div style="position:absolute;inset:0;background:transparent;border-radius:6px;
              display:flex;align-items:center;justify-content:center;transition:background 0.2s;"
              onmouseenter="this.style.background='rgba(109,40,217,0.25)'"
              onmouseleave="this.style.background='transparent'">
              <span style="opacity:0;color:#fff;font-size:11px;font-weight:600;pointer-events:none;"
                class="chg-lbl">변경</span>
            </div>` : ''}
          </div>`
        : `<div ${clickA} ${dropA}
            style="width:100%;aspect-ratio:1;background:#f5f5f5;border:2px dashed #ddd;
              border-radius:6px;display:flex;flex-direction:column;align-items:center;
              justify-content:center;${isEditor?'cursor:pointer;':''}gap:6px;"
            ${isEditor?`onmouseenter="this.style.background='#eef2ff';this.style.borderColor='#7c3aed'"
              onmouseleave="this.style.background='#f5f5f5';this.style.borderColor='#ddd'"`:''}>
            <svg width="20" height="20" fill="none" stroke="#ccc" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
                a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2
                H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span style="font-size:10px;color:#bbb;">이미지 업로드</span>
          </div>`;
      cells += `<div style="flex:1;min-width:0;text-align:center;">
        ${imgEl}
        <p style="font-size:12px;color:#666;margin:8px 0 0;padding:0 2px;
          font-family:'Noto Sans KR',sans-serif;line-height:1.4;">
          ${name || (isEditor ? '<span style="color:#ccc;">옵션명</span>' : '')}
        </p>
      </div>`;
    }

    return `<div id="${id}" style="background:${bg};padding:${pv}px ${ph}px;">
      <p style="font-size:13px;font-weight:700;color:#7c3aed;text-align:center;margin:0 0 20px;
        letter-spacing:0.12em;font-family:'Noto Sans KR',sans-serif;">
        — ${title} —
      </p>
      <div style="display:flex;gap:${gap}px;align-items:flex-start;">${cells}</div>
    </div>`;
  }

  // ── 디테일 컷 (Detail View) ───────────────────
  if (section.type === 'detailview') {
    const bg    = section.bgColor  || '#ffffff';
    const pv    = section.paddingV !== undefined ? section.paddingV : 20;
    const ph    = section.paddingH !== undefined ? section.paddingH : 20;
    const title = section.title    || 'Detail View';
    const gap   = section.gap      !== undefined ? section.gap : 6;
    const rows  = [[1,2],[3,4]];

    const rowsHtml = rows.map(pair => {
      const cells = pair.map(i => {
        const imgUrl = section[`imageUrl${i}`] || '';
        const lbl    = `디테일 ${i}`;
        const clickA = isEditor ? `onclick="event.stopPropagation();triggerGenericUpload('${id}','imageUrl${i}')"` : '';
        const dropA  = isEditor
          ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
             ondragleave="handleCanvasDragLeave(event,this)"
             ondrop="handleCanvasDropGeneric(event,'${id}','imageUrl${i}')"` : '';
        return `<div style="flex:1;min-width:0;">
          ${imgUrl
            ? _imgWithOverlay(imgUrl, lbl, clickA, dropA)
            : _imgPlaceholder(lbl, clickA, 220, dropA)}
        </div>`;
      }).join('');
      return `<div style="display:flex;gap:${gap}px;">${cells}</div>`;
    }).join(`<div style="height:${gap}px;"></div>`);

    return `<div id="${id}" style="background:${bg};padding:${pv}px ${ph}px;">
      <p style="font-size:13px;font-weight:700;color:#7c3aed;text-align:center;margin:0 0 16px;
        letter-spacing:0.12em;font-family:'Noto Sans KR',sans-serif;">
        — ${title} —
      </p>
      ${rowsHtml}
    </div>`;
  }

  // ── 모델 핏 (Model Fit) — 3:4 비율 동적 이미지 ─
  if (section.type === 'modelfit') {
    const bg     = section.bgColor  || '#ffffff';
    const pv     = section.paddingV !== undefined ? section.paddingV : 16;
    const ph     = section.paddingH !== undefined ? section.paddingH : 0;
    const title  = section.title    || 'Model Fit';
    const count  = Math.max(section.count || 2, 1);
    const gap    = section.gap      !== undefined ? section.gap : 4;
    const perRow = section.perRow   || 2;

    const imgCells = [];
    for (let i = 1; i <= count; i++) {
      const imgUrl = section[`imageUrl${i}`] || '';
      const clickA = isEditor ? `onclick="event.stopPropagation();triggerGenericUpload('${id}','imageUrl${i}')"` : '';
      const dropA  = isEditor
        ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
           ondragleave="handleCanvasDragLeave(event,this)"
           ondrop="handleCanvasDropGeneric(event,'${id}','imageUrl${i}')"` : '';
      let inner;
      if (imgUrl) {
        inner = `<div ${clickA} ${dropA}
          style="position:relative;aspect-ratio:3/4;overflow:hidden;border-radius:4px;${isEditor?'cursor:pointer;':''}">
          <img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;display:block;">
          ${isEditor ? `<div style="position:absolute;inset:0;background:transparent;display:flex;align-items:center;
            justify-content:center;transition:background 0.2s;"
            onmouseenter="this.style.background='rgba(0,0,0,0.3)';this.querySelector('.mf-lbl').style.opacity='1'"
            onmouseleave="this.style.background='transparent';this.querySelector('.mf-lbl').style.opacity='0'">
            <span class="mf-lbl" style="opacity:0;color:#fff;font-size:12px;font-weight:600;
              background:rgba(0,0,0,0.6);padding:6px 14px;border-radius:8px;pointer-events:none;transition:opacity 0.2s;">
              이미지 변경
            </span>
          </div>` : ''}
        </div>`;
      } else {
        inner = `<div ${clickA} ${dropA}
          style="aspect-ratio:3/4;background:#f5f5f5;border:2px dashed #ddd;border-radius:4px;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            gap:8px;${isEditor?'cursor:pointer;':''}"
          ${isEditor?`onmouseenter="this.style.background='#eef2ff';this.style.borderColor='#7c3aed'"
            onmouseleave="this.style.background='#f5f5f5';this.style.borderColor='#ddd'"`:''}>
          <svg width="24" height="24" fill="none" stroke="#ccc" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
              a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2
              H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span style="font-size:11px;color:#ccc;">3:4 비율</span>
          ${isEditor?'<span style="font-size:10px;color:#bbb;">클릭 또는 드래그</span>':''}
        </div>`;
      }
      imgCells.push(`<div style="flex:1;min-width:0;">${inner}</div>`);
    }

    let rowsHtml = '';
    for (let r = 0; r < imgCells.length; r += perRow) {
      const rowSlice = imgCells.slice(r, r + perRow);
      while (rowSlice.length < perRow) rowSlice.push(`<div style="flex:1;min-width:0;"></div>`);
      rowsHtml += `<div style="display:flex;gap:${gap}px;${r > 0 ? `margin-top:${gap}px;` : ''}">${rowSlice.join('')}</div>`;
    }

    return `<div id="${id}" style="background:${bg};padding:${pv}px ${ph}px;">
      <p style="font-size:13px;font-weight:700;color:#7c3aed;text-align:center;margin:0 0 16px;
        letter-spacing:0.12em;font-family:'Noto Sans KR',sans-serif;">— ${title} —</p>
      ${rowsHtml}
    </div>`;
  }

  // ── 사이즈 정보 (Size Information) ────────────
  if (section.type === 'sizeinfo') {
    const bg  = section.bgColor || '#f0eeff';
    const pad = section.padding !== undefined ? section.padding : 24;
    const title = section.title || 'SIZE INFORMATION';
    const imgUrl = section.imageUrl || '';
    const mRows = [
      { label: section.m1Label || '가로',   value: section.m1Value || '- cm' },
      { label: section.m2Label || '세로',   value: section.m2Value || '- cm' },
      { label: section.m3Label || '높이',   value: section.m3Value || '- cm' },
      { label: section.m4Label || '손잡이', value: section.m4Value || '- cm' },
    ];
    const weight   = section.weight   || '- g';
    const material = section.material || '-';

    const clickA = isEditor ? `onclick="event.stopPropagation();triggerImageUpload('${id}')"` : '';
    const dropA  = isEditor
      ? `ondragover="event.stopPropagation();handleCanvasDragOver(event,this)"
         ondragleave="handleCanvasDragLeave(event,this)"
         ondrop="handleCanvasDrop(event,'${id}',0)"` : '';

    let imgEl;
    if (imgUrl) {
      imgEl = `<div ${clickA} ${dropA} style="position:relative;${isEditor?'cursor:pointer;':''}">
        <img src="${imgUrl}" style="width:100%;display:block;border-radius:10px;object-fit:contain;">
        ${isEditor ? `<div style="position:absolute;inset:0;background:transparent;border-radius:10px;
          display:flex;align-items:center;justify-content:center;transition:background 0.2s;"
          onmouseenter="this.style.background='rgba(124,58,237,0.18)'"
          onmouseleave="this.style.background='transparent'">
          <span style="color:#fff;font-size:12px;font-weight:600;background:rgba(0,0,0,0.5);
            padding:6px 14px;border-radius:8px;pointer-events:none;">이미지 변경</span>
        </div>` : ''}
      </div>`;
    } else {
      imgEl = `<div ${clickA} ${dropA} style="min-height:220px;background:#e4dff8;border:2px dashed #c0b4f0;
        border-radius:10px;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:10px;${isEditor?'cursor:pointer;':''}"
        ${isEditor?`onmouseenter="this.style.background='#d8d0f5'" onmouseleave="this.style.background='#e4dff8'"`:''}>
        <svg width="32" height="32" fill="none" stroke="#a99ae0" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
            a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2
            H5a2 2 0 01-2-2V9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span style="font-size:13px;color:#9b90c8;font-family:'Noto Sans KR',sans-serif;">상품 이미지 업로드</span>
        ${isEditor?'<span style="font-size:11px;color:#b8b0d8;">클릭 또는 드래그</span>':''}
      </div>`;
    }

    const rowsHtml = mRows.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:10px 0;border-bottom:1px solid #e0d8ff;">
        <span style="font-size:14px;color:#666;font-family:'Noto Sans KR',sans-serif;">${r.label}</span>
        <span style="font-size:14px;color:#333;font-weight:600;font-family:'Noto Sans KR',sans-serif;">${r.value}</span>
      </div>`).join('');

    return `<div id="${id}" style="background:${bg};padding:${pad}px;border-radius:18px;margin:12px 0;">
      <p style="font-size:19px;font-weight:800;color:#7c3aed;text-align:center;margin:0 0 22px;
        letter-spacing:0.08em;font-family:'Noto Sans KR',sans-serif;">${title}</p>
      <div style="display:flex;gap:22px;align-items:flex-start;">
        <div style="flex:0 0 43%;">${imgEl}</div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:11px;font-weight:700;color:#7c3aed;margin:0 0 8px;
            letter-spacing:0.1em;font-family:'Noto Sans KR',sans-serif;">MEASUREMENT GUIDE</p>
          ${rowsHtml}
          <p style="font-size:11px;font-weight:700;color:#7c3aed;margin:18px 0 10px;
            letter-spacing:0.1em;font-family:'Noto Sans KR',sans-serif;">TECHNICAL SPECS</p>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;background:#fff;border-radius:10px;padding:14px;border:1px solid #e0d8ff;">
              <p style="font-size:10px;color:#aaa;margin:0 0 6px;letter-spacing:0.1em;">WEIGHT</p>
              <p style="font-size:18px;font-weight:700;color:#333;margin:0;font-family:'Noto Sans KR',sans-serif;">${weight}</p>
            </div>
            <div style="flex:1;background:#7c3aed;border-radius:10px;padding:14px;">
              <p style="font-size:10px;color:rgba(255,255,255,0.72);margin:0 0 6px;letter-spacing:0.1em;">MATERIAL</p>
              <p style="font-size:18px;font-weight:700;color:#fff;margin:0;font-family:'Noto Sans KR',sans-serif;">${material}</p>
            </div>
          </div>
        </div>
      </div>
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
    const h  = section.height  || 20;
    return `<div id="${id}" style="background:${bg};height:${h}px;"></div>`;
  }

  return '';
}
