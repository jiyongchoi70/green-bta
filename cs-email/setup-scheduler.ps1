# Cloud Scheduler: 매일 07:00 KST에 customerservice-daily-email /run 호출
# 프로젝트: greentree-bta, 리전: asia-northeast3

$Project = "greentree-bta"
$Location = "asia-northeast3"
$JobName = "cs-daily-email-job"
$Uri = "https://customerservice-daily-email-242686436668.asia-northeast3.run.app/run"
$ServiceAccount = "242686436668-compute@developer.gserviceaccount.com"
$Audience = "https://customerservice-daily-email-242686436668.asia-northeast3.run.app"

Write-Host "1. Cloud Scheduler API 사용 설정..."
gcloud services enable cloudscheduler.googleapis.com --project=$Project

Write-Host "2. Cloud Run 서비스에 Invoker 권한 부여..."
gcloud run services add-iam-policy-binding customerservice-daily-email `
  --region=$Location `
  --member="serviceAccount:$ServiceAccount" `
  --role="roles/run.invoker" `
  --project=$Project

Write-Host "3. 스케줄 작업 생성 (매일 07:00 KST)..."
gcloud scheduler jobs create http $JobName `
  --location=$Location `
  --schedule="0 7 * * *" `
  --time-zone="Asia/Seoul" `
  --uri=$Uri `
  --http-method=GET `
  --oidc-service-account-email=$ServiceAccount `
  --oidc-token-audience=$Audience `
  --project=$Project `
  --description="C/S 요청사항 일일 메일 발송 (매일 07시)"

Write-Host "완료. Cloud Scheduler에서 작업 '$JobName' 확인 후 '지금 실행'으로 테스트해 보세요."
