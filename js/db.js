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

// ── 페이지 CRUD ───────────────────────────────

async function fetchAllPages() {
  const sb = getClient();
  if (!sb) throw new Error('Supabase 연결 설정이 필요합니다.');
  const { data, error } = await sb
    .from(CONFIG.TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
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
