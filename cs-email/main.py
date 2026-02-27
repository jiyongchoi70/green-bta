# -*- coding: utf-8 -*-
"""
C/S 요청사항 일일 메일 발송 - Cloud Run 서비스
- GET / : 헬스 체크
- GET /run 또는 POST /run : 메일 발송 실행 (Cloud Scheduler에서 호출)
"""
import os
import sys
import logging
from datetime import datetime, timedelta
from flask import Flask, request

logging.basicConfig(level=logging.INFO, stream=sys.stderr, format='%(levelname)s %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 환경 변수
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
RESEND_FROM_EMAIL = os.environ.get('RESEND_FROM_EMAIL', 'noreply@treegreen.co.kr')
GCLOUD_PROJECT = os.environ.get('GCLOUD_PROJECT', 'greentree-bta')
RESEND_EMAIL_URL = 'https://api.resend.com/emails'

# Firebase 초기화 (한 번만)
_db = None

try:
    from google.cloud.firestore_v1.base_query import FieldFilter
except ImportError:
    FieldFilter = None  # 구버전 SDK 대응


def get_firestore():
    global _db
    if _db is not None:
        return _db
    import firebase_admin
    from firebase_admin import credentials, firestore
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {'projectId': GCLOUD_PROJECT})
    _db = firestore.client()
    return _db


def ymd_today():
    return datetime.utcnow().strftime('%Y%m%d')


def ymd_yesterday():
    return (datetime.utcnow() - timedelta(days=1)).strftime('%Y%m%d')


def format_ymd_display(ymd):
    if not ymd or len(ymd) != 8:
        return ymd or ''
    return f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:8]}"


def _user_query(db, uid):
    col = db.collection('bta_users')
    if FieldFilter is not None:
        q = col.where(filter=FieldFilter('userId', '==', uid)).limit(1)
    else:
        q = col.where('userId', '==', uid).limit(1)
    return q.stream()


def get_user_email(uid):
    db = get_firestore()
    for doc in _user_query(db, uid):
        return (doc.to_dict().get('email') or '').strip()
    return ''


def get_user_name(uid):
    db = get_firestore()
    for doc in _user_query(db, uid):
        return (doc.to_dict().get('name') or '').strip()
    return ''


# C/S 구분 lookup: type_cd 340 (프론트 getLookupValueName(db, '340', customerservice_cd, create_ymd) 와 동일)
CUSTOMERSERVICE_LOOKUP_TYPE = '340'


def get_lookup_value_name(db, type_cd, value_cd, ymd):
    """
    getLookupValueName(db, type_cd, value_cd, ymd) 와 동일 로직.
    common_code_util.js getLookupValueName 참조: bta_lookup_value에서 type_cd, value_cd로 조회 후
    ymd가 start_ymd ~ end_ymd 구간에 있는 문서의 value_nm 반환.
    """
    if not type_cd or not value_cd or not ymd or len(str(ymd).strip()) != 8:
        return ''
    ymd_str = str(ymd).strip()
    try:
        ymd_num = int(ymd_str, 10)
    except (ValueError, TypeError):
        return ''
    col = db.collection('bta_lookup_value')
    if FieldFilter is not None:
        q = col.where(filter=FieldFilter('type_cd', '==', type_cd)).where(filter=FieldFilter('value_cd', '==', value_cd))
    else:
        q = col.where('type_cd', '==', type_cd).where('value_cd', '==', value_cd)
    for doc in q.stream():
        data = doc.to_dict()
        start_ymd = (data.get('start_ymd') or '').strip()
        end_ymd = (data.get('end_ymd') or '').strip()
        if len(start_ymd) == 8 and len(end_ymd) == 8:
            try:
                if int(start_ymd, 10) <= ymd_num <= int(end_ymd, 10):
                    return (data.get('value_nm') or '').strip()
            except (ValueError, TypeError):
                pass
    return ''


def build_table_rows(rows):
    """메일 본문용 HTML 테이블 행 생성 (순서, 구분, 제목, 제출일, 접수일, 완료일, 작성자)"""
    html = ''
    for i, r in enumerate(rows, 1):
        html += f'<tr><td>{i}</td><td>{r.get("구분","")}</td><td>{r.get("제목","")}</td>'
        html += f'<td>{r.get("제출일","")}</td><td>{r.get("접수일","")}</td><td>{r.get("완료일","")}</td><td>{r.get("작성자","")}</td></tr>'
    return html


