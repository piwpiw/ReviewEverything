# Pull Request Checklist

## 변경 타입
- [ ] docs-only
- [ ] 기능/코드 변경
- [ ] 배포/CI/운영 규칙 변경

## 1) 문서-코드 정합성 (필수)
- [ ] `npm run api:contract-audit` 실행 완료
- [ ] `npm run api:contract-sync-audit` 실행 완료
- [ ] `apps/web/docs/PROJECT_STATUS_NEXT_ACTIONS.md` `12.9 API 정합성 즉시 점검` 최신 반영

## 2) 구현/계획 라벨 점검 (필수)
- [ ] implemented 항목만 실제 라우트 구현과 일치
- [ ] planned 항목에 공개 노출 누락/노출 경로 오해 없음
- [ ] `POST /api/admin/alerts/actions`, `/api/admin/runs`, `/api/admin/quality`, `/api/admin/alerts`는 implemented 반영

## 3) UI/UX / 운영(해당 시)
- [ ] `ui-qa-summary.md` 또는 동등 증빙 첨부
- [ ] 화면/문구 변경 시 `TEAM_CONTEXT.md #screen_delivery`와 일치

## 4) 스크린/증빙 링크
- [ ] 관련 UI 스크린샷 또는 API 응답 증빙 첨부
- [ ] 회귀 실패/재현 증거 첨부
