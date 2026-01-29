# 사용자 조회 모달 사용 가이드

## 개요
`user_search_modal.js`는 사용자 조회 및 선택 기능을 제공하는 공통 모달 컴포넌트입니다.
반배정, 학부모등록 등 여러 화면에서 재사용할 수 있습니다.

## 필수 요구사항

### 1. HTML 구조
다음 HTML 구조를 페이지에 포함해야 합니다:

```html
<!-- 사용자 조회 모달 -->
<div id="userSearchModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>사용자 조회</h3>
            <span class="close-button">&times;</span>
        </div>
        <div class="modal-body">
            <div class="search-fields">
                <input type="text" id="searchUserName" placeholder="성명">
                <input type="text" id="searchUserPhone" placeholder="전화번호">
                <select id="searchUserUserType">
                    <option value="">전체</option>
                </select>
                <select id="searchUserStudentStatus">
                    <option value="">전체</option>
                </select>
                <button id="searchUserSearchButton">조회</button>
            </div>
            <div id="userSearchGrid" style="height: 400px; width: 100%;"></div>
            <div class="modal-instruction">
                사용법: 체크박스를 선택한 후, 하단의 "저장" 버튼을 클릭하세요.
            </div>
        </div>
        <div class="modal-footer">
            <button id="selectUserConfirmButton">저장</button>
            <button id="closeUserSearchButton">닫기</button>
        </div>
    </div>
</div>
```

### 2. JavaScript 파일 포함
```html
<script src="{{ url_for('static', filename='user_search_modal.js') }}"></script>
<!-- 또는 정적 파일인 경우 -->
<script src="../../static/user_search_modal.js"></script>
```

### 3. 필수 전역 함수
- `getLookupValueList(db, codeGroup, date)`: 공통코드 조회 함수
- `getLookupValueName(db, codeGroup, code, date)`: 공통코드명 조회 함수
- `getCurrentDateYmd()`: 현재 날짜를 YYYYMMDD 형식으로 반환하는 함수

## 초기화 방법

### 기본 초기화 예제

```javascript
// 1. 공통코드 로드 후 초기화
function loadLookupLists() {
    const currentDate = getCurrentDateYmd();
    
    Promise.all([
        getLookupValueList(db, '130', currentDate), // 재학구분
        getLookupValueList(db, '110', currentDate)  // 사용자구분
    ]).then(function(results) {
        const studentStatusList = results[0] || [];
        const userTypeList = results[1] || [];
        
        // 2. 모달 초기화
        if (typeof UserSearchModal !== 'undefined') {
            UserSearchModal.init({
                title: '사용자 조회',                    // 모달 타이틀
                userTypeDefault: null,                   // 사용자구분 기본값 (null이면 수정 가능)
                userTypeDisabled: false,                 // 사용자구분 수정 불가 여부
                collectionName: 'bta_your_collection',   // 저장할 컬렉션명
                idFieldName: 'your_id_field',            // ID 필드명 (예: class_id, parent_id)
                getSelectedId: function() {              // 선택된 ID를 반환하는 함수
                    return selectedId; // 현재 선택된 ID 반환
                },
                loadDataCallback: function(id) {        // 저장 후 데이터 로드 콜백
                    loadYourData(id); // 저장 후 목록 새로고침
                },
                studentStatusList: studentStatusList,    // 재학구분 리스트
                userTypeList: userTypeList,              // 사용자구분 리스트
                db: db,                                  // Firestore 인스턴스
                getCurrentDateYmd: getCurrentDateYmd     // 날짜 함수
            });
        }
    });
}
```

## 설정 옵션

| 옵션 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | string | 예 | 모달 타이틀 |
| `userTypeDefault` | string\|null | 예 | 사용자구분 기본값 (예: '학생'). null이면 수정 가능 |
| `userTypeDisabled` | boolean | 예 | 사용자구분 수정 불가 여부 |
| `collectionName` | string | 예 | 저장할 Firestore 컬렉션명 |
| `idFieldName` | string | 예 | ID 필드명 (예: 'class_id', 'parent_id') |
| `getSelectedId` | function | 예 | 현재 선택된 ID를 반환하는 함수 |
| `loadDataCallback` | function | 예 | 저장 후 데이터 로드 콜백 함수 |
| `studentStatusList` | array | 예 | 재학구분 리스트 (공통코드) |
| `userTypeList` | array | 예 | 사용자구분 리스트 (공통코드) |
| `db` | object | 예 | Firestore 인스턴스 |
| `getCurrentDateYmd` | function | 예 | 현재 날짜를 YYYYMMDD 형식으로 반환하는 함수 |

