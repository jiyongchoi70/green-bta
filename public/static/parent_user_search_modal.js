/**
 * 공통 학부모/사용자 조회 모달 (단일 선택)
 * 학부모 등록 등에서 사용
 */

(function() {
    'use strict';
    
    let parentUserSearchModalConfig = null;
    let parentUserSearchGridApi = null;
    let allParentUserData = [];
    let selectedParentUserData = null;
    
    /**
     * 학부모/사용자 조회 모달 초기화
     * @param {Object} config 설정 객체
     * @param {string} config.title 모달 타이틀
     * @param {string|null} config.userTypeDefault 사용자구분 기본값 (null이면 수정 가능)
     * @param {boolean} config.userTypeDisabled 사용자구분 수정 불가 여부
     * @param {Array} config.studentStatusList 재학구분 리스트
     * @param {Array} config.userTypeList 사용자구분 리스트
     * @param {Object} config.db Firestore 인스턴스
     * @param {Function} config.getCurrentDateYmd 날짜 함수
     * @param {Function} config.onSelect 선택 시 콜백 함수 (userId, name, data)
     */
    function initParentUserSearchModal(config) {
        parentUserSearchModalConfig = config;
        
        // 모달 타이틀 설정
        const modalTitle = document.querySelector('#parentUserSearchModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = config.title || '사용자 조회';
        }
        
        // 사용자구분 드롭다운 초기화
        const searchParentUserTypeSelect = document.getElementById('searchParentUserType');
        if (searchParentUserTypeSelect && config.userTypeList) {
            searchParentUserTypeSelect.innerHTML = '<option value="">전체</option>';
            let defaultUserTypeCd = '';
            
            config.userTypeList.forEach(function(item) {
                const option = document.createElement('option');
                option.value = item.value_cd;
                option.textContent = item.value_nm;
                searchParentUserTypeSelect.appendChild(option);
                
                // 기본값 설정
                if (config.userTypeDefault && item.value_nm === config.userTypeDefault) {
                    defaultUserTypeCd = item.value_cd;
                }
            });
            
            if (defaultUserTypeCd) {
                searchParentUserTypeSelect.value = defaultUserTypeCd;
            }
            
            // 수정 불가 설정
            if (config.userTypeDisabled) {
                searchParentUserTypeSelect.disabled = true;
            } else {
                searchParentUserTypeSelect.disabled = false;
            }
        }
        
        // 재학구분 드롭다운 초기화
        const searchParentStudentStatusSelect = document.getElementById('searchParentStudentStatus');
        if (searchParentStudentStatusSelect && config.studentStatusList) {
            searchParentStudentStatusSelect.innerHTML = '<option value="">전체</option>';
            config.studentStatusList.forEach(function(item) {
                const option = document.createElement('option');
                option.value = item.value_cd;
                option.textContent = item.value_nm;
                searchParentStudentStatusSelect.appendChild(option);
            });
        }
        
        // 이벤트 리스너 연결
        const searchParentSearchButton = document.getElementById('searchParentSearchButton');
        if (searchParentSearchButton) {
            searchParentSearchButton.onclick = searchParentUsers;
        }
        
        const selectParentConfirmButton = document.getElementById('selectParentConfirmButton');
        if (selectParentConfirmButton) {
            selectParentConfirmButton.onclick = confirmSelection;
        }
        
        const closeParentSearchButton = document.getElementById('closeParentSearchButton');
        if (closeParentSearchButton) {
            closeParentSearchButton.onclick = closeParentUserSearchModal;
        }
        
        // 모달 닫기 버튼
        const closeButtons = document.querySelectorAll('#parentUserSearchModal .close-button');
        closeButtons.forEach(function(btn) {
            btn.onclick = closeParentUserSearchModal;
        });
        
        // 모달 외부 클릭 시 닫기
        const modal = document.getElementById('parentUserSearchModal');
        if (modal) {
            modal.onclick = function(event) {
                if (event.target === modal) {
                    closeParentUserSearchModal();
                }
            };
        }
    }
    
    /**
     * 모달 열기
     */
    function openParentUserSearchModal() {
        if (!parentUserSearchModalConfig) {
            console.error('학부모/사용자 조회 모달이 초기화되지 않았습니다.');
            return;
        }
        
        // 검색 조건 초기화
        document.getElementById('searchParentUserName').value = '';
        document.getElementById('searchParentUserPhone').value = '';
        
        const searchParentStudentStatusSelect = document.getElementById('searchParentStudentStatus');
        if (searchParentStudentStatusSelect) {
            searchParentStudentStatusSelect.value = '';
        }
        
        const searchParentUserTypeSelect = document.getElementById('searchParentUserType');
        if (searchParentUserTypeSelect && parentUserSearchModalConfig.userTypeDefault && parentUserSearchModalConfig.userTypeList) {
            let defaultUserTypeCd = '';
            parentUserSearchModalConfig.userTypeList.forEach(function(item) {
                if (item.value_nm === parentUserSearchModalConfig.userTypeDefault) {
                    defaultUserTypeCd = item.value_cd;
                }
            });
            if (defaultUserTypeCd) {
                searchParentUserTypeSelect.value = defaultUserTypeCd;
            }
        }
        
        // 선택 데이터 초기화
        selectedParentUserData = null;
        
        // 모달 표시
        document.getElementById('parentUserSearchModal').style.display = 'block';
        document.body.classList.add('modal-open');
        
        // 그리드 초기화
        if (!parentUserSearchGridApi) {
            setTimeout(function() {
                initParentUserSearchGrid();
                if (parentUserSearchGridApi) {
                    parentUserSearchGridApi.setGridOption('rowData', []);
                    parentUserSearchGridApi.deselectAll();
                }
                attachParentUserSearchGridClickHandler();
            }, 300);
        } else {
            if (parentUserSearchGridApi) {
                parentUserSearchGridApi.setGridOption('rowData', []);
                parentUserSearchGridApi.deselectAll();
            }
            setTimeout(function() {
                attachParentUserSearchGridClickHandler();
            }, 100);
        }
    }
    
    /**
     * 모달 닫기
     */
    function closeParentUserSearchModal() {
        document.getElementById('parentUserSearchModal').style.display = 'none';
        
        // 그리드 데이터 초기화
        if (parentUserSearchGridApi) {
            parentUserSearchGridApi.setGridOption('rowData', []);
            parentUserSearchGridApi.deselectAll();
        }
        
        selectedParentUserData = null;
        allParentUserData = [];
        
        // 이벤트 리스너 제거
        const gridElement = document.querySelector('#parentUserSearchGrid');
        if (gridElement && parentUserSearchGridClickHandler) {
            try {
                gridElement.removeEventListener('click', parentUserSearchGridClickHandler, true);
            } catch (e) {
                console.warn('이벤트 리스너 제거 중 오류:', e);
            }
        }
        parentUserSearchGridClickHandler = null;
        
        // modal-open 클래스 제거는 호출하는 쪽에서 처리
    }
    
    /**
     * 그리드 초기화
     */
    function initParentUserSearchGrid() {
        const gridElement = document.querySelector('#parentUserSearchGrid');
        if (!gridElement) {
            return;
        }
        
        if (parentUserSearchGridApi) {
            try {
                parentUserSearchGridApi.destroy();
            } catch (e) {
                console.error('그리드 파괴 오류:', e);
            }
        }
        
        const parentUserSearchColumnDefs = [
            { field: 'name', headerName: '성명', width: 150, sortable: true },
            { field: 'phone', headerName: '전화번호', width: 150, sortable: true },
            { field: 'user_type_nm', headerName: '사용자구분', width: 150, sortable: true },
            { field: 'student_status_nm', headerName: '재학구분', width: 150, sortable: true }
        ];
        
        const parentUserSearchGridOptions = {
            columnDefs: parentUserSearchColumnDefs,
            rowSelection: 'single',
            suppressRowClickSelection: false,
            defaultColDef: {
                resizable: true
            },
            domLayout: 'normal',
            rowHeight: 40,
            onSelectionChanged: function(event) {
                const selectedRows = event.api.getSelectedRows();
                if (selectedRows.length > 0) {
                    selectedParentUserData = selectedRows[0];
                } else {
                    selectedParentUserData = null;
                }
            }
        };
        
        try {
            parentUserSearchGridApi = agGrid.createGrid(gridElement, parentUserSearchGridOptions);
        } catch (e) {
            console.error('그리드 초기화 오류:', e);
        }
    }
    
    let parentUserSearchGridClickHandler = null;
    
    /**
     * 그리드 클릭 이벤트 핸들러 연결 (user_search_modal.js 참조)
     */
    function attachParentUserSearchGridClickHandler() {
        const gridElement = document.querySelector('#parentUserSearchGrid');
        if (!gridElement) {
            return;
        }
        
        if (parentUserSearchGridClickHandler) {
            try {
                gridElement.removeEventListener('click', parentUserSearchGridClickHandler, true);
            } catch (e) {
                console.warn('이벤트 리스너 제거 중 오류:', e);
            }
        }
        
        parentUserSearchGridClickHandler = function(event) {
            const clickY = event.clientY;
            const gridRect = gridElement.getBoundingClientRect();
            const relativeY = clickY - gridRect.top;
            
            const headerHeight = 40;
            const rowHeight = 40;
            
            if (relativeY < headerHeight) {
                return;
            }
            
            const rowIndex = Math.floor((relativeY - headerHeight) / rowHeight);
            
            if (rowIndex < 0 || rowIndex >= allParentUserData.length) {
                return;
            }
            
            try {
                const allRowNodes = [];
                if (parentUserSearchGridApi) {
                    parentUserSearchGridApi.forEachNode(function(node) {
                        allRowNodes.push(node);
                    });
                }
                
                if (rowIndex < allRowNodes.length) {
                    const rowNode = allRowNodes[rowIndex];
                    // 기존 선택 해제 (단일 선택)
                    parentUserSearchGridApi.deselectAll();
                    // 새로운 행 선택
                    rowNode.setSelected(true);
                    
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
                console.error('행 선택 오류:', e);
            }
        };
        
        gridElement.addEventListener('click', parentUserSearchGridClickHandler, true);
    }
    
    /**
     * 사용자 검색
     */
    function searchParentUsers() {
        if (!parentUserSearchModalConfig) {
            return;
        }
        
        const searchName = document.getElementById('searchParentUserName').value.trim();
        const searchPhone = document.getElementById('searchParentUserPhone').value.trim();
        const searchUserType = document.getElementById('searchParentUserType').value;
        const searchStudentStatus = document.getElementById('searchParentStudentStatus').value;
        
        const normalizePhone = function(phone) {
            return (phone || '').replace(/-/g, '');
        };
        
        const normalizedSearchPhone = searchPhone ? normalizePhone(searchPhone) : '';
        const currentDate = parentUserSearchModalConfig.getCurrentDateYmd();
        
        parentUserSearchModalConfig.db.collection('bta_users').get()
            .then(function(querySnapshot) {
                const promises = [];
                const data = [];
                
                querySnapshot.forEach(function(doc) {
                    const docData = doc.data();
                    const userType = docData.user_type;
                    const studentStatus = docData.student_status || '';
                    
                    const name = docData.name || '';
                    const phone = docData.phone || '';
                    
                    if (searchName && !name.startsWith(searchName)) {
                        return;
                    }
                    if (normalizedSearchPhone && !normalizePhone(phone).startsWith(normalizedSearchPhone)) {
                        return;
                    }
                    if (searchUserType && userType !== searchUserType) {
                        return;
                    }
                    if (searchStudentStatus && studentStatus !== searchStudentStatus) {
                        return;
                    }
                    
                    const userPromise = Promise.all([
                        getLookupValueName(parentUserSearchModalConfig.db, '110', userType, currentDate),
                        studentStatus ? getLookupValueName(parentUserSearchModalConfig.db, '130', studentStatus, currentDate) : Promise.resolve(null)
                    ]).then(function(results) {
                        data.push({
                            userId: docData.userId || '',
                            name: name,
                            phone: phone,
                            user_type: userType,
                            user_type_nm: results[0] || '',
                            student_status: studentStatus,
                            student_status_nm: results[1] || ''
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
                
                allParentUserData = data;
                
                if (parentUserSearchGridApi) {
                    parentUserSearchGridApi.setGridOption('rowData', data);
                    parentUserSearchGridApi.deselectAll();
                    
                    // 그리드가 완전히 렌더링된 후 이벤트 핸들러 연결
                    setTimeout(function() {
                        attachParentUserSearchGridClickHandler();
                    }, 100);
                }
            })
            .catch(function(error) {
                console.error('사용자 검색 오류:', error);
                alert('사용자 검색 중 오류가 발생했습니다.');
            });
    }
    
    /**
     * 선택 확인
     */
    function confirmSelection() {
        // AG-Grid에서 선택된 행 가져오기
        if (parentUserSearchGridApi) {
            const selectedRows = parentUserSearchGridApi.getSelectedRows();
            if (selectedRows.length === 0) {
                alert('사용자를 선택해주세요.\n\n행을 클릭한 후 "선택" 버튼을 클릭하세요.');
                return;
            }
            
            selectedParentUserData = selectedRows[0];
        } else {
            if (!selectedParentUserData) {
                alert('사용자를 선택해주세요.\n\n행을 클릭한 후 "선택" 버튼을 클릭하세요.');
                return;
            }
        }
        
        if (parentUserSearchModalConfig && parentUserSearchModalConfig.onSelect) {
            parentUserSearchModalConfig.onSelect(
                selectedParentUserData.userId,
                selectedParentUserData.name,
                selectedParentUserData
            );
        }
        
        closeParentUserSearchModal();
    }
    
    // 전역 객체로 노출
    window.ParentUserSearchModal = {
        init: initParentUserSearchModal,
        open: openParentUserSearchModal,
        close: closeParentUserSearchModal
    };
})();
