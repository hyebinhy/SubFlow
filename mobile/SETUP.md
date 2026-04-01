# SubFlow Mobile 실행 가이드

## 준비물
- Node.js 18+
- 스마트폰에 **Expo Go** 앱 설치 (앱스토어/플레이스토어)
- PC와 스마트폰 **같은 Wi-Fi** 연결

## 실행

```bash
cd mobile
npm install
npx expo start
```

## 확인

- **스마트폰**: 터미널의 QR 코드를 Expo Go(Android) 또는 카메라(iPhone)로 스캔
- **웹 브라우저**: 서버 실행 후 `w` 키 입력

## 참고

| 상황 | 명령어 |
|------|--------|
| 캐시 초기화 | `npx expo start --clear` |
| 포트 변경 | `npx expo start --port 8082` |
| 웹 의존성 필요 시 | `npx expo install react-native-web react-dom` |
