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
    description: '히어로컷 + 홍보문구 + 이미지 배열 (모든 카테고리 공용)',
    thumbnail: null,
    category: '범용',
    sections: [
      // ① 대표컷 — 3:4 비율 + 하단 다크 그라데이션 + 흰색 텍스트
      { id: 's1', type: 'hero',
        imageUrl: '', bgColor: '#ffffff', padding: 16, radius: 10,
        subText: '일상에 특별함을 더하다',
        brandText: 'Withlaon',
        textColor: '#ffffff', gradStop: 42, gradColor: 'rgba(109,40,217,0.55)',
        label: '대표 컷 (3:4 비율)' },

      // ② 홍보문구 — subText 단일 필드, 진한 회색
      { id: 's2', type: 'promo',
        mainText: '', subText: '',
        subFontSize: 16,
        subColor: '#444444', lineColor: '#cccccc',
        textAlign: 'center', bgColor: '#ffffff', paddingV: 50, paddingH: 40 },

      // ③ 이미지 1장 — 여백
      { id: 's3', type: 'image',
        imageUrl: '', bgColor: '#ffffff', padding: 20, label: '상품 이미지 1' },

      // ④ 이미지 2장 — 2단 그리드 + 여백
      { id: 's4', type: 'grid2',
        imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 8, padding: 20,
        label1: '상품 이미지 2', label2: '상품 이미지 3' },

      // ⑤ 이미지 1장
      { id: 's5', type: 'image',
        imageUrl: '', bgColor: '#ffffff', padding: 20, label: '모델 착용샷 1' },

      // ⑥ 이미지 2장
      { id: 's6', type: 'grid2',
        imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 8, padding: 20,
        label1: '모델 착용샷 2', label2: '모델 착용샷 3' },

      // ⑦ 이미지 1장
      { id: 's7', type: 'image',
        imageUrl: '', bgColor: '#ffffff', padding: 20, label: '모델 착용샷 4' },

      // ⑧ 이미지 2장
      { id: 's8', type: 'grid2',
        imageUrl1: '', imageUrl2: '', bgColor: '#ffffff', gap: 8, padding: 20,
        label1: '디테일 클로즈업 1', label2: '디테일 클로즈업 2' },

      // ⑨ 이미지 1장
      { id: 's9', type: 'image',
        imageUrl: '', bgColor: '#ffffff', padding: 20, label: '상품 내부/기능 컷' },

      // 사이즈 & 배송
      { id: 's10', type: 'spacer', height: 8, bgColor: '#f5f5f5' },
      { id: 's11', type: 'image',
        imageUrl: '', bgColor: '#f5f5f5', padding: 20, label: '사이즈 정보 이미지' },
      { id: 's12', type: 'spacer', height: 8, bgColor: '#f5f5f5' },
      { id: 's13', type: 'text',
        text: '[ 주문 및 배송 안내 ]\n\n• 주문 후 1~3 영업일 이내 발송됩니다.\n• 제주·도서산간 지역은 추가 배송비가 발생할 수 있습니다.\n\n[ 교환 및 반품 안내 ]\n\n• 수령 후 7일 이내 교환·반품 가능합니다.\n• 착용·세탁 후 교환·반품이 불가합니다.\n• 색상은 모니터 환경에 따라 다소 차이가 있을 수 있습니다.',
        fontSize: 13, fontWeight: 'normal', color: '#888888', textAlign: 'left',
        bgColor: '#f5f5f5', paddingV: 30, paddingH: 40 },
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
