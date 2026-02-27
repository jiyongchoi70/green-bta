/**
 * 메시지 모달 (alert 대체)
 * @param {string} message - 표시할 메시지
 */
function showMessageModal(message) {
    var id = 'btaMessageModal';
    var overlay = document.getElementById(id);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'modal'; /* body.modal-open 시 pointer-events 유지 */
        overlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = '<div id="btaMessageModalBox" style="position:relative;z-index:1;background:#fff;padding:24px 32px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);min-width:280px;max-width:90%;text-align:center;"><p id="btaMessageModalText" style="margin:0 0 20px 0;font-size:16px;color:#333;white-space:pre-wrap;"></p><button type="button" id="btaMessageModalOk" style="padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;">확인</button></div>';
        document.body.appendChild(overlay);
        document.getElementById('btaMessageModalOk').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            overlay.style.display = 'none';
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.style.display = 'none';
        });
    }
    document.getElementById('btaMessageModalText').textContent = message || '';
    overlay.style.display = 'flex';
}

/**
 * 확인/취소 모달 (confirm 대체)
 * @param {string} message - 표시할 메시지
 * @param {function} onConfirm - 확인 클릭 시 콜백
 * @param {function} [onCancel] - 취소 클릭 시 콜백
 */
function showConfirmModal(message, onConfirm, onCancel) {
    var id = 'btaConfirmModal';
    var overlay = document.getElementById(id);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'modal'; /* body.modal-open 시 pointer-events 유지 */
        overlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = '<div style="position:relative;z-index:1;background:#fff;padding:24px 32px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);min-width:280px;max-width:90%;text-align:center;"><p id="btaConfirmModalText" style="margin:0 0 20px 0;font-size:16px;color:#333;white-space:pre-wrap;"></p><div style="display:flex;justify-content:center;gap:10px;"><button type="button" id="btaConfirmModalCancel" style="padding:10px 24px;background:#e5e7eb;color:#333;border:none;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;">취소</button><button type="button" id="btaConfirmModalOk" style="padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;">확인</button></div></div>';
        document.body.appendChild(overlay);
        document.getElementById('btaConfirmModalOk').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            overlay.style.display = 'none';
            if (typeof onConfirm === 'function') onConfirm();
        });
        document.getElementById('btaConfirmModalCancel').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            overlay.style.display = 'none';
            if (typeof onCancel === 'function') onCancel();
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                if (typeof onCancel === 'function') onCancel();
            }
        });
    }
    document.getElementById('btaConfirmModalText').textContent = message || '';
    overlay.style.display = 'flex';
}

function getLookupValueName(db, p_type_cd, p_value_cd, p_ymd) {
    return new Promise(function(resolve, reject) {
        if (!p_type_cd || !p_value_cd || !p_ymd) {
            reject(new Error('필수 파라미터가 누락되었습니다.'));
            return;
        }
        
        if (p_ymd.length !== 8) {
            reject(new Error('날짜 형식이 올바르지 않습니다. (YYYYMMDD 형식 필요)'));
            return;
        }
        
        const ymdNumber = parseInt(p_ymd, 10);
        
        db.collection('bta_lookup_value')
            .where('type_cd', '==', p_type_cd)
            .where('value_cd', '==', p_value_cd)
            .get()
            .then(function(querySnapshot) {
                if (querySnapshot.empty) {
                    resolve(null);
                    return;
                }
                
                let foundValue = null;
                
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    const startYmd = data.start_ymd || '';
                    const endYmd = data.end_ymd || '';
                    
                    if (startYmd.length === 8 && endYmd.length === 8) {
                        const startNumber = parseInt(startYmd, 10);
                        const endNumber = parseInt(endYmd, 10);
                        
                        if (ymdNumber >= startNumber && ymdNumber <= endNumber) {
                            foundValue = data.value_nm || null;
                            return;
                        }
                    }
                });
                
                resolve(foundValue);
            })
            .catch(function(error) {
                console.error('공통코드 조회 오류:', error);
                reject(error);
            });
    });
}

