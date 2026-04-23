# DetailCraft — 쇼핑몰 상세페이지 제작 웹앱

HTML + Tailwind CSS + JavaScript로 제작된 쇼핑몰 상품 상세페이지 제작 도구입니다.

## 주요 기능

- **템플릿 기반 에디터**: 이미지, 텍스트, 여백 섹션으로 구성된 상세페이지 제작
- **드래그 & 드롭 섹션 정렬**: 섹션 순서를 자유롭게 변경
- **Supabase 저장/불러오기**: 작업 결과를 클라우드에 저장, 편집, 삭제
- **JPEG 다운로드**: 완성된 상세페이지를 고품질 JPEG로 다운로드
- **AI 템플릿 생성**: 카테고리·스타일 선택으로 자동 템플릿 생성
- **상품 카테고리**: 가방, 모자, 의류, 양산 (추가 가능)

## 기술 스택

| 항목 | 기술 |
|------|------|
| UI | HTML5, Tailwind CSS (CDN) |
| 로직 | Vanilla JavaScript (ES6+) |
| DB/Storage | Supabase (PostgreSQL + Storage) |
| 이미지 캡처 | html2canvas |
| 정렬 | SortableJS |
| 폰트 | Noto Sans KR (Google Fonts) |

## 시작하기

### 1. Supabase 프로젝트 설정

1. [Supabase 대시보드](https://supabase.com/dashboard/project/avhjwqlajlcahxpdyzsw)에 접속
2. **SQL Editor**에서 `setup.sql` 파일 내용을 붙여넣고 실행
3. **Storage** → **New bucket** 생성:
   - 이름: `detail-images`
   - Public bucket: **체크**
   - File size limit: `10MB`
4. **Settings → API** → `anon public` 키 복사

### 2. 앱 실행

```bash
# 로컬 서버 실행 (Python)
python -m http.server 8080

# 또는 VS Code Live Server 사용
```

브라우저에서 `http://localhost:8080` 접속

### 3. API 키 설정

1. 우측 상단 ⚙️ 설정 버튼 클릭
2. **Supabase Anon Key** 입력
3. 저장

## 파일 구조

```
DETAILPAGE/
├── index.html          # 대시보드 (페이지 목록/관리)
├── editor.html         # 상세페이지 에디터
├── setup.sql           # Supabase 초기 설정 SQL
├── js/
│   ├── config.js       # 설정, 템플릿 정의
│   ├── db.js           # Supabase DB/Storage 연동
│   ├── app.js          # 대시보드 로직
│   ├── editor.js       # 에디터 로직
│   └── utils.js        # 공통 유틸리티
└── assets/             # 로컬 에셋
```

## 사용 방법

### 새 상세페이지 만들기

1. 대시보드에서 **새 상세페이지** 버튼 클릭
2. 제목, 카테고리 입력
3. 템플릿 선택 (또는 AI로 자동 생성)
4. 에디터 열기

### 에디터 사용

- **왼쪽 패널**: 섹션 목록, 드래그로 순서 변경
- **가운데**: 실시간 미리보기
- **오른쪽**: 선택한 섹션의 속성 편집
- **상단 툴바**: 이미지/텍스트/여백 추가, 저장, JPEG 다운로드

### 섹션 타입

| 타입 | 설명 |
|------|------|
| 이미지 | 상품 사진 업로드 (Supabase Storage 또는 URL) |
| 텍스트 | 설명문, 제목, 안내 문구 |
| 여백 | 섹션 간 간격 조절 |

## 카테고리 추가 방법

`js/config.js` 상단의 `CATEGORIES` 배열에 추가:

```javascript
const CATEGORIES = ['가방', '모자', '의류', '양산', '신발', '액세서리'];
```

`index.html`의 카테고리 탭 버튼도 함께 추가해주세요.

## GitHub 배포

```bash
git init
git add .
git commit -m "feat: DetailCraft 초기 버전"
git remote add origin https://github.com/withlaon/DETAILPAGE.git
git branch -M main
git push -u origin main
```

## 라이선스

MIT License
