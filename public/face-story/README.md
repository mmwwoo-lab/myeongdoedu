# 명도재 이명우의 관상앱

사진·카메라로 입력한 실제 사진에 얼굴 윤곽·눈썹·눈·입술을 붉은 선으로 표시하고 부분별 설명을 제공합니다. 별도 얼굴 도식은 화면에서 사용하지 않습니다. 관광지 사진 자판기 색상과 입체 버튼을 적용했습니다.

## 실행

독립 소스 묶음에서는 node server.mjs 실행. 이 저장소에서는 public/을 HTTP 서버로 서비스합니다.

저장소 배포 경로는 /face-story/입니다. 카메라는 HTTPS 또는 localhost 및 사용자 권한이 필요합니다. file:// 직접 실행은 지원하지 않습니다. Node 22 이상 권장. npm 설치나 API 키는 필요하지 않습니다.

## 관찰·운세

닉네임은 필수, 나이·성별은 선택입니다. 전체 관찰500자·부분별각200자 이내. 운세는 직접 선택한 관심 주제에 따른 창작이며 전체·분야별·12개월 상징 이야기와 토정비결풍 해설을 제공합니다. 나이는 화면의 생활 제안, 성별은 프로필 표시만 사용합니다. 얼굴·나이·성별에서 실제 미래를 예측하지 않습니다. 정통 토정비결 괘를 계산하지 않습니다.

## 개인정보·저장

기기 내 처리만 사용하며 사진·입력값을 서버로 업로드하지 않습니다. 감정서 PNG에는 사진·닉네임, 표시 사진 PNG에는 사진, TXT에는 닉네임·설명·운세가 포함됩니다. 나이·성별·연령별 제안은 파일에서 제외합니다. 파일 공유 전 내용을 확인하세요. 전체 삭제와 카메라 종료를 제공합니다. 이미 저장한 파일·호스팅 일반 접속 로그는 별개입니다.

## 주요 파일

dist/app.mjs: 입력·처리·삭제·저장
dist/photo-annotations.mjs: 실제 사진 붉은 선 표시
dist/fortune.mjs: 창작 운세와 연령별 생활 제안
dist/face-core.mjs: 형태 분류와 설명
dist/report-canvas.mjs: 사진과 전체 해설 PNG
dist/styles.css, camera-theme.css, tourist-theme.css: 반응형 자판기 디자인
dist/vendor/: MediaPipe 로컬 모델·WASM·Apache 2.0 LICENSE

문화 배경: https://encykorea.aks.ac.kr/Article/E0059207
기술: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
