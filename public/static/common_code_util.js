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
