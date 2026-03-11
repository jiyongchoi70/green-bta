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

### 3단계: Firebase Authentication 관리자 역할 부여 (사용자 삭제 시 Auth 삭제용)

사용자 관리 화면에서 삭제 시 **Firebase Authentication** 계정까지 삭제하려면, Cloud Run이 사용하는 **서비스 계정**에 Firebase Auth 관리 권한이 있어야 합니다.

**방법 A – Google Cloud 콘솔에서 부여**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속 후 프로젝트 **greentree-bta** 선택  
2. 왼쪽 메뉴 **IAM 및 관리자** → **IAM**  
3. Cloud Run 서비스(bta-app)가 사용하는 서비스 계정 찾기  
   - 보통 `프로젝트번호-compute@developer.gserviceaccount.com` (기본 Compute Engine 서비스 계정)  
   - 또는 Cloud Run 서비스 상세 페이지 **보안** 탭에서 “서비스 계정” 확인  
4. 해당 계정 행의 **연필(편집)** 클릭  
5. **다른 역할 추가** → **Firebase Authentication Admin** 검색 후 선택  
6. **저장**

**방법 B – gcloud 명령어**

```bash
# 1) Cloud Run 서비스 계정 이메일 확인 (보통 아래와 같음)
# 2) 역할 부여 (프로젝트번호는 실제 숫자로 변경)
gcloud projects add-iam-policy-binding greentree-bta \
  --member="serviceAccount:프로젝트번호-compute@developer.gserviceaccount.com" \
  --role="roles/firebaseauth.admin"
```

프로젝트 번호는 **Firebase 콘솔** → 프로젝트 설정(톱니바퀴) → **일반** 탭에서 확인할 수 있습니다.

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
