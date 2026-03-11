import os
import shutil
from flask import Flask
from firebase_init import get_firebase_config

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SERVER_NAME'] = 'localhost'
app.config['APPLICATION_ROOT'] = '/'
app.config['PREFERRED_URL_SCHEME'] = 'https'

firebase_config = get_firebase_config()

@app.route('/')
def main_page():
    return app.send_static_file('index.html') if os.path.exists('public/index.html') else ''

if __name__ == '__main__':
    if not os.path.exists('public'):
        os.makedirs('public')
    
    print("정적 파일 빌드 시작...")
    
    with app.app_context(), app.test_request_context():
        from flask import render_template
        
        routes = [
            ('/', 'main.html', {}),
            ('/login', 'login.html', {}),
            ('/signup', 'signup.html', {}),
            ('/forgot-password', 'forgot_password.html', {}),
        ]
        
        room_types = ['coach', 'student', 'parent', 'system']
        for room_type in room_types:
            room_names = {
                'coach': '스탭방',
                'student': '훈련생방',
                'parent': '학부모방',
                'system': '관리자'
            }
            room_name = room_names.get(room_type, '관리자')
            # 모든 권한에서 announcements_system.html 사용 (관리자가 아닌 경우 버튼 숨김)
            routes.append((f'/announcements/{room_type}', 'announcements_system.html', {
                'room_type': room_type,
                'room_name': room_name
            }))
        
        menu_items = {
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
            'organization-chart': '조직도조회',
            'customerservice': 'C/S 요청'
        }
        
        for room_type in room_types:
            for menu_item, menu_name in menu_items.items():
                room_names = {
                    'coach': '스탭방',
                    'student': '훈련생방',
                    'parent': '학부모님',
                    'system': '시스템'
                }
                room_name = room_names.get(room_type, '시스템')
                if menu_item == 'common-code':
                    template_name = 'common_code.html'
                elif menu_item == 'user':
                    template_name = 'user.html'
                elif menu_item == 'event' and room_type == 'system':
                    template_name = 'class_assignment.html'
                elif menu_item == 'parent-registration' and room_type == 'system':
                    template_name = 'parent_registration.html'
                elif menu_item == 'assignment-list' and room_type == 'system':
                    template_name = 'task_list.html'
                elif menu_item == 'organization' and room_type == 'system':
                    template_name = 'organization.html'
                elif menu_item == 'user-assignment' and room_type == 'system':
                    template_name = 'user_assignment.html'
                elif menu_item == 'organization-chart' and room_type == 'system':
                    template_name = 'organization_chart.html'
                elif menu_item == 'customerservice' and room_type == 'system':
                    template_name = 'customerservice.html'
                elif menu_item == 'student-select' and room_type == 'coach':
                    template_name = 'coach_assignment_submit.html'
                elif menu_item == 'assignment-submit' and room_type == 'student':
                    template_name = 'student_assignment_submit.html'
                elif menu_item == 'assignment-submit' and room_type == 'parent':
                    template_name = 'parent_assignment_submit.html'
                else:
                    template_name = 'menu_page.html'
                routes.append((f'/menu/{room_type}/{menu_item}', template_name, {
                    'room_type': room_type,
                    'room_name': room_name,
                    'menu_item': menu_item,
                    'menu_name': menu_name
                }))
        
        for route, template, context in routes:
            try:
                html = render_template(template, firebase_config=firebase_config, **context)
                
                if isinstance(html, bytes):
                    html = html.decode('utf-8')
                
                path = route.lstrip('/')
                if not path:
                    path = 'index'
                
                if route == '/':
                    file_path = os.path.join('public', 'index.html')
                else:
                    file_path = os.path.join('public', f'{path}.html')
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                import re
                html_content = html
                
                if route != '/':
                    depth = path.count('/')
                    prefix = '../' * depth
                    html_content = re.sub(r'href="/menu/([^"]+)"', rf'href="{prefix}menu/\1.html"', html_content)
                    html_content = re.sub(r'href="/announcements/([^"]+)"', rf'href="{prefix}announcements/\1.html"', html_content)
                    html_content = html_content.replace('href="/', f'href="{prefix}').replace(f'href="{prefix}login"', f'href="{prefix}login.html"').replace(f'href="{prefix}signup"', f'href="{prefix}signup.html"').replace(f'href="{prefix}forgot-password"', f'href="{prefix}forgot-password.html"')
                    html_content = html_content.replace('src="/static/', f'src="{prefix}static/').replace('href="/static/', f'href="{prefix}static/')
                    html_content = html_content.replace('window.location.href = \'/login\'', f'window.location.href = \'{prefix}login.html\'')
                    html_content = html_content.replace('window.location.href = "/login"', f'window.location.href = "{prefix}login.html"')
                    html_content = html_content.replace('window.location.href = \'/\'', f'window.location.href = \'{prefix}index.html\'')
                    html_content = html_content.replace('window.location.href = "/"', f'window.location.href = "{prefix}index.html"')
                else:
                    html_content = re.sub(r'href="/menu/([^"]+)"', r'href="./menu/\1.html"', html_content)
                    html_content = re.sub(r'href="/announcements/([^"]+)"', r'href="./announcements/\1.html"', html_content)
                    html_content = html_content.replace('href="/login"', 'href="./login.html"').replace('href="/signup"', 'href="./signup.html"').replace('href="/forgot-password"', 'href="./forgot-password.html"')
                    html_content = html_content.replace('href="/"', 'href="./index.html"')
                    html_content = html_content.replace('window.location.href = \'/login\'', 'window.location.href = \'./login.html\'')
                    html_content = html_content.replace('window.location.href = "/login"', 'window.location.href = "./login.html"')
                    html_content = html_content.replace('window.location.href = \'/\'', 'window.location.href = \'./index.html\'')
                    html_content = html_content.replace('window.location.href = "/"', 'window.location.href = "./index.html"')
                html_content = html_content.replace('src="/static/', 'src="./static/').replace('href="/static/', 'href="./static/')
                
                with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
                    f.write(html_content)
                print(f"생성됨: {file_path}")
            except Exception as e:
                print(f"오류 ({route}): {e}")
    
    if os.path.exists('static'):
        static_dest = os.path.join('public', 'static')
        if os.path.exists(static_dest):
            try:
                shutil.rmtree(static_dest)
            except (PermissionError, OSError):
                import time
                time.sleep(0.5)
                try:
                    shutil.rmtree(static_dest)
                except (PermissionError, OSError):
                    print("경고: 일부 파일이 사용 중입니다. 개별 파일 복사로 진행합니다...")
                    for root, dirs, files in os.walk('static'):
                        rel_dir = os.path.relpath(root, 'static')
                        dest_dir = os.path.join(static_dest, rel_dir) if rel_dir != '.' else static_dest
                        os.makedirs(dest_dir, exist_ok=True)
                        for file in files:
                            src_file = os.path.join(root, file)
                            dest_file = os.path.join(dest_dir, file)
                            try:
                                shutil.copy2(src_file, dest_file)
                            except (PermissionError, OSError):
                                pass
                    print("정적 파일 복사 완료")
                    print("빌드 완료! public 폴더를 확인하세요.")
                    exit(0)
        shutil.copytree('static', static_dest)
        print("정적 파일 복사 완료")
    
    print("빌드 완료! public 폴더를 확인하세요.")
