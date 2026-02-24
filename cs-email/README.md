# C/S 요청사항 일일 메일 (customerservice-daily-email)

Cloud Run 서비스. 매일 07시 Cloud Scheduler로 `/run` 호출 시 C/S 메일 발송.

## 로컬에서 배포 (PowerShell)

1. **Cloud Build API 활성화** (최초 1회)
   ```powershell
   gcloud services enable cloudbuild.googleapis.com --project=greentree-bta
   ```

2. **프로젝트 루트에서 배포**
   ```powershell
   cd c:\MyProject\BTA\bta_school
   gcloud run deploy customerservice-daily-email `
     --source=cs-email `
     --region=asia-northeast3 `
     --platform=managed `
     --no-allow-unauthenticated `
     --set-env-vars="GCLOUD_PROJECT=greentree-bta,RESEND_FROM_EMAIL=noreply@treegreen.co.kr,FUNCTION_TARGET=customerservice-daily-email,LOG_EXECUTION_ID=true" `
     --project=greentree-bta
   ```
   - `--no-allow-unauthenticated`: 인증 필요 (Cloud Scheduler가 서비스 계정으로 호출)
   - 배포 후 콘솔에서 **RESEND_API_KEY**, **FIREBASE_CONFIG** 환경 변수 추가

3. **콘솔에서 추가 설정**
   - Cloud Run → customerservice-daily-email → 변수 및 보안 비밀
   - `RESEND_API_KEY`: Resend API 키
   - `FIREBASE_CONFIG`: `{"projectId":"greentree-bta","storageBucket":"greentree-bta.firebasestorage.app"}` (필요 시 apiKey 등 추가)

## 엔드포인트

- `GET /` : 헬스 체크
- `GET /run` 또는 `POST /run` : 메일 발송 실행

## Cloud Scheduler (매일 07시 실행)

이 서비스는 **Cloud Function이 아니라 Cloud Run 서비스**이므로, 스케줄러에서 **대상: HTTP** 로 설정해야 합니다.

1. **Cloud Scheduler API** 사용 설정 (이미지에서 "사용" 클릭)
2. **작업 만들기** (Cloud Scheduler → 작업 만들기)
   - **이름**: `cs-daily-email-job` (원하는 이름)
   - **리전**: `asia-northeast3` (서울) — Cloud Run 서비스와 같은 리전 권장
   - **빈도**: `0 7 * * *` (매일 오전 7시, KST 기준이면 22:00 UTC 등으로 조정 가능)
   - **대상 유형**: **HTTP** 선택 (Cloud Function 아님)
   - **URL**: `https://customerservice-daily-email-242686436668.asia-northeast3.run.app/run`
   - **HTTP 메서드**: GET 또는 POST
   - **인증 헤더**: **OIDC 토큰 추가** 선택 후, 서비스 계정을 선택 (해당 계정에 **Cloud Run 호출자** 역할 부여)
3. **저장** 후 테스트 실행으로 동작 확인

또는 프로젝트 루트에서 스크립트 실행:
```powershell
cd c:\MyProject\BTA\bta_school\cs-email
.\setup-scheduler.ps1
```

**이미 생성된 작업 (자동 설정됨):**
- 작업 이름: `cs-daily-email-job`
- 일정: 매일 07:00 (Asia/Seoul)
- 대상: `GET https://customerservice-daily-email-.../run` (OIDC 인증)
