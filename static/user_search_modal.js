/**
 * 공통 사용자조회 모달
 * 반배정등록과 학부모등록에서 공통으로 사용
 */

(function() {
    'use strict';
    
    let userSearchModalConfig = null;
    let userSearchGridApi = null;
    let allUserData = [];
    let userSearchGridClickHandler = null;
    
    /**
     * 사용자조회 모달 초기화
     * @param {Object} config 설정 객체
     * @param {string} config.title 모달 타이틀
     * @param {string|null} config.userTypeDefault 사용자구분 기본값 (null이면 수정 가능)
     * @param {boolean} config.userTypeDisabled 사용자구분 수정 불가 여부
     * @param {string} config.collectionName 저장할 컬렉션명
     * @param {string} config.idFieldName ID 필드명 (class_id 또는 parent_id)
     * @param {Function} config.getSelectedId 선택된 ID를 반환하는 함수
     * @param {Function} config.loadDataCallback 저장 후 데이터 로드 콜백 함수
     * @param {Array} config.studentStatusList 재학구분 리스트
     * @param {Array} config.userTypeList 사용자구분 리스트
     * @param {Object} config.db Firestore 인스턴스
     * @param {Function} config.getCurrentDateYmd 날짜 함수
     */
    function initUserSearchModal(config) {
        userSearchModalConfig = config;
        
        // 모달 타이틀 설정
        const modalTitle = document.querySelector('#userSearchModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = config.title || '사용자 조회';
        }
        
        // 사용자구분 드롭다운 초기화
        const searchUserUserTypeSelect = document.getElementById('searchUserUserType');
        if (searchUserUserTypeSelect && config.userTypeList) {
            searchUserUserTypeSelect.innerHTML = '<option value="">전체</option>';
            let defaultUserTypeCd = '';
            
            config.userTypeList.forEach(function(item) {
                // 학부모(120), 신입생(150) 제외
                if (item.value_cd === '120' || item.value_cd === '150') {
                    return;
                }
                const option = document.createElement('option');
                option.value = item.value_cd;
                option.textContent = item.value_nm;
                searchUserUserTypeSelect.appendChild(option);
                
                // 기본값 설정
                if (config.userTypeDefault && item.value_nm === config.userTypeDefault) {
                    defaultUserTypeCd = item.value_cd;
                }
            });
            
            if (defaultUserTypeCd) {
                searchUserUserTypeSelect.value = defaultUserTypeCd;
            }
            
            // 수정 불가 설정
            if (config.userTypeDisabled) {
                searchUserUserTypeSelect.disabled = true;
            } else {
                searchUserUserTypeSelect.disabled = false;
            }
        }
        
        // 재학구분 드롭다운 초기화
        const searchUserStudentStatusSelect = document.getElementById('searchUserStudentStatus');
        if (searchUserStudentStatusSelect && config.studentStatusList) {
            searchUserStudentStatusSelect.innerHTML = '<option value="">전체</option>';
            let defaultStudentStatusCd = '';
            
            config.studentStatusList.forEach(function(item) {
                const option = document.createElement('option');
                option.value = item.value_cd;
                option.textContent = item.value_nm;
                searchUserStudentStatusSelect.appendChild(option);
                
                // 재학을 기본값으로 설정
                if (item.value_nm === '재학') {
                    defaultStudentStatusCd = item.value_cd;
                }
            });
            
            if (defaultStudentStatusCd) {
                searchUserStudentStatusSelect.value = defaultStudentStatusCd;
            }
        }
        
        // 이벤트 리스너 연결
        const searchUserSearchButton = document.getElementById('searchUserSearchButton');
        if (searchUserSearchButton) {
            searchUserSearchButton.onclick = searchUsers;
        }
        
        const selectUserConfirmButton = document.getElementById('selectUserConfirmButton');
        if (selectUserConfirmButton) {
            selectUserConfirmButton.onclick = saveSelectedUsers;
        }
        
        const closeUserSearchButton = document.getElementById('closeUserSearchButton');
        if (closeUserSearchButton) {
            closeUserSearchButton.onclick = closeUserSearchModal;
        }
        
        // 모달 닫기 버튼
        const closeButtons = document.querySelectorAll('#userSearchModal .close-button');
        closeButtons.forEach(function(btn) {
            btn.onclick = closeUserSearchModal;
        });
        
        // 모달 외부 클릭 시 닫기
        const modal = document.getElementById('userSearchModal');
        if (modal) {
            modal.onclick = function(event) {
                if (event.target === modal) {
                    closeUserSearchModal();
                }
            };
        }
    }
    
    /**
     * 사용자조회 모달 열기
     */
    function openUserSearchModal() {
        if (!userSearchModalConfig) {
            console.error('사용자조회 모달이 초기화되지 않았습니다.');
            return;
        }
        
        // 선택된 ID 확인
        const selectedId = userSearchModalConfig.getSelectedId();
        if (!selectedId) {
            alert(userSearchModalConfig.idFieldName === 'class_id' ? '반을 먼저 선택해주세요.' : '학부모를 먼저 선택해주세요.');
            return;
        }
        
        // 검색 조건 초기화
        document.getElementById('searchUserName').value = '';
        document.getElementById('searchUserPhone').value = '';
        
        const searchUserStudentStatusSelect = document.getElementById('searchUserStudentStatus');
        if (searchUserStudentStatusSelect && userSearchModalConfig.studentStatusList) {
            let defaultStudentStatusCd = '';
            userSearchModalConfig.studentStatusList.forEach(function(item) {
                if (item.value_nm === '재학') {
                    defaultStudentStatusCd = item.value_cd;
                }
            });
            if (defaultStudentStatusCd) {
                searchUserStudentStatusSelect.value = defaultStudentStatusCd;
            } else {
                searchUserStudentStatusSelect.value = '';
            }
        }
        
        const searchUserUserTypeSelect = document.getElementById('searchUserUserType');
        if (searchUserUserTypeSelect) {
            if (userSearchModalConfig.userTypeDefault && userSearchModalConfig.userTypeList) {
                let defaultUserTypeCd = '';
                userSearchModalConfig.userTypeList.forEach(function(item) {
                    if (item.value_nm === userSearchModalConfig.userTypeDefault) {
                        defaultUserTypeCd = item.value_cd;
                    }
                });
                if (defaultUserTypeCd) {
                    searchUserUserTypeSelect.value = defaultUserTypeCd;
                } else {
                    searchUserUserTypeSelect.value = '';
                }
            } else {
                searchUserUserTypeSelect.value = '';
            }
            if (userSearchModalConfig.userTypeDisabled) {
                searchUserUserTypeSelect.disabled = true;
            }
        }
        
        // 모달 표시
        document.getElementById('userSearchModal').style.display = 'block';
        document.body.classList.add('modal-open');
        
        // 그리드 초기화 (확실하게 기다림)
        if (!userSearchGridApi) {
            setTimeout(function() {
                initUserSearchGrid();
                // 그리드 초기화 후 빈 데이터로 설정
                if (userSearchGridApi) {
                    userSearchGridApi.setGridOption('rowData', []);
                    userSearchGridApi.deselectAll();
                }
                attachUserSearchGridClickHandler();
            }, 300);
        } else {
            // 그리드가 이미 있으면 데이터만 초기화
            if (userSearchGridApi) {
                userSearchGridApi.setGridOption('rowData', []);
                userSearchGridApi.deselectAll();
            }
            // 이벤트 리스너 재연결
            setTimeout(function() {
                attachUserSearchGridClickHandler();
            }, 100);
        }
    }
    
    /**
     * 사용자조회 모달 닫기
     */
    function closeUserSearchModal() {
        document.getElementById('userSearchModal').style.display = 'none';
        document.body.classList.remove('modal-open');
        
        if (userSearchGridApi) {
            userSearchGridApi.setGridOption('rowData', []);
            userSearchGridApi.deselectAll();
            allUserData = [];
        }
        
        const gridElement = document.querySelector('#userSearchGrid');
        if (gridElement && userSearchGridClickHandler) {
            try {
                gridElement.removeEventListener('click', userSearchGridClickHandler, true);
            } catch (e) {
                console.warn('이벤트 리스너 제거 중 오류:', e);
            }
        }
        userSearchGridClickHandler = null;
    }
    
    /**
     * 그리드 초기화
     */
    function initUserSearchGrid() {
        const gridElement = document.querySelector('#userSearchGrid');
        if (!gridElement) {
            return;
        }
        
        if (userSearchGridApi) {
            try {
                userSearchGridApi.destroy();
            } catch (e) {
                console.error('그리드 파괴 오류:', e);
            }
        }
        
        const userSearchColumnDefs = [
            { 
                checkboxSelection: true,
                headerCheckboxSelection: false,
                width: 50,
                pinned: 'left',
                suppressMenu: true,
                sortable: false,
                filter: false,
                resizable: false
            },
            { field: 'name', headerName: '성명', width: 150, sortable: true },
            { field: 'phone', headerName: '전화번호', width: 150, sortable: true },
            { field: 'user_type_nm', headerName: '사용자구분', width: 150, sortable: true },
            { field: 'student_status_nm', headerName: '재학구분', width: 150, sortable: true }
        ];
        
        const userSearchGridOptions = {
            columnDefs: userSearchColumnDefs,
            rowSelection: 'multiple',
            suppressRowClickSelection: false,
            defaultColDef: {
                resizable: true
            },
            domLayout: 'normal',
            rowHeight: 40
        };
        
        try {
            userSearchGridApi = agGrid.createGrid(gridElement, userSearchGridOptions);
            // 그리드 초기화 후 빈 데이터로 설정하여 "Loading..." 방지
            if (userSearchGridApi) {
                userSearchGridApi.setGridOption('rowData', []);
            }
        } catch (e) {
            console.error('그리드 초기화 오류:', e);
        }
    }
    
    /**
     * 그리드 클릭 이벤트 핸들러 연결
     */
    function attachUserSearchGridClickHandler() {
        const gridElement = document.querySelector('#userSearchGrid');
        if (!gridElement) {
            console.error('❌ 그리드 요소를 찾을 수 없음');
            return;
        }
        
        if (userSearchGridClickHandler) {
            try {
                gridElement.removeEventListener('click', userSearchGridClickHandler, true);
            } catch (e) {
                console.warn('이벤트 리스너 제거 중 오류:', e);
            }
        }
        
        userSearchGridClickHandler = function(event) {
            if (event.target.type === 'checkbox' || event.target.closest('.ag-checkbox')) {
                return;
            }
            
            const clickY = event.clientY;
            const gridRect = gridElement.getBoundingClientRect();
            const relativeY = clickY - gridRect.top;
            
            const headerHeight = 40;
            const rowHeight = 40;
            
            if (relativeY < headerHeight) {
                return;
            }
            
            const rowIndex = Math.floor((relativeY - headerHeight) / rowHeight);
            
            if (rowIndex < 0 || rowIndex >= allUserData.length) {
                return;
            }
            
            try {
                const allRowNodes = [];
                if (userSearchGridApi) {
                    userSearchGridApi.forEachNode(function(node) {
                        allRowNodes.push(node);
                    });
                }
                
                if (rowIndex < allRowNodes.length) {
                    const rowNode = allRowNodes[rowIndex];
                    rowNode.setSelected(!rowNode.isSelected());
                    
                    const allCells = gridElement.querySelectorAll('.ag-cell');
                    allCells.forEach(function(cell) {
                        cell.style.setProperty('background-color', '', 'important');
                        cell.style.setProperty('font-weight', '', 'important');
                    });
                    
                    const expectedRowTop = gridRect.top + headerHeight + (rowIndex * rowHeight);
                    const expectedRowBottom = expectedRowTop + rowHeight;
                    
                    allCells.forEach(function(cell) {
                        const cellRect = cell.getBoundingClientRect();
                        const cellCenterY = cellRect.top + (cellRect.height / 2);
                        
                        if (cellCenterY >= expectedRowTop && cellCenterY < expectedRowBottom) {
                            if (rowNode.isSelected()) {
                                cell.style.setProperty('background-color', '#e3f2fd', 'important');
                                cell.style.setProperty('font-weight', 'bold', 'important');
                            }
                        }
                    });
                }
            } catch (e) {
                console.error('❌ 행 선택 오류:', e);
            }
        };
        
        gridElement.addEventListener('click', userSearchGridClickHandler, true);
    }
    
    /**
     * 사용자 검색
     */
    function searchUsers() {
        if (!userSearchModalConfig) {
            return;
        }
        
        const searchName = document.getElementById('searchUserName').value.trim();
        const searchPhone = document.getElementById('searchUserPhone').value.trim();
        const searchStudentStatus = document.getElementById('searchUserStudentStatus').value;
        const searchUserType = document.getElementById('searchUserUserType').value;
        
        const normalizePhone = function(phone) {
            return (phone || '').replace(/-/g, '');
        };
        
        const normalizedSearchPhone = searchPhone ? normalizePhone(searchPhone) : '';
        const currentDate = userSearchModalConfig.getCurrentDateYmd();
        
        userSearchModalConfig.db.collection('bta_users').get()
            .then(function(querySnapshot) {
                const promises = [];
                const data = [];
                
                querySnapshot.forEach(function(doc) {
                    const docData = doc.data();
                    const userType = docData.user_type;
                    const studentStatus = docData.student_status;
                    
                    if (userType === '120' || userType === '150') {
                        return;
                    }
                    
                    if (!userType || userType === '') {
                        return;
                    }
                    
                    const name = docData.name || '';
                    const phone = docData.phone || '';
                    
                    if (searchName && !name.startsWith(searchName)) {
                        return;
                    }
                    if (normalizedSearchPhone && !normalizePhone(phone).startsWith(normalizedSearchPhone)) {
                        return;
                    }
                    if (searchStudentStatus && studentStatus !== searchStudentStatus) {
                        return;
                    }
                    if (searchUserType && userType !== searchUserType) {
                        return;
                    }
                    
                    const userPromise = getLookupValueName(userSearchModalConfig.db, '110', userType, currentDate)
                        .then(function(userTypeNm) {
                            return getLookupValueName(userSearchModalConfig.db, '130', studentStatus || '', currentDate)
                                .then(function(studentStatusNm) {
                                    data.push({
                                        userId: docData.userId || '',
                                        name: name,
                                        phone: phone,
                                        user_type: userType,
                                        user_type_nm: userTypeNm || '',
                                        student_status: studentStatus || '',
                                        student_status_nm: studentStatusNm || ''
                                    });
                                });
                        });
                    
                    promises.push(userPromise);
                });
                
                return Promise.all(promises).then(function() {
                    return data;
                });
            })
            .then(function(data) {
                data.sort(function(a, b) {
                    return (a.name || '').localeCompare(b.name || '');
                });
                
                allUserData = data;
                
                if (userSearchGridApi) {
                    userSearchGridApi.setGridOption('rowData', data);
                }
            })
            .catch(function(error) {
                console.error('사용자 검색 오류:', error);
                alert('사용자 검색 중 오류가 발생했습니다.');
            });
    }
    
    /**
     * DOM에서 선택된 행 가져오기
     */
    function getSelectedRowsFromDOM(gridElement) {
        const selectedRows = [];
        
        if (!gridElement) {
            return selectedRows;
        }
        
        // AG-Grid에서 선택된 행 찾기
        const selectedRowElements = gridElement.querySelectorAll('.ag-row-selected, .ag-row[aria-selected="true"]');
        if (selectedRowElements.length > 0) {
            selectedRowElements.forEach(function(rowElement) {
                const rowIndex = parseInt(rowElement.getAttribute('row-index'));
                if (!isNaN(rowIndex) && rowIndex >= 0 && rowIndex < allUserData.length) {
                    selectedRows.push(allUserData[rowIndex]);
                }
            });
        }
        
        // 체크박스에서 선택된 행 찾기
        if (selectedRows.length === 0) {
            const checkboxes = gridElement.querySelectorAll('.ag-checkbox-input:checked');
            checkboxes.forEach(function(checkbox) {
                const rowElement = checkbox.closest('.ag-row');
                if (rowElement) {
                    const rowIndex = parseInt(rowElement.getAttribute('row-index'));
                    if (!isNaN(rowIndex) && rowIndex >= 0 && rowIndex < allUserData.length) {
                        // 중복 체크
                        const existing = selectedRows.find(function(r) { return r.userId === allUserData[rowIndex].userId; });
                        if (!existing) {
                            selectedRows.push(allUserData[rowIndex]);
                        }
                    }
                }
            });
        }
        
        // allUserData가 비어있으면 DOM에서 직접 데이터 추출
        if (selectedRows.length === 0 && allUserData.length === 0) {
            const checkboxes = gridElement.querySelectorAll('.ag-checkbox-input:checked');
            checkboxes.forEach(function(checkbox) {
                const rowElement = checkbox.closest('.ag-row');
                if (rowElement) {
                    const cells = rowElement.querySelectorAll('.ag-cell');
                    if (cells.length >= 3) {
                        const name = cells[1] ? cells[1].textContent.trim() : '';
                        const phone = cells[2] ? cells[2].textContent.trim() : '';
                        const userTypeNm = cells[3] ? cells[3].textContent.trim() : '';
                        
                        // userId는 찾을 수 없으므로 name과 phone으로 식별
                        // 이 경우 저장 시 문제가 될 수 있으므로 경고
                        if (name) {
                            selectedRows.push({
                                name: name,
                                phone: phone,
                                user_type_nm: userTypeNm,
                                userId: null // 나중에 찾아야 함
                            });
                        }
                    }
                }
            });
        }
        
        return selectedRows;
    }
    
    /**
     * 선택된 사용자들을 데이터베이스에 저장
     */
    function saveUsersToDatabase(selectedRows, selectedId) {
        if (selectedRows.length === 0) {
            alert('선택된 사용자가 없습니다.');
            return;
        }
        
        const checkPromises = selectedRows.map(function(row) {
            const userId = row.userId || '';
            if (!userId) {
                // userId가 없으면 name과 phone으로 사용자 찾기
                if (row.name && row.phone) {
                    return userSearchModalConfig.db.collection('bta_users')
                        .where('name', '==', row.name)
                        .where('phone', '==', row.phone)
                        .get()
                        .then(function(userSnapshot) {
                            if (userSnapshot.empty) {
                                return { duplicate: false, name: row.name || '', userId: null };
                            }
                            const foundUserId = userSnapshot.docs[0].data().userId;
                            return {
                                duplicate: false,
                                name: row.name || '',
                                userId: foundUserId
                            };
                        });
                }
                return Promise.resolve({ duplicate: false, name: row.name || '', userId: null });
            }
            
            return userSearchModalConfig.db.collection(userSearchModalConfig.collectionName)
                .where(userSearchModalConfig.idFieldName, '==', selectedId)
                .where('userid', '==', userId)
                .get()
                .then(function(querySnapshot) {
                    return {
                        duplicate: !querySnapshot.empty,
                        name: row.name || '',
                        userId: userId
                    };
                });
        });
        
        return Promise.all(checkPromises)
            .then(function(results) {
                const duplicates = results.filter(function(r) { return r.duplicate; });
                
                if (duplicates.length > 0) {
                    const duplicateMessages = duplicates.map(function(r) {
                        return r.name + '은(는) 이미 등록된 사람입니다.';
                    });
                    alert(duplicateMessages.join('\n'));
                    return Promise.reject(new Error('duplicate'));
                }
                
                const validUsers = results.filter(function(r) { return r.userId; });
                if (validUsers.length === 0) {
                    alert('저장할 사용자 정보를 찾을 수 없습니다.');
                    return Promise.resolve();
                }
                
                // bta_class_students 컬렉션이고 class_id인 경우, bta_class에서 semester_cd, class_cd 조회
                if (userSearchModalConfig.collectionName === 'bta_class_students' && userSearchModalConfig.idFieldName === 'class_id') {
                    return userSearchModalConfig.db.collection('bta_class').doc(selectedId).get()
                        .then(function(classDoc) {
                            var semesterCd = '';
                            var classCd = '';
                            if (classDoc.exists) {
                                var d = classDoc.data();
                                semesterCd = (d.semester_cd || '').toString().trim();
                                classCd = (d.class_cd || '').toString().trim();
                            }
                            var savePromises = validUsers.map(function(r) {
                                var saveData = {};
                                saveData[userSearchModalConfig.idFieldName] = selectedId;
                                saveData['userid'] = r.userId;
                                saveData['semester_cd'] = semesterCd;
                                saveData['class_cd'] = classCd;
                                return userSearchModalConfig.db.collection(userSearchModalConfig.collectionName).add(saveData);
                            });
                            return Promise.all(savePromises);
                        });
                } else {
                    var savePromises = validUsers.map(function(r) {
                        var saveData = {};
                        saveData[userSearchModalConfig.idFieldName] = selectedId;
                        saveData['userid'] = r.userId;
                        return userSearchModalConfig.db.collection(userSearchModalConfig.collectionName).add(saveData);
                    });
                    return Promise.all(savePromises);
                }
            })
            .then(function() {
                if (selectedRows.length > 0) {
                    alert('등록되었습니다.');
                    closeUserSearchModal();
                    if (userSearchModalConfig.loadDataCallback) {
                        userSearchModalConfig.loadDataCallback(selectedId);
                    }
                }
            })
            .catch(function(error) {
                if (error && error.message === 'duplicate') {
                    return;
                }
                console.error('등록 오류:', error);
                alert('등록 중 오류가 발생했습니다: ' + (error && error.message ? error.message : error));
            });
    }
    
    /**
     * 선택된 사용자 저장
     */
    function saveSelectedUsers() {
        if (!userSearchModalConfig) {
            return;
        }
        
        const selectedId = userSearchModalConfig.getSelectedId();
        if (!selectedId) {
            alert(userSearchModalConfig.idFieldName === 'class_id' ? '반을 먼저 선택해주세요.' : '학부모를 먼저 선택해주세요.');
            return;
        }
        
        // 그리드가 없으면 초기화 시도
        const gridElement = document.querySelector('#userSearchGrid');
        if (!gridElement) {
            alert('그리드 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 선택된 행 가져오기 (API 우선, 없으면 DOM에서 찾기)
        let selectedRows = [];
        
        if (userSearchGridApi) {
            // API가 있으면 API 사용
            try {
                selectedRows = userSearchGridApi.getSelectedRows();
            } catch (e) {
                console.warn('그리드 API에서 선택된 행을 가져오는 중 오류:', e);
            }
        }
        
        // API가 없거나 선택된 행이 없으면 DOM에서 직접 찾기
        if (selectedRows.length === 0) {
            selectedRows = getSelectedRowsFromDOM(gridElement);
        }
        
        // 선택된 행이 없으면 경고
        if (selectedRows.length === 0) {
            alert('선택된 사용자가 없습니다.');
            return;
        }
        
        // 저장 로직 실행
        saveUsersToDatabase(selectedRows, selectedId);
    }
    
    // 전역으로 노출
    window.UserSearchModal = {
        init: initUserSearchModal,
        open: openUserSearchModal,
        close: closeUserSearchModal
    };
})();
