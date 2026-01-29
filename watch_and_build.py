#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
파일 변경 감지 시 자동으로 정적 파일 빌드를 실행하는 스크립트
"""
import os
import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class BuildHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_build_time = 0
        self.build_delay = 2  # 파일 변경 후 2초 대기 후 빌드
        
    def should_build(self, file_path):
        """빌드가 필요한 파일인지 확인"""
        if not file_path:
            return False
        
        # templates 폴더의 .html 파일
        if 'templates' in file_path and file_path.endswith('.html'):
            return True
        
        # static 폴더의 .css, .js 파일
        if 'static' in file_path and (file_path.endswith('.css') or file_path.endswith('.js')):
            return True
        
        # app.py나 build_static.py 변경 시
        if file_path.endswith('app.py') or file_path.endswith('build_static.py'):
            return True
        
        return False
    
    def on_modified(self, event):
        if event.is_directory:
            return
        
        if self.should_build(event.src_path):
            current_time = time.time()
            # 너무 빠른 연속 변경 방지
            if current_time - self.last_build_time < self.build_delay:
                return
            
            self.last_build_time = current_time
            print(f'\n[변경 감지] {event.src_path}')
            print('[빌드 시작]...')
            self.build()
    
    def on_created(self, event):
        if event.is_directory:
            return
        
        if self.should_build(event.src_path):
            print(f'\n[새 파일 생성] {event.src_path}')
            print('[빌드 시작]...')
            self.build()
    
    def build(self):
        """빌드 실행"""
        try:
            result = subprocess.run(
                [sys.executable, 'build_static.py'],
                cwd=os.path.dirname(os.path.abspath(__file__)),
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            
            if result.returncode == 0:
                print('[빌드 완료] ✓\n')
            else:
                print(f'[빌드 오류] {result.stderr}\n')
        except Exception as e:
            print(f'[빌드 실행 오류] {e}\n')

def main():
    print('=' * 60)
    print('파일 변경 감지 및 자동 빌드 시작')
    print('=' * 60)
    print('감시 대상: templates/, static/, app.py, build_static.py')
    print('종료하려면 Ctrl+C를 누르세요')
    print('=' * 60)
    
    # 초기 빌드 실행
    print('\n[초기 빌드 실행]...')
    handler = BuildHandler()
    handler.build()
    
    # 파일 감시 시작
    event_handler = BuildHandler()
    observer = Observer()
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 감시할 디렉토리들
    watch_dirs = [
        os.path.join(base_dir, 'templates'),
        os.path.join(base_dir, 'static'),
        base_dir  # app.py, build_static.py 감시
    ]
    
    for watch_dir in watch_dirs:
        if os.path.exists(watch_dir):
            observer.schedule(event_handler, watch_dir, recursive=True)
            print(f'감시 시작: {watch_dir}')
    
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print('\n\n[감시 종료]')
        observer.stop()
    
    observer.join()

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print('watchdog 라이브러리가 필요합니다.')
        print('설치 명령: pip install watchdog')
        sys.exit(1)
