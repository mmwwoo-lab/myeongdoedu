# myeongdoedu
명도재 초등,중등 학습게임

## 결 · 관상 문화 이야기

`public/face-story/`에 사진·카메라 입력, 기기 내 얼굴 형태 측정, SVG 그림과 문화 설명 웹앱을 추가했습니다. Vercel의 기존 `outputDirectory: public` 설정에서 `/face-story/`로 제공합니다. 실제 공개 주소는 배포 결과를 확인하세요.

사진·별명·나이·성별을 서버에 전송하지 않으며, 얼굴로 성격·운명을 판정하지 않습니다. 업무지시와 완료·유형·개인정보·품질 보고서는 `docs/face-story/`를 참고하세요.

검증: `node tests/face-story/core.mjs` 및 `node --experimental-vm-modules tests/face-story/integration.mjs` (Node 22 이상).
