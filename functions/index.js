const { onCall, HttpsError } = require('firebase-functions/v2/https');

exports.deleteAuthUser = onCall(
  { region: 'asia-northeast3' },
  async (request) => {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const uid = (request.data && request.data.uid) || '';
    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid가 필요합니다.');
    }

    try {
      await admin.auth().deleteUser(uid);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return { success: true, message: 'skipped' };
      }
      console.error('Auth 삭제 오류:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