## 사용 방법

### 모달 열기
```javascript
document.getElementById('addButton').addEventListener('click', function() {
    if (typeof UserSearchModal !== 'undefined') {
        UserSearchModal.open();
    } else {
        console.error('UserSearchModal이 로드되지 않았습니다.');
    }
});
```

### 모달 닫기
```javascript
// 자동으로 닫히지만, 필요시 수동으로 닫을 수 있음
if (typeof UserSearchModal !== 'undefined') {
    UserSearchModal.close();
}
```

## 실제 사용 예제

### 예제 1: 반배정 등록 (class_assignment.html)
```javascript
UserSearchModal.init({
    title: '사용자 조회(학부모, 신입생 제외)',
    userTypeDefault: null,              // 수정 가능
    userTypeDisabled: false,
    collectionName: 'bta_class_students',
    idFieldName: 'class_id',
    getSelectedId: function() { return selectedClassId; },
    loadDataCallback: loadStudentData,
    studentStatusList: studentStatusList,
    userTypeList: userTypeList,
    db: db,
    getCurrentDateYmd: getCurrentDateYmd
});
```

### 예제 2: 학부모 등록 (parent-registration.html)
```javascript
UserSearchModal.init({
    title: '사용자 조회',
    userTypeDefault: '학생',             // 학생으로 고정
    userTypeDisabled: true,              // 수정 불가
    collectionName: 'bta_parent_students',
    idFieldName: 'parent_id',
    getSelectedId: function() { return selectedParentId; },
    loadDataCallback: loadStudentData,
    studentStatusList: studentStatusList,
    userTypeList: userTypeList,
    db: db,
    getCurrentDateYmd: getCurrentDateYmd
});
```

## 데이터베이스 구조

### 저장되는 데이터 형식
모달에서 선택한 사용자는 다음 형식으로 저장됩니다:

```javascript
{
    [idFieldName]: "선택된_ID",  // 예: class_id 또는 parent_id
    userid: "사용자_ID"
}
```

### 중복 체크
모달은 자동으로 중복 등록을 체크합니다:
- 같은 `idFieldName`과 `userid` 조합이 이미 존재하면 "이미 등록된 사람입니다." 메시지 표시
- 중복이 아닌 경우에만 저장 진행

## 주의사항

1. **모달 HTML 구조**: 반드시 `id="userSearchModal"`을 사용해야 합니다.
2. **초기화 시점**: 공통코드 로드가 완료된 후 초기화해야 합니다.
3. **ID 선택 확인**: `getSelectedId()` 함수는 유효한 ID를 반환해야 합니다. 없으면 모달이 열리지 않습니다.
4. **학부모/신입생 제외**: 사용자구분에서 '120'(학부모), '150'(신입생)은 자동으로 제외됩니다.
5. **재학구분 기본값**: 기본적으로 '재학'이 선택됩니다.

## 문제 해결

### 모달이 열리지 않는 경우
- `UserSearchModal.init()`이 호출되었는지 확인
- `getSelectedId()`가 유효한 값을 반환하는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 선택이 안 되는 경우
- 그리드가 완전히 로드된 후 선택 시도
- 조회 버튼을 클릭하여 데이터를 먼저 로드

### 저장이 안 되는 경우
- 선택된 ID가 유효한지 확인
- 데이터베이스 권한 확인
- 브라우저 콘솔에서 오류 메시지 확인

## 추가 기능

### 커스터마이징
필요한 경우 `user_search_modal.js` 파일을 수정하여 다음 기능을 추가할 수 있습니다:
- 추가 검색 조건
- 그리드 컬럼 추가/수정
- 저장 전 추가 검증 로직
