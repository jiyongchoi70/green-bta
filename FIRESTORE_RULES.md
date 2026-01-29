# Firestore 보안 규칙 설정 가이드

## 문제 해결

사용자 관리 화면 또는 반배정 화면에서 "Missing or insufficient permissions" 오류가 발생하는 경우, Firestore 보안 규칙을 설정해야 합니다.

## 설정 방법

### 1. Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 `greentree-bta` 선택

### 2. Firestore Database로 이동
1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. 상단 탭에서 **"규칙"** 탭 클릭

### 3. 보안 규칙 추가

다음 규칙을 추가하거나 기존 규칙을 수정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // bta_users 컬렉션 규칙
    match /bta_users/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // bta_lookup_type 컬렉션 규칙
    match /bta_lookup_type/{document=**} {
      allow read: if request.auth != null;
    }
    
    // bta_lookup_value 컬렉션 규칙
    match /bta_lookup_value/{document=**} {
      allow read: if request.auth != null;
    }
    
    // bta_class 컬렉션 규칙
    match /bta_class/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // bta_class_students 컬렉션 규칙
    match /bta_class_students/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. 규칙 게시
1. **"게시"** 버튼 클릭
2. 규칙이 적용되는데 몇 초 정도 소요될 수 있습니다.

## 규칙 설명

- `request.auth != null`: 인증된 사용자만 접근 가능
- `read`: 조회 권한
- `write`: 생성, 수정, 삭제 권한

## 참고

- 개발 환경에서는 모든 사용자에게 읽기/쓰기 권한을 부여할 수 있지만, 프로덕션 환경에서는 더 세밀한 권한 제어가 필요합니다.
- 현재 규칙은 인증된 모든 사용자가 모든 데이터를 읽고 쓸 수 있도록 설정되어 있습니다.