function getLookupValueList(db, p_type_cd, p_ymd) {
    return new Promise(function(resolve, reject) {
        if (!p_type_cd || !p_ymd) {
            reject(new Error('필수 파라미터가 누락되었습니다.'));
            return;
        }
        
        if (p_ymd.length !== 8) {
            reject(new Error('날짜 형식이 올바르지 않습니다. (YYYYMMDD 형식 필요)'));
            return;
        }
        
        const ymdNumber = parseInt(p_ymd, 10);
        const result = [];
        
        db.collection('bta_lookup_value')
            .where('type_cd', '==', p_type_cd)
            .get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    const startYmd = data.start_ymd || '';
                    const endYmd = data.end_ymd || '';
                    
                    if (startYmd.length === 8 && endYmd.length === 8) {
                        const startNumber = parseInt(startYmd, 10);
                        const endNumber = parseInt(endYmd, 10);
                        
                        if (ymdNumber >= startNumber && ymdNumber <= endNumber) {
                            result.push({
                                value_cd: data.value_cd || '',
                                value_nm: data.value_nm || '',
                                sort: data.sort !== undefined && data.sort !== null ? data.sort : 0
                            });
                        }
                    }
                });
                
                result.sort(function(a, b) {
                    const sortA = a.sort || 0;
                    const sortB = b.sort || 0;
                    if (sortA !== sortB) {
                        return sortA - sortB;
                    }
                    const codeA = parseInt(a.value_cd) || 0;
                    const codeB = parseInt(b.value_cd) || 0;
                    return codeA - codeB;
                });
                
                resolve(result);
            })
            .catch(function(error) {
                console.error('공통코드 리스트 조회 오류:', error);
                reject(error);
            });
    });
}

/**
 * 과제목록별 내용(드롭다운) 옵션 조회 - value_cd, value_nm, sort, score 반환
 * current_date() between start_ymd and end_ymd, order by sort
 */
function getLookupValueListWithScore(db, p_type_cd, p_ymd) {
    return new Promise(function(resolve, reject) {
        if (!p_type_cd || !p_ymd) {
            reject(new Error('필수 파라미터가 누락되었습니다.'));
            return;
        }
        if (p_ymd.length !== 8) {
            reject(new Error('날짜 형식이 올바르지 않습니다. (YYYYMMDD 형식 필요)'));
            return;
        }
        const ymdNumber = parseInt(p_ymd, 10);
        const result = [];
        db.collection('bta_lookup_value')
            .where('type_cd', '==', p_type_cd)
            .get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    const startYmd = data.start_ymd || '';
                    const endYmd = data.end_ymd || '';
                    if (startYmd.length === 8 && endYmd.length === 8) {
                        const startNumber = parseInt(startYmd, 10);
                        const endNumber = parseInt(endYmd, 10);
                        if (ymdNumber >= startNumber && ymdNumber <= endNumber) {
                            result.push({
                                value_cd: data.value_cd || '',
                                value_nm: data.value_nm || '',
                                sort: data.sort !== undefined && data.sort !== null ? data.sort : 0,
                                score: data.score !== undefined && data.score !== null ? data.score : null
                            });
                        }
                    }
                });
                result.sort(function(a, b) {
                    const sortA = a.sort || 0;
                    const sortB = b.sort || 0;
                    if (sortA !== sortB) return sortA - sortB;
                    const codeA = parseInt(a.value_cd) || 0;
                    const codeB = parseInt(b.value_cd) || 0;
                    return codeA - codeB;
                });
                resolve(result);
            })
            .catch(function(error) {
                console.error('공통코드 리스트(score 포함) 조회 오류:', error);
                reject(error);
            });
    });
}

function getLookupValueSort(db, p_type_cd, p_value_cd, p_ymd) {
    return new Promise(function(resolve, reject) {
        if (!p_type_cd || !p_value_cd || !p_ymd) {
            reject(new Error('필수 파라미터가 누락되었습니다.'));
            return;
        }
        
        if (p_ymd.length !== 8) {
            reject(new Error('날짜 형식이 올바르지 않습니다. (YYYYMMDD 형식 필요)'));
            return;
        }
        
        const ymdNumber = parseInt(p_ymd, 10);
        
        db.collection('bta_lookup_value')
            .where('type_cd', '==', p_type_cd)
            .where('value_cd', '==', p_value_cd)
            .get()
            .then(function(querySnapshot) {
                if (querySnapshot.empty) {
                    resolve(null);
                    return;
                }
                
                let foundSort = null;
                
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    const startYmd = data.start_ymd || '';
                    const endYmd = data.end_ymd || '';
                    
                    if (startYmd.length === 8 && endYmd.length === 8) {
                        const startNumber = parseInt(startYmd, 10);
                        const endNumber = parseInt(endYmd, 10);
                        
                        if (ymdNumber >= startNumber && ymdNumber <= endNumber) {
                            foundSort = data.sort !== undefined && data.sort !== null ? data.sort : null;
                            return;
                        }
                    }
                });
                
                resolve(foundSort);
            })
            .catch(function(error) {
                console.error('공통코드 정렬 조회 오류:', error);
                reject(error);
            });
    });
}
