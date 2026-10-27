# Mini Local Diary - 배포 및 사용자 가이드 (User Guide)

본 가이드는 **판매자(웹사이트 디지털 다운로드 상품 등록)**를 위한 배포 패키징 안내와 **구매자(OS별 사용자)**를 위한 실행/사용법을 정리한 문서입니다.

---

## 1. 판매자 가이드 (Seller Guide)

### 어떤 파일을 웹사이트에 업로드해야 하나요?

웹사이트(Gumroad, Lemon Squeezy, Paddle, Shopify, 자체 웹사이트 등)에서 5달러 디지털 다운로드 상품으로 등록할 때 **두 가지 패키징 방식** 중 선택하여 업로드할 수 있습니다.

#### 방식 A. 단일 올인원 패키지 (가장 간편한 방법, 약 5.8MB)
빌드 후 자동 생성되는 `dist/mini-local-diary-release.zip` 파일을 상품 다운로드 파일 1개로 업로드합니다.
- **장점**: 파일 1개만 관리하면 되며, 구매자가 하나의 압축 파일로 Windows, Mac, Linux 어디서든 실행 가능합니다.

#### 방식 B. OS별 분리 패키지 (구매자 경험에 최적화된 추천 방식)
각 OS 사용자가 자기 운영체제에 맞는 파일만 다운로드할 수 있도록 3개로 나누어 등록합니다.

| 패키지 파일명 | 포함 파일 구성 | 대상 사용자 |
| :--- | :--- | :--- |
| **`mini-local-diary-windows.zip`** | • `mini-local-diary-win_x64.exe`<br>• `resources.neu`<br>• `storage/` 폴더 (diaries, assets) | Windows 10 / 11 (64bit) |
| **`mini-local-diary-macos.zip`** | • `mini-local-diary-mac_universal`<br>• `resources.neu`<br>• `storage/` 폴더 (diaries, assets) | Apple Silicon (M1/M2/M3/M4) 및 Intel Mac |
| **`mini-local-diary-linux.zip`** | • `mini-local-diary-linux_x64`<br>• `resources.neu`<br>• `storage/` 폴더 (diaries, assets) | Ubuntu, Debian, Fedora 등 Linux |

> **중요 (핵심 원리)**:
> Neutralinojs 앱은 **실행 바이너리 파일**과 UI 리소스인 **`resources.neu`**, 데이터 디렉터리인 **`storage/`** 가 **반드시 동일한 폴더 안에 위치**해야 정상 작동합니다.

---

## 2. 구매자 / 사용자 가이드 (Buyer / End-User Guide)

Mini Local Diary는 복잡한 설치 마법사나 클라우드 가입이 필요 없는 **오프라인 무설치 포터블(Portable) 앱**입니다. 폴더를 USB나 외장 드라이브에 넣어 다니며 어디서든 바로 사용할 수 있습니다.

---

###  Windows 사용자 (Windows 10 / 11)

1. 다운로드받은 ZIP 파일의 압축을 원하는 폴더(예: `C:\MiniLocalDiary` 또는 바탕화면)에 풉니다.
2. **`mini-local-diary-win_x64.exe`** 파일을 더블 클릭하여 실행합니다.

> **처음 실행 시 "Windows의 PC 보호" (SmartScreen) 팝업이 뜨는 경우:**
> - 오픈소스 독립 소프트웨어 특성상 코드서명 인증서가 없을 때 표시되는 정상적인 알림입니다.
> - **[추가 정보]** 클릭 ➔ **[실행]** 버튼을 클릭하시면 즉시 앱이 열립니다.

---

### 🍏 macOS 사용자 (Apple Silicon M1/M2/M3/M4 & Intel Mac)

1. 다운로드받은 ZIP 파일의 압축을 풉니다.
2. **`mini-local-diary-mac_universal`** 파일을 실행합니다. (또는 터미널을 사용하는 경우 아래 절차 진행)

> **"확인되지 않은 개발자가 배포했기 때문에 열 수 없습니다" 안내가 뜨는 경우:**
> 1. 해당 실행 파일을 **마우스 우클릭(또는 Control + 클릭)** ➔ **[열기]**를 선택합니다.
> 2. 확인 창에서 **[열기]**를 한 번 더 클릭하면 이후부터는 더블 클릭으로 바로 열립니다.
> 
> *터미널로 실행 권한을 줄 때:*
> ```bash
> chmod +x mini-local-diary-mac_universal
> ./mini-local-diary-mac_universal
> ```

---

### 🐧 Linux 사용자 (Ubuntu, Debian, Fedora, Arch 등)

1. 다운로드받은 ZIP 파일의 압축을 풉니다.
2. 터미널을 열고 압축을 푼 디렉터리로 이동한 뒤 실행 권한을 부여하고 실행합니다:
   ```bash
   chmod +x mini-local-diary-linux_x64
   ./mini-local-diary-linux_x64
   ```

> **참고 (필수 라이브러리)**:
> 대부분의 최신 리눅스 배포판에는 기본 포함되어 있으나, 실행 시 `libwebkit2gtk` 관련 메시지가 출력되는 경우 아래 명령어로 설치할 수 있습니다:
> - **Ubuntu/Debian**: `sudo apt install libwebkit2gtk-4.1-0`
> - **Fedora**: `sudo dnf install webkit2gtk4.1`
> - **Arch Linux**: `sudo pacman -S webkit2gtk-4.1`

---

## 3. 데이터 관리 및 백업 방법

- **모든 일기 본문**: `storage/diaries/YYYY-MM-DD.md` 표준 마크다운 파일로 저장됩니다.
- **모든 첨부 이미지**: `storage/assets/` 폴더에 원본 그대로 보관됩니다.
- **백업 및 기기 이동**: `storage/` 폴더 전체를 복사하여 백업하거나 새 컴퓨터의 프로그램 폴더로 옮기기만 하면 모든 일기와 사진이 그대로 유지됩니다.
