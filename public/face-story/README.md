# 명도재 이명우의 관상앱

사진·카메라 입력과 브라우저 내 얼굴 형태 분석을 제공하는 한국어 문화 체험 앱입니다. 얼굴형 5종, 눈썹·눈·입술 각 2종, SVG 그림과 창작 도상 설명을 제공합니다. 성격·능력·건강·운명을 추론하지 않습니다.

이 디렉터리의 정적 파일을 HTTP(S)로 서비스하면 실행됩니다. 저장소의 기존 Vercel 설정은 public/을 배포하므로 앱 경로는 /face-story/입니다. 카메라는 HTTPS 또는 localhost와 사용자 권한이 필요합니다. file:// 실행은 지원하지 않습니다. npm 설치나 API 키는 필요하지 않습니다.

사진과 폼 값은 페이지 메모리에서만 처리합니다. 업로드 API·영구 저장소·추적 도구를 사용하지 않습니다. 모델은 같은 사이트의 vendor/에서 로드합니다. 별명·나이·성별은 모두 선택이며 나이·성별은 분류에 사용하지 않습니다. 전체 삭제 후 직접 저장한 결과 파일과 호스팅 접속 로그는 별개입니다.

분류는 MediaPipe 특징점 비율의 실험적 휴리스틱이며 객관적 관상 판정이 아닙니다. 촬영 각도에 영향을 받으며, 실패하면 직접 선택임을 표시합니다. 그림의 코는 공통 기호입니다. 피부색·연령 집단별 정확도는 평가하지 않았습니다.

업무지시·유형자료·개인정보·품질·개발완료 보고서는 저장소의 docs/face-story/에 있습니다. 테스트: 저장소 루트에서 node tests/face-story/core.mjs 및 node --experimental-vm-modules tests/face-story/integration.mjs (Node 22 이상).

문화 배경: https://encykorea.aks.ac.kr/Article/E0004873
기술: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
MediaPipe 0.10.22-rc.20250304, Face Landmarker float16 v1. Apache 2.0 라이선스는 vendor/LICENSE에 포함합니다. 모든 도상 감상문은 앱의 창작입니다.
최종판: 회색 카메라 디자인, 닉네임 필수·나이/성별 선택 표시, 단락별 종합감정500자·부분별200자, PNG 감정서 로컬 생성. 추가 테스트: node tests/face-story/appraisal.mjs
