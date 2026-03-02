import { describe, it, expect, vi } from 'vitest';

// Mock Prisma so normalize.ts can be imported without a generated client
vi.mock('../lib/db', () => ({ db: {} }));

import { normalizeCampaignType, normalizeMediaType } from '../sources/normalize';

describe('normalizeCampaignType', () => {
    // VST
    it('normalizes 방문 → VST', () => {
        expect(normalizeCampaignType('방문 체험')).toBe('VST');
    });
    it('normalizes visit (EN) → VST', () => {
        expect(normalizeCampaignType('Visit needed')).toBe('VST');
    });
    it('is case-insensitive for VISIT keyword', () => {
        expect(normalizeCampaignType('VISIT cafe')).toBe('VST');
    });

    // SHP
    it('normalizes 배달 → SHP', () => {
        expect(normalizeCampaignType('배달 캠페인')).toBe('SHP');
    });
    it('normalizes delivery (EN) → SHP', () => {
        expect(normalizeCampaignType('delivery option')).toBe('SHP');
    });
    it('is case-insensitive for DELIVERY keyword', () => {
        expect(normalizeCampaignType('FREE DELIVERY')).toBe('SHP');
    });

    // PRS fallback
    it('defaults 자다리 → PRS', () => {
        expect(normalizeCampaignType('자다리 형')).toBe('PRS');
    });
    it('defaults unknown string → PRS', () => {
        expect(normalizeCampaignType('알수없음')).toBe('PRS');
    });
    it('defaults empty string → PRS', () => {
        expect(normalizeCampaignType('')).toBe('PRS');
    });

    // Edge: Both keywords - first match wins
    it('prefers VST over SHP if both found (visit first)', () => {
        expect(normalizeCampaignType('방문+배달 형')).toBe('VST'); // '방문' matched first
    });
});

describe('normalizeMediaType', () => {
    // BP
    it('normalizes 블로그 → BP', () => {
        expect(normalizeMediaType('이미지 블로그')).toBe('BP');
    });
    it('normalizes blog (EN) → BP', () => {
        expect(normalizeMediaType('blog review')).toBe('BP');
    });
    it('is case-insensitive for BLOG', () => {
        expect(normalizeMediaType('BLOG post')).toBe('BP');
    });

    // IP
    it('normalizes 인스타 → IP', () => {
        expect(normalizeMediaType('인스타그램 형')).toBe('IP');
    });
    it('normalizes insta (EN) → IP', () => {
        expect(normalizeMediaType('insta photo')).toBe('IP');
    });

    // YP
    it('normalizes 유튜브 → YP', () => {
        expect(normalizeMediaType('유튜브 형')).toBe('YP');
    });
    it('normalizes youtube (EN) → YP', () => {
        expect(normalizeMediaType('youtube video')).toBe('YP');
    });
    it('is case-insensitive for YOUTUBE', () => {
        expect(normalizeMediaType('YOUTUBE Shorts')).toBe('YP');
    });

    // OTHER fallback
    it('normalizes 틱톡 → TK', () => {
        expect(normalizeMediaType('틱톡 형')).toBe('TK');
    });
    it('defaults to OTHER for empty string', () => {
        expect(normalizeMediaType('')).toBe('OTHER');
    });
});

// ─── T02 추가: normalizeRewardValue 심층 픽스처 테스트 ───────────────────────

import { normalizeRewardValue, normalizeRegion, normalizeRewardValueWithConfidence } from '../sources/normalize';

