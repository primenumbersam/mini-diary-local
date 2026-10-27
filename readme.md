# Mini Local Diary

Mini Local Diary는 개인 데이터의 완전한 소유권과 프라이버시를 보장하는 Minimal Local Markdown Diary Desktop App입니다. 
클라우드 동기화나 외부 데이터베이스 서버 없이, 로컬 디렉터리에 평문 마크다운(.md) 파일과 이미지 파일을 구조화하여 보관합니다.

### Features

- **Lightweight Desktop App**: Wrapper는 Neutralinojs Framework을 활용하여 실행 바이너리 크기가 작고 시스템 리소스 점유율이 낮습니다.
- **로컬 파일 직접 제어**: 모든 일기 데이터는 표준 Markdown 파일(`YYYY-MM-DD.md`)로 저장되며, 사용자가 직접 텍스트 에디터로 편집하거나 백업할 수 있습니다.
- **로컬 미디어 첨부 지원**: 일기 본문과 동일한 디렉터리(`assets/`)에 이미지를 저장하고 상대 경로로 참조합니다.
- **Raw Markdown 작성 및 분할 렌더링**: WYSIWYG 방식이 아닌 순수 텍스트 기반 Markdown 입력 환경과 실시간 미리보기(Live Preview) 모드를 지원합니다.
- **크로스 플랫폼 및 이식성(Portability)**: 폴더 통째로 USB나 외장 드라이브에 복사하여 Windows, Linux, macOS 환경 어디서든 데이터를 즉시 유지할 수 있습니다.

### File Structure

```text
mini-local-diary/
├── neutralino.config.json
├── resources/
│   ├── index.html
│   ├── styles/
│   │   └── main.css
│   ├── js/
│   │   ├── neutralino.js
│   │   ├── marked.min.js
│   │   └── app.js
│   └── icons/
│       └── appIcon.png
├── storage/
│   ├── diaries/
│   │   ├── 2026-08-22.md
│   │   └── 2026-08-23.md
│   └── assets/
│       └── sample_photo.jpg
└── bin/
    ├── mini-local-diary-win_x64.exe
    ├── mini-local-diary-linux_x64
    └── mini-local-diary-mac_x64
```

## Implementation Plan

CSS UI artstyle: 스위스 스타일 (International Typographic Style), 모듈러 그리드 시스템, 볼드한 산세리프 타이포그래피, 흑백 중심에 포인트 컬러(red, blue) 2개만 제한적으로 사용

1. 기반 환경 구성 및 디렉터리 파이프라인
- Neutralinojs 프로젝트 뼈대 초기화 및 `neutralino.config.json` 내 파일 시스템 권한(`filesystem.*`, `os.*`) 설정
- 경량 Markdown 파서 라이브러리(`marked.js`) 로컬 번들링 (`resources/js/marked.min.js`)
- 앱 구동 시 `storage/diaries` 및 `storage/assets` 디렉터리 존재 여부 검증 및 자동 생성 로직 구현

2. 데이터 입출력(I/O) 및 CRUD 모듈 설계
- **Read**: `storage/diaries/` 폴더 내 `.md` 파일 목록을 비동기로 스캔하여 날짜 역순(Descending Order) 정렬 리스트 렌더링
- **Create / Update**: 사용자 지정 날짜 기반의 파일명(`YYYY-MM-DD.md`)으로 Raw Markdown 텍스트를 `Neutralino.filesystem.writeFile()`로 직접 디스크에 동기화
- **Delete**: `Neutralino.filesystem.removeFile()`을 호출하여 특정 일기 파일 영구 삭제

3. 사용자 인터페이스(UI) 구성
- 좌측 사이드바: 연/월별 일기 목록 네비게이션 및 신규 작성 버튼
- 중앙 편집 영역: 순수 Plain Text 기반 `<textarea>` Raw Markdown 에디터 (탭 들여쓰기, 단축키 처리)
- 우측 렌더링 뷰: `marked.js`를 통해 변환된 HTML 렌더링 영역 (단일 에디터 모드 / 분할 뷰 토글 지원)

4. 로컬 미디어 자산 관리
- 에디터 내 이미지 드래그 앤 드롭 또는 파일 선택 시 `Neutralino.filesystem.writeBinaryFile()`을 통해 `storage/assets/` 폴더로 자동 복사
- 복사 완료 시 본문 커서 위치에 `![설명](../storage/assets/파일명.jpg)` 상대 경로 자동 삽입

5. 배포 및 이식성 검증
- 빌드 결과물의 상대 경로 참조 구조 검증 (`NL_PATH` 글로벌 변수를 기반으로 실행 바이너리 기준 절대/상대 경로 동적 매핑)
- Lubuntu Linux, Windows, macOS 환경별 단일 압축 파일 패키징 및 구동 무결성 테스트
