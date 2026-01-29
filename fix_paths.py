import re
import os

def fix_html_paths(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'href="/menu/([^"]+)"', r'href="./menu/\1.html"', content)
    content = re.sub(r'href="/announcements/([^"]+)"', r'href="./announcements/\1.html"', content)
    content = re.sub(r'href="/"', r'href="./index.html"', content)
    content = re.sub(r'window\.location\.href\s*=\s*[\'"]/[\'"]', r'window.location.href = "./index.html"', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"수정 완료: {file_path}")

if __name__ == '__main__':
    fix_html_paths('public/index.html')
    print("모든 경로 수정 완료!")