describe('normalizeRewardValue', () => {
    // 만원 단위
    it('parses 5만원 → 50000', () => {
        expect(normalizeRewardValue('5만원')).toBe(50000);
    });
    it('parses 10만원 → 100000', () => {
        expect(normalizeRewardValue('10만원')).toBe(100000);
    });
    it('parses 10만 원 (with space) → 100000', () => {
        expect(normalizeRewardValue('10만 원')).toBe(100000);
    });
    it('parses 5만 (without won) → 50000', () => {
        expect(normalizeRewardValue('5만')).toBe(50000);
    });
    it('parses 2.5만원 → 25000', () => {
        expect(normalizeRewardValue('2.5만원')).toBe(25000);
    });

    // 억 단위
    it('parses 1억 → 100000000', () => {
        expect(normalizeRewardValue('1억')).toBe(100000000);
    });
    it('parses 1.5억 → 150000000', () => {
        expect(normalizeRewardValue('1.5억')).toBe(150000000);
    });

    // 천원 단위
    it('parses 500천원 → 500000', () => {
        expect(normalizeRewardValue('500천원')).toBe(500000);
    });

    // 외화
    it('parses 100달러 → 130000', () => {
        expect(normalizeRewardValue('100달러')).toBe(130000);
    });
    it('parses 50usd → 65000', () => {
        expect(normalizeRewardValue('50usd')).toBe(65000);
    });

    // 복합 텍스트 (최댓값 선택)
    it('parses "원고료 10만 + 제품 5만" → 100000', () => {
        expect(normalizeRewardValue('원고료 10만 + 제품 5만')).toBe(100000);
    });
    it('picks max from "3만원~5만원" → 50000', () => {
        expect(normalizeRewardValue('3만원~5만원')).toBe(50000);
    });

    // fallback: 4자리 이상 숫자
    it('fallback: bare number 15000 → 15000', () => {
        expect(normalizeRewardValue('15000')).toBe(15000);
    });
    it('does not fallback for 3 digits: 500 → 0', () => {
        expect(normalizeRewardValue('500')).toBe(0);
    });

    // edge cases
    it('empty string → 0', () => {
        expect(normalizeRewardValue('')).toBe(0);
    });
    it('no numbers → 0', () => {
        expect(normalizeRewardValue('무료 체험')).toBe(0);
    });
    it('text only "무료 제공" → 0', () => {
        expect(normalizeRewardValue('무료 제공')).toBe(0);
    });
});

// ─── normalizeRegion 테스트 ──────────────────────────────────────────────────

describe('normalizeRegion', () => {
    it('splits "서울 강남구" → ["서울", "강남구"]', () => {
        const [d1, d2] = normalizeRegion('서울 강남구');
        expect(d1).toBe('서울');
        expect(d2).toBe('강남구');
    });
    it('splits "부산 해운대구" → ["부산", "해운대구"]', () => {
        const [d1, d2] = normalizeRegion('부산 해운대구');
        expect(d1).toBe('부산');
        expect(d2).toBe('해운대구');
    });
    it('handles empty string → [null, null]', () => {
        const [d1, d2] = normalizeRegion('');
        expect(d1).toBeNull();
        expect(d2).toBeNull();
    });
    it('handles single word → [word, null]', () => {
        const [d1, d2] = normalizeRegion('서울');
        expect(d1).toBe('서울');
        expect(d2).toBeNull();
    });
    it('handles slash separator "서울/강남" → ["서울", "강남"]', () => {
        const [d1, d2] = normalizeRegion('서울/강남');
        expect(d1).toBe('서울');
        expect(d2).toBe('강남');
    });
});

// ─── normalizeRewardValueWithConfidence 테스트 ───────────────────────────────

describe('normalizeRewardValueWithConfidence', () => {
    it('returns HIGH confidence for single unit parse', () => {
        const result = normalizeRewardValueWithConfidence('5만원');
        expect(result.value).toBe(50000);
        expect(result.confidence).toBe('HIGH');
        expect(result.method).toBe('unit_parse');
    });
    it('returns MEDIUM confidence for multiple unit candidates', () => {
        const result = normalizeRewardValueWithConfidence('3만원~5만원');
        expect(result.value).toBe(50000);
        expect(result.confidence).toBe('MEDIUM');
        expect(result.method).toBe('unit_parse');
    });
    it('returns LOW confidence for fallback number', () => {
        const result = normalizeRewardValueWithConfidence('50000');
        expect(result.value).toBe(50000);
        expect(result.confidence).toBe('LOW');
        expect(result.method).toBe('fallback_number');
    });
    it('returns LOW confidence with value=0 for empty', () => {
        const result = normalizeRewardValueWithConfidence('');
        expect(result.value).toBe(0);
        expect(result.confidence).toBe('LOW');
        expect(result.method).toBe('zero');
    });
    it('returns LOW confidence with value=0 for non-numeric text', () => {
        const result = normalizeRewardValueWithConfidence('무료 체험');
        expect(result.value).toBe(0);
        expect(result.method).toBe('zero');
    });
});
