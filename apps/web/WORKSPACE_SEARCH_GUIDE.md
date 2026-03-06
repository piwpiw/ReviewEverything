# Workspace Search

## 빠른 실행

```bash
# 1) 인덱스 생성
npm run index:workspace
npm run index:workspace:full

# 2) 검색
npm run search:workspace -- --q=keyword           # 자동 모드(권장)
npm run search:workspace:lean -- --q=keyword      # 성능 우선
npm run search:workspace:full -- --q=keyword      # 정확도 우선
npm run search:workspace -- --q=pattern --regex    # 정규식
npm run search:workspace -- --q=keyword --limit=80 # 후보 제한
npm run search:workspace -- --q=keyword --json     # 자동 처리용 JSON
```

## 모드 규칙

- 기본값은 `auto` 모드입니다.
- `auto`는 질의가 짧으면 우선 `full` 인덱스를 사용하고,
  아니면 `lean`로 시작합니다.
- `lean` 결과가 부족하면 `full` 인덱스로 자동 업그레이드합니다.

## 벤치마크

```bash
npm run bench:workspace-search                     # 기본 쿼리 (lean/full/auto)
npm run bench:workspace-search:lean                # lean만
npm run bench:workspace-search:full                # full만
npm run bench:workspace-search:auto                 # auto만
npm run bench:workspace-search:ci                  # 임계값 가드 포함(CI용)
npm run bench:workspace-search -- --skip-build --queries=metadata,page --limit=60
```

- 벤치 결과: `apps/web/reports/workspace-search-bench.json`
- 벤치 요약: `apps/web/reports/workspace-search-bench.md`
- `--guard`는 임계값 회귀가 감지되면 실행이 실패(exit 1)합니다.

## 산출물

- `apps/web/reports/workspace-index-lean.json`
- `apps/web/reports/workspace-index-full.json`
- `apps/web/reports/workspace-index.json` (최근 생성본 별칭)
- `apps/web/reports/workspace-index.md`
