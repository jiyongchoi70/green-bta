from flask import Flask, render_template, jsonify, request
from firebase_init import init_firebase, get_firebase_config, FIREBASE_ADMIN_AVAILABLE
import firebase_init

try:
    from firebase_admin import auth as firebase_auth
except ImportError:
    firebase_auth = None

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

firebase_config = get_firebase_config()
init_firebase()

@app.route('/')
def main_page():
    return render_template('main.html', firebase_config=firebase_config)

@app.route('/login')
def login_page():
    return render_template('login.html', firebase_config=firebase_config)

@app.route('/signup')
def signup_page():
    return render_template('signup.html', firebase_config=firebase_config)

@app.route('/forgot-password')
def forgot_password_page():
    return render_template('forgot_password.html', firebase_config=firebase_config)

@app.route('/announcements/<room_type>')
def announcements(room_type):
    room_names = {
        'coach': '스탭방',
        'student': '훈련생방',
        'parent': '학부모방',
        'system': '관리자'
    }
    room_name = room_names.get(room_type, '관리자')
    # 모든 권한에서 announcements_system.html 사용 (관리자가 아닌 경우 버튼 숨김)
    return render_template('announcements_system.html', room_type=room_type, room_name=room_name, firebase_config=firebase_config)

@app.route('/test-organization')
def test_organization():
    return "Organization page is working!"

@app.route('/menu/<room_type>/<menu_item>')
def menu_page(room_type, menu_item):
    room_names = {
        'coach': '스탭방',
        'student': '훈련생방',
        'parent': '부모님방',
        'system': '시스템'
    }
    menu_names = {
        'training': '훈련자료',
        'assignment-guide': '과제안내',
        'student-select': '학생선택',
        'record-assignment': '기록과제물',
        'assignment-submit': '과제제출확인',
        'help': '도움자료',
        'event': '행사신청',
        'user': '사용자',
        'permission': '권한관리',
        'assignment-list': '과제목록',
        'common-code': '공통코드',
        'parent-registration': '학부모 자녀매칭',
        'organization': '조직도',
        'user-assignment': '발령',
        'organization-chart': '조직도조회'
    }
    room_name = room_names.get(room_type, '시스템')
    menu_name = menu_names.get(menu_item, menu_item)
    
    if menu_item == 'common-code':
        return render_template('common_code.html', firebase_config=firebase_config)
    
    if menu_item == 'user':
        return render_template('user.html', firebase_config=firebase_config)
    
    if menu_item == 'event' and room_type == 'system':
        return render_template('class_assignment.html', firebase_config=firebase_config)
    
    if menu_item == 'parent-registration' and room_type == 'system':
        return render_template('parent_registration.html', firebase_config=firebase_config)
    
    if menu_item == 'assignment-list' and room_type == 'system':
        return render_template('task_list.html', firebase_config=firebase_config)
    
    if menu_item == 'organization' and room_type == 'system':
        return render_template('organization.html', firebase_config=firebase_config)
    
    if menu_item == 'user-assignment' and room_type == 'system':
        return render_template('user_assignment.html', firebase_config=firebase_config)
    
    if menu_item == 'organization-chart' and room_type == 'system':
        return render_template('organization_chart.html', firebase_config=firebase_config)
    
    if menu_item == 'assignment-submit' and room_type == 'student':
        return render_template('student_assignment_submit.html', firebase_config=firebase_config)
    
    if menu_item == 'assignment-submit' and room_type == 'parent':
        return render_template('parent_assignment_submit.html', firebase_config=firebase_config)
    
    # 코치 과제제출확인: 메뉴는 student-select 링크로 연결됨
    if menu_item == 'student-select' and room_type == 'coach':
        return render_template('coach_assignment_submit.html', firebase_config=firebase_config)
    
    return render_template('menu_page.html', room_type=room_type, room_name=room_name, menu_item=menu_item, menu_name=menu_name, firebase_config=firebase_config)

@app.route('/api/firebase-config')
def get_firebase_config_api():
    return jsonify(firebase_config)


@app.route('/api/delete-user', methods=['POST'])
def api_delete_user():
    """사용자 삭제: Firebase Authentication 사용자 삭제 후 Firestore bta_users 문서 삭제."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization token required'}), 401
    token = auth_header[7:]
    try:
        if firebase_auth:
            firebase_auth.verify_id_token(token)
    except Exception as e:
        return jsonify({'error': 'Invalid or expired token', 'detail': str(e)}), 401
    data = request.get_json() or {}
    document_id = (data.get('document_id') or '').strip()
    uid = (data.get('uid') or '').strip()
    if not document_id:
        return jsonify({'error': 'document_id is required'}), 400
    try:
        if FIREBASE_ADMIN_AVAILABLE and firebase_auth and uid:
            try:
                firebase_auth.delete_user(uid)
            except firebase_auth.UserNotFoundError:
                pass  # Auth에 해당 사용자가 없으면 무시하고 Firestore만 삭제
        if firebase_init.db:
            firebase_init.db.collection('bta_users').document(document_id).delete()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
