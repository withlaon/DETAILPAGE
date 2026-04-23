// =============================================
// Supabase 설정
// =============================================
const CONFIG = {
  SUPABASE_URL: 'https://avhjwqlajlcahxpdyzsw.supabase.co',
  SUPABASE_ANON_KEY: localStorage.getItem('dc_supabase_key') || '',
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
    description: '이미지 중심의 표준 상품 상세페이지',
    thumbnail: null,
    category: '범용',
    sections: [
      { id: 's1', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '메인 상품 이미지' },
      { id: 's2', type: 'text', text: '✦ 상품명을 입력하세요 ✦', fontSize: 26, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', bgColor: '#ffffff', paddingV: 30, paddingH: 20 },
      { id: 's3', type: 'text', text: '상품에 대한 간단한 설명을 입력하세요.', fontSize: 15, fontWeight: 'normal', color: '#555555', textAlign: 'center', bgColor: '#ffffff', paddingV: 10, paddingH: 40 },
      { id: 's4', type: 'spacer', height: 20, bgColor: '#f5f5f5' },
      { id: 's5', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '상품 이미지 2' },
      { id: 's6', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '상품 이미지 3' },
      { id: 's7', type: 'spacer', height: 20, bgColor: '#f5f5f5' },
      { id: 's8', type: 'text', text: '[ 상품 특징 ]', fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', bgColor: '#ffffff', paddingV: 30, paddingH: 20 },
      { id: 's9', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '상세 이미지 1' },
      { id: 's10', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '상세 이미지 2' },
      { id: 's11', type: 'spacer', height: 20, bgColor: '#f5f5f5' },
      { id: 's12', type: 'text', text: '[ 소재 & 사이즈 ]', fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', bgColor: '#ffffff', paddingV: 30, paddingH: 20 },
      { id: 's13', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '사이즈 이미지' },
      { id: 's14', type: 'text', text: '소재 및 세부 스펙을 입력하세요.', fontSize: 14, fontWeight: 'normal', color: '#666666', textAlign: 'center', bgColor: '#ffffff', paddingV: 20, paddingH: 30 },
      { id: 's15', type: 'spacer', height: 20, bgColor: '#f5f5f5' },
      { id: 's16', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '라이프스타일 이미지 1' },
      { id: 's17', type: 'image', imageUrl: '', bgColor: '#ffffff', padding: 0, label: '라이프스타일 이미지 2' },
      { id: 's18', type: 'spacer', height: 30, bgColor: '#f5f5f5' },
      { id: 's19', type: 'text', text: '주문 및 배송 안내', fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', bgColor: '#fafafa', paddingV: 20, paddingH: 20 },
      { id: 's20', type: 'text', text: '• 주문 후 1~3 영업일 이내 발송됩니다.\n• 교환/반품은 수령 후 7일 이내 가능합니다.\n• 색상은 모니터 환경에 따라 다소 차이가 있을 수 있습니다.', fontSize: 13, fontWeight: 'normal', color: '#888888', textAlign: 'center', bgColor: '#fafafa', paddingV: 15, paddingH: 30 },
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
