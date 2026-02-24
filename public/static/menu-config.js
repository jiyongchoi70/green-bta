/**
 * 메뉴 설정 파일
 * 권한별 메뉴 표시를 위한 설정
 */

const MENU_CONFIG = {
    // 컬럼 정의 (권한별로 표시 여부 결정)
    columns: {
        '코치방': { userTypes: ['110', '130'] },
        '학생방': { userTypes: ['100', '130'] },
        '학부모방': { userTypes: ['120', '130'] },
        '관리자': { userTypes: ['130'] }
    },
    
    // 메뉴 항목 정의 (rowIndex로 행 위치 지정)
    menus: [
        // 첫 번째 행: 전달사항 (모든 권한에서 보이지만 URL이 다름)
        {
            label: '전달사항',
            column: '코치방',
            rowIndex: 0,
            links: {
                '110': './announcements/coach.html',
                '130': './announcements/system.html'
            },
            userTypes: ['110', '130']
        },
        {
            label: '전달사항',
            column: '학생방',
            rowIndex: 0,
            links: {
                '100': './announcements/student.html',
                '130': './announcements/system.html'
            },
            userTypes: ['100', '130']
        },
        {
            label: '전달사항',
            column: '학부모방',
            rowIndex: 0,
            links: {
                '120': './announcements/parent.html',
                '130': './announcements/system.html'
            },
            userTypes: ['120', '130']
        },
        {
            label: '전달사항',
            column: '관리자',
            rowIndex: 0,
            link: './announcements/system.html',
            userTypes: ['130']
        },
        
        // 두 번째 행
        {
            label: '과제제출확인',
            column: '코치방',
            rowIndex: 1,
            link: './menu/coach/student-select.html',
            userTypes: ['110', '130']
        },
        // 학생방 - 기록과제물 삭제됨
        {
            label: '과제제출확인',
            column: '학부모방',
            rowIndex: 1,
            link: './menu/parent/assignment-submit.html',
            userTypes: ['120', '130']
        },
        {
            label: '사용자',
            column: '관리자',
            rowIndex: 1,
            link: './menu/system/user.html',
            userTypes: ['130']
        },
        
        // 세 번째 행
        {
            label: '과제제출확인',
            column: '학생방',
            rowIndex: 1,
            link: './menu/student/assignment-submit.html',
            userTypes: ['100', '130']
        },
        {
            label: '반배정',
            column: '관리자',
            rowIndex: 2,
            link: './menu/system/event.html',
            userTypes: ['130']
        },
        
        // 네 번째 행
        {
            label: '학부모등록',
            column: '관리자',
            rowIndex: 3,
            link: './menu/system/parent-registration.html',
            userTypes: ['130']
        },
        
        // 다섯 번째 행
        {
            label: '과제목록',
            column: '관리자',
            rowIndex: 4,
            link: './menu/system/assignment-list.html',
            userTypes: ['130']
        },
        
        // 여섯 번째 행
        {
            label: '공통코드',
            column: '관리자',
            rowIndex: 5,
            link: './menu/system/common-code.html',
            userTypes: ['130']
        },
        // 일곱 번째 행
        {
            label: 'C/S 요청',
            column: '관리자',
            rowIndex: 6,
            link: './menu/system/customerservice.html',
            userTypes: ['130']
        }
        
        // 여덟 번째 행 - 조직도 (숨김)
        // {
        //     label: '조직도',
        //     column: '관리자',
        //     rowIndex: 6,
        //     link: './menu/system/organization.html',
        //     userTypes: ['130']
        // },
        
        // 여덟 번째 행 - 발령 (숨김)
        // {
        //     label: '발령',
        //     column: '관리자',
        //     rowIndex: 7,
        //     link: './menu/system/user-assignment.html',
        //     userTypes: ['130']
        // },
        
        // 아홉 번째 행 - 조직도조회 (숨김)
        // {
        //     label: '조직도조회',
        //     column: '관리자',
        //     rowIndex: 8,
        //     link: './menu/system/organization-chart.html',
        //     userTypes: ['130']
        // }
    ]
};
