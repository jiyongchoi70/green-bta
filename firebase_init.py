import json
import os

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage, auth
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    FIREBASE_ADMIN_AVAILABLE = False

firebase_app = None
db = None
bucket = None

def init_firebase():
    global firebase_app, db, bucket
    
    if not FIREBASE_ADMIN_AVAILABLE:
        print("firebase-admin이 설치되지 않았습니다. 클라이언트 측 Firebase만 사용합니다.")
        return False
    
    if firebase_app is None:
        try:
            service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            
            if service_account_path and os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
            else:
                try:
                    cred = credentials.ApplicationDefault()
                except:
                    print("서비스 계정 키 파일이 없습니다. 클라이언트 측 Firebase만 사용합니다.")
                    return False
            
            with open('firebase-config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            project_id = config.get('project_info', {}).get('project_id')
            
            if not project_id:
                raise ValueError("프로젝트 ID를 찾을 수 없습니다.")
            
            firebase_app = firebase_admin.initialize_app(
                cred,
                {
                    'projectId': project_id,
                    'storageBucket': config.get('project_info', {}).get('storage_bucket', f'{project_id}.appspot.com')
                }
            )
            
            db = firestore.client()
            bucket = storage.bucket()
            
            print(f"Firebase Admin SDK 초기화 완료: {project_id}")
            return True
        except Exception as e:
            pass
            return False
    
    return True

def get_firebase_config():
    try:
        with open('firebase-config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        project_info = config.get('project_info', {})
        api_key = None
        
        if 'client' in config and len(config['client']) > 0:
            api_key = config['client'][0].get('api_key', [{}])[0].get('current_key')
        
        return {
            'project_id': project_info.get('project_id'),
            'api_key': api_key,
            'storage_bucket': project_info.get('storage_bucket')
        }
    except Exception as e:
        print(f"Firebase 설정 읽기 오류: {e}")
        return None
