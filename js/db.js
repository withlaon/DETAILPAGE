// =============================================
// Supabase DB & Storage 연동 모듈
// =============================================

let _supabase = null;

function getClient() {
  if (!_supabase) {
    _supabase = initSupabase();
  }
  return _supabase;
}

function resetClient() {
  _supabase = null;
}

// ── 공통 유틸 ─────────────────────────────────

/**
 * 주어진 Promise에 타임아웃(ms)을 적용.
 * Supabase 프리티어 콜드스타트(약 5~15초) 대응.
 */
function withTimeout(promise, ms = 20000, label = '요청') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} 시간이 초과되었습니다 (${ms / 1000}초). 잠시 후 다시 시도해주세요.`)),
      ms
    );
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); }
    );
  });
}

// ── 페이지 CRUD ───────────────────────────────

async function fetchAllPages() {
  const sb = getClient();
  if (!sb) throw new Error('Supabase 연결 설정이 필요합니다.');

  const query = sb
    .from(CONFIG.TABLE_NAME)
    .select('id, title, category, sections, thumbnail_url, created_at, updated_at')
    .order('created_at', { ascending: false });

  const { data, error } = await withTimeout(query, 20000, '데이터 불러오기');
  if (error) throw new Error(error.message || '데이터베이스 오류가 발생했습니다.');
  return data || [];
}

async function fetchPageById(id) {
  const sb = getClient();
  if (!sb) throw new Error('Supabase 연결 설정이 필요합니다.');
  const { data, error } = await sb
    .from(CONFIG.TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function savePage_db(pageData) {
  const sb = getClient();
  if (!sb) throw new Error('Supabase 연결 설정이 필요합니다.');
  
  const payload = {
    title: pageData.title,
    category: pageData.category,
    sections: pageData.sections,
    thumbnail_url: pageData.thumbnail_url || null,
    updated_at: new Date().toISOString(),
  };

  if (pageData.id) {
    const { data, error } = await sb
      .from(CONFIG.TABLE_NAME)
      .update(payload)
      .eq('id', pageData.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    payload.created_at = new Date().toISOString();
    const { data, error } = await sb
      .from(CONFIG.TABLE_NAME)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

async function deletePage(id) {
  const sb = getClient();
  if (!sb) throw new Error('Supabase 연결 설정이 필요합니다.');
  const { error } = await sb
    .from(CONFIG.TABLE_NAME)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Storage 이미지 업로드 ─────────────────────

async function uploadImage(file, folder = 'uploads') {
  const sb = getClient();
  if (!sb) throw new Error('Supabase 연결 설정이 필요합니다.');

  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;

  const { data, error } = await sb.storage
    .from(CONFIG.STORAGE_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = sb.storage
    .from(CONFIG.STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

async function uploadThumbnail(blob) {
  const sb = getClient();
  if (!sb) return null;

  const fileName = `thumbnails/${Date.now()}.jpg`;
  const { data, error } = await sb.storage
    .from(CONFIG.STORAGE_BUCKET)
    .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) return null;

  const { data: urlData } = sb.storage
    .from(CONFIG.STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
