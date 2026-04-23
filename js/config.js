// =============================================
// Supabase 설정
// =============================================
const CONFIG = {
  SUPABASE_URL: 'https://avhjwqlajlcahxpdyzsw.supabase.co',
  SUPABASE_ANON_KEY: localStorage.getItem('dc_supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aGp3cWxhamxjYWh4cGR5enN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDQ0MTcsImV4cCI6MjA5MjQ4MDQxN30.DsAM0xi5nVONiHA75Wuqo0BXPQKJqD91aY6AMJupKfs',
  OPENAI_API_KEY: localStorage.getItem('dc_openai_key') || '',
  STORAGE_BUCKET: 'detail-images',
  TABLE_NAME: 'detail_pages',
  PAGE_WIDTH: 860,
};

const CATEGORIES = ['가방', '모자', '의류', '양산'];

const CATEGORY_COLORS = {
  '가방': 'bg-indigo-100 text-indigo-700',
  '모자': 'bg-amber-100 text-amber-700',
  '의류': 'bg-emerald-100 text-emerald-700',
  '양산': 'bg-rose-100 text-rose-700',
  '기타': 'bg-slate-100 text-slate-600',
};

// =============================================
// 기본 템플릿 정의
// =============================================
const TEMPLATES = [
  {
    id: 'tpl_basic',
    name: '기본 상품 상세',
    description: '실제 쇼핑몰 구조 — 대표컷·4각도 그리드·모델컷·디테일·안내',
    thumbnail: null,
    category: '범용',
    // ─────────────────────────────────────────────────────────
    // 첨부 이미지 구조 기준:
    //  1. 대표 컷 (전체 컬렉션 컷 or 메인 단독샷)
    //  2. 상품 4각도 2×2 그리드 (정면/측면/후면/디테일)
    //  3. 모델 착용샷 1 (전신)
    //  4. 모델 착용샷 2 (클로즈업/상반신)
    //  5. 상품 단독 촬영 컷
    //  6. 모델 착용샷 3 (측면/다른 스타일)
    //  7. 상품 디테일 클로즈업
    //  8. 모델 착용샷 4
    //  9. 모델 착용샷 5 (라이프스타일)
    // 10. 상품 내부/기능 컷
    // 11. 사이즈 정보 이미지
    // 12. 배송·교환 안내 이미지(또는 텍스트)
    // ─────────────────────────────────────────────────────────
    sections: [
      // ① 대표 컷
      { id: 's1',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '① 대표 컷 (메인 상품샷)' },

      // ② 상품 4각도 — 2×2 그리드
      { id: 's2',  type: 'grid2', imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 2,
        label1: '② 정면 컷', label2: '② 측면 컷' },
      { id: 's3',  type: 'grid2', imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 2,
        label1: '② 후면 컷', label2: '② 디테일/컬러 컷' },

      // ③ 모델 착용샷 1
      { id: 's4',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '③ 모델 착용샷 1 (전신)' },

      // ④ 모델 착용샷 2
      { id: 's5',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '④ 모델 착용샷 2 (상반신)' },

      // ⑤ 상품 단독 촬영
      { id: 's6',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑤ 상품 단독 촬영 컷' },

      // ⑥ 모델 착용샷 3
      { id: 's7',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑥ 모델 착용샷 3 (측면/코디)' },

      // ⑦ 상품 디테일 클로즈업
      { id: 's8',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑦ 상품 디테일 클로즈업' },

      // ⑧ 모델 착용샷 4
      { id: 's9',  type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑧ 모델 착용샷 4' },

      // ⑨ 모델 라이프스타일
      { id: 's10', type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑨ 모델 착용샷 5 (라이프스타일)' },

      // ⑩ 상품 내부/기능
      { id: 's11', type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑩ 상품 내부/기능 컷' },

      // 여백
      { id: 's12', type: 'spacer', height: 6, bgColor: '#f0f0f0' },

      // ⑪ 사이즈 정보
      { id: 's13', type: 'image',  imageUrl: '', bgColor: '#ffffff', padding: 0, label: '⑪ 사이즈 정보 이미지' },

      // 여백
      { id: 's14', type: 'spacer', height: 6, bgColor: '#f0f0f0' },

      // ⑫ 배송·교환 안내
      { id: 's15', type: 'text',
        text: '[ 주문 및 배송 안내 ]\n\n• 주문 후 1~3 영업일 이내 발송됩니다.\n• 제주·도서산간 지역은 추가 배송비가 발생할 수 있습니다.\n\n[ 교환 및 반품 안내 ]\n\n• 수령 후 7일 이내 교환·반품 가능합니다.\n• 착용·세탁 후에는 교환·반품이 불가합니다.\n• 색상은 모니터 환경에 따라 다소 차이가 있을 수 있습니다.',
        fontSize: 13, fontWeight: 'normal', color: '#666666', textAlign: 'left',
        bgColor: '#fafafa', paddingV: 30, paddingH: 40 },
    ]
  },
  {
    id: 'tpl_minimal',
    name: '심플 미니멀',
    description: '깔끔하고 텍스트가 강조된 미니멀 레이아웃',
    thumbnail: null,
    category: '범용',
    sections: [
      { id: 's1', type: 'spacer', height: 40, bgColor: '#f8f8f8' },
      { id: 's2', type: 'text', text: 'NEW ARRIVALS', fontSize: 12, fontWeight: 'bold', color: '#999999', textAlign: 'center', bgColor: '#f8f8f8', paddingV: 10, paddingH: 20 },
      { id: 's3', type: 'text', text: '상품명', fontSize: 32, fontWeight: 'bold', color: '#111111', textAlign: 'center', bgColor: '#f8f8f8', paddingV: 10, paddingH: 20 },
      { id: 's4', type: 'spacer', height: 40, bgColor: '#f8f8f8' },
      { id: 's5', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 30, label: '메인 이미지' },
      { id: 's6', type: 'spacer', height: 60, bgColor: '#ffffff' },
      { id: 's7', type: 'text', text: '상품 소개', fontSize: 22, fontWeight: 'bold', color: '#111111', textAlign: 'center', bgColor: '#ffffff', paddingV: 20, paddingH: 20 },
      { id: 's8', type: 'text', text: '상세 설명을 입력해 주세요.\n가독성 좋은 텍스트를 작성하세요.', fontSize: 15, fontWeight: 'normal', color: '#555555', textAlign: 'center', bgColor: '#ffffff', paddingV: 15, paddingH: 40 },
      { id: 's9', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 30, label: '서브 이미지 1' },
      { id: 's10', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 30, label: '서브 이미지 2' },
      { id: 's11', type: 'spacer', height: 60, bgColor: '#ffffff' },
      { id: 's12', type: 'text', text: 'DETAILS', fontSize: 12, fontWeight: 'bold', color: '#999999', textAlign: 'center', bgColor: '#ffffff', paddingV: 10, paddingH: 20 },
      { id: 's13', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 20, label: '디테일 이미지' },
      { id: 's14', type: 'spacer', height: 40, bgColor: '#f8f8f8' },
    ]
  },
  {
    id: 'tpl_premium',
    name: '프리미엄 다크',
    description: '고급스러운 다크 테마의 프리미엄 레이아웃',
    thumbnail: null,
    category: '범용',
    sections: [
      { id: 's1', type: 'spacer', height: 50, bgColor: '#111111' },
      { id: 's2', type: 'text', text: 'PREMIUM COLLECTION', fontSize: 11, fontWeight: 'bold', color: '#c9a96e', textAlign: 'center', bgColor: '#111111', paddingV: 10, paddingH: 20 },
      { id: 's3', type: 'text', text: '상품명', fontSize: 34, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', bgColor: '#111111', paddingV: 10, paddingH: 20 },
      { id: 's4', type: 'text', text: '프리미엄 상품 소개 문구를 입력하세요', fontSize: 14, fontWeight: 'normal', color: '#aaaaaa', textAlign: 'center', bgColor: '#111111', paddingV: 15, paddingH: 40 },
      { id: 's5', type: 'spacer', height: 50, bgColor: '#111111' },
      { id: 's6', type: 'image', imageUrl: '', bgColor: '#111111', padding: 0, label: '메인 이미지' },
      { id: 's7', type: 'spacer', height: 2, bgColor: '#c9a96e' },
      { id: 's8', type: 'image', imageUrl: '', bgColor: '#1a1a1a', padding: 0, label: '상품 이미지 2' },
      { id: 's9', type: 'spacer', height: 50, bgColor: '#111111' },
      { id: 's10', type: 'text', text: 'CRAFTSMANSHIP', fontSize: 11, fontWeight: 'bold', color: '#c9a96e', textAlign: 'center', bgColor: '#111111', paddingV: 10, paddingH: 20 },
      { id: 's11', type: 'text', text: '장인정신으로 만든 제품', fontSize: 26, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', bgColor: '#111111', paddingV: 15, paddingH: 20 },
      { id: 's12', type: 'image', imageUrl: '', bgColor: '#111111', padding: 20, label: '디테일 이미지 1' },
      { id: 's13', type: 'image', imageUrl: '', bgColor: '#111111', padding: 20, label: '디테일 이미지 2' },
      { id: 's14', type: 'spacer', height: 2, bgColor: '#c9a96e' },
      { id: 's15', type: 'text', text: '배송 / 교환 안내', fontSize: 14, fontWeight: 'bold', color: '#cccccc', textAlign: 'center', bgColor: '#111111', paddingV: 25, paddingH: 20 },
      { id: 's16', type: 'text', text: '• 주문 후 1~3 영업일 내 발송\n• 교환/반품 수령 후 7일 이내', fontSize: 13, fontWeight: 'normal', color: '#888888', textAlign: 'center', bgColor: '#111111', paddingV: 15, paddingH: 30 },
      { id: 's17', type: 'spacer', height: 50, bgColor: '#111111' },
    ]
  }
];

// Supabase 클라이언트 초기화
function initSupabase() {
  if (!CONFIG.SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = supabase;
    return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Supabase 초기화 실패:', e);
    return null;
  }
}

function saveSettings(key, openaiKey) {
  CONFIG.SUPABASE_ANON_KEY = key;
  CONFIG.OPENAI_API_KEY = openaiKey || '';
  localStorage.setItem('dc_supabase_key', key);
  if (openaiKey) localStorage.setItem('dc_openai_key', openaiKey);
}

function generateId() {
  return 'sec_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