def send_resend_email(to_email, subject, html_body):
    if not RESEND_API_KEY or not to_email:
        return False, 'RESEND_API_KEY or to_email missing'
    headers = {
        'Authorization': f'Bearer {RESEND_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'from': RESEND_FROM_EMAIL,
        'to': [to_email],
        'subject': subject,
        'html': html_body,
    }
    try:
        import requests
        r = requests.post(RESEND_EMAIL_URL, headers=headers, json=payload, timeout=30)
        if r.status_code in (200, 201, 202):
            return True, None
        return False, f'Resend API {r.status_code}: {r.text}'
    except Exception as e:
        return False, str(e)


def run_daily_email():
    db = get_firestore()
    yesterday = ymd_yesterday()
    subject = 'C/S 요청사항 내용입니다.'
    table_header = '<table border="1" cellpadding="6"><tr><th>순서</th><th>구분</th><th>제목</th><th>제출일</th><th>접수일</th><th>완료일</th><th>작성자</th></tr>'

    # 조건 1: 어제 생성 또는 어제 수정된 건 → jiyong-choi@hanmail.net
    cs_ref = db.collection('bta_customerservice')
    cond1_docs = []
    for doc in cs_ref.stream():
        d = doc.to_dict()
        create_ymd = (d.get('create_ymd') or '').strip()
        update_date = d.get('update_date')
        update_ymd = ''
        if update_date:
            try:
                update_ymd = update_date.strftime('%Y%m%d')
            except Exception:
                update_ymd = str(update_date)[:8] if len(str(update_date)) >= 8 else ''
        if create_ymd == yesterday or update_ymd == yesterday:
            create_user = (d.get('create_user') or '').strip()
            author = get_user_name(create_user) if create_user else ''
            cd = (d.get('customerservice_cd') or '').strip()
            gubun_nm = get_lookup_value_name(db, CUSTOMERSERVICE_LOOKUP_TYPE, cd, create_ymd or yesterday) if cd else ''
            if not gubun_nm:
                gubun_nm = cd
            cond1_docs.append({
                '구분': gubun_nm,
                '제목': (d.get('title') or ''),
                '제출일': format_ymd_display(create_ymd),
                '접수일': format_ymd_display((d.get('start_ymd') or '').strip()),
                '완료일': format_ymd_display((d.get('end_ymd') or '').strip()),
                '작성자': author,
            })

    if cond1_docs:
        body = f'{table_header}{build_table_rows(cond1_docs)}</table>'
        ok, err = send_resend_email('jiyong-choi@hanmail.net', subject, body)
        if not ok:
            return False, f'Condition1 email: {err}'

    # 조건 2: start_ymd, end_ymd 가 어제인 건 → create_user의 email로 발송
    cond2_by_user = {}
    for doc in cs_ref.stream():
        d = doc.to_dict()
        start_ymd = (d.get('start_ymd') or '').strip()
        end_ymd = (d.get('end_ymd') or '').strip()
        if start_ymd == yesterday and end_ymd == yesterday:
            create_user = (d.get('create_user') or '').strip()
            if create_user not in cond2_by_user:
                cond2_by_user[create_user] = []
            create_ymd = (d.get('create_ymd') or '').strip()
            author = get_user_name(create_user) if create_user else ''
            cd = (d.get('customerservice_cd') or '').strip()
            gubun_nm = get_lookup_value_name(db, CUSTOMERSERVICE_LOOKUP_TYPE, cd, create_ymd or yesterday) if cd else ''
            if not gubun_nm:
                gubun_nm = cd
            cond2_by_user[create_user].append({
                '구분': gubun_nm,
                '제목': (d.get('title') or ''),
                '제출일': format_ymd_display(create_ymd),
                '접수일': format_ymd_display(start_ymd),
                '완료일': format_ymd_display(end_ymd),
                '작성자': author,
            })

    for uid, rows in cond2_by_user.items():
        to_email = get_user_email(uid)
        if not to_email:
            continue
        body = f'{table_header}{build_table_rows(rows)}</table>'
        ok, err = send_resend_email(to_email, subject, body)
        if not ok:
            return False, f'Condition2 email to {to_email}: {err}'

    return True, None


@app.route('/')
def index():
    return {'status': 'ok', 'service': 'customerservice-daily-email'}, 200


@app.route('/run', methods=['GET', 'POST'])
def run():
    try:
        ok, err = run_daily_email()
        if ok:
            return {'status': 'ok', 'message': 'Emails sent'}, 200
        logger.error('run_daily_email failed: %s', err)
        return {'status': 'error', 'message': err or 'Unknown error'}, 500
    except Exception as e:
        logger.exception('Exception in /run: %s', e)
        return {'status': 'error', 'message': str(e)}, 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
