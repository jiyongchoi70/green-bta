# Firebase Hosting 배포 가이드

## 방법 1: 정적 사이트로 변환하여 배포 (권장)

현재 Flask 애플리케이션은 대부분 클라이언트 사이드에서 작동하므로, 정적 파일로 변환하여 배포할 수 있습니다.

### 1단계: 정적 파일 빌드

```bash
python build_static.py
```

이 명령어는 `public` 폴더에 모든 HTML 파일을 생성합니다.

### 2단계: Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 3단계: Firebase 로그인

```bash
firebase login
```

### 4단계: Firebase 프로젝트 초기화 (이미 완료됨)

```bash
firebase init hosting
```

### 5단계: 배포

```bash
firebase deploy --only hosting
```

## 방법 2: Firebase Hosting + Cloud Run (고급)

Flask 서버를 Cloud Run에 배포하고 Firebase Hosting에서 프록시하는 방법입니다.

### 1단계: Cloud Run에 Flask 앱 배포

```bash
gcloud run deploy bta-app --source . --region asia-northeast3
```

### 2단계: firebase.json 수정

```json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "bta-app",
          "region": "asia-northeast3"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 주의사항

1. **정적 파일 배포 시**: 
   - 서버 사이드 렌더링이 없으므로 모든 페이지가 미리 생성되어야 합니다.
   - 동적 라우팅은 클라이언트 사이드에서 처리해야 합니다.

2. **Firebase Authentication**: 
   - 클라이언트 사이드에서 작동하므로 정적 배포에서도 정상 작동합니다.

3. **Firebase 설정**: 
   - `firebase-config.json`의 정보가 HTML에 포함되므로 보안에 주의하세요.
   - API 키는 공개되어도 괜찮지만, Firebase 보안 규칙을 설정하세요.

## 배포 후 확인

배포가 완료되면 다음 URL에서 확인할 수 있습니다:
- `https://greentree-bta.web.app`
- `https://greentree-bta.firebaseapp.com`
