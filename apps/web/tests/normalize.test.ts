import { describe, it, expect, vi } from 'vitest';

// Mock Prisma so normalize.ts can be imported without a generated client
vi.mock('../lib/db', () => ({ db: {} }));

import { normalizeCampaignType, normalizeMediaType } from '../sources/normalize';

describe('normalizeCampaignType', () => {
    // VST
    it('normalizes 방문 → VST', () => {
        expect(normalizeCampaignType('방문 체험단')).toBe('VST');
    });
    it('normalizes visit (EN) → VST', () => {
        expect(normalizeCampaignType('Visit needed')).toBe('VST');
    });
    it('is case-insensitive for VISIT keyword', () => {
        expect(normalizeCampaignType('VISIT cafe')).toBe('VST');
    });

    // SHP
    it('normalizes 배송 → SHP', () => {
        expect(normalizeCampaignType('배송 캠페인')).toBe('SHP');
    });
    it('normalizes delivery (EN) → SHP', () => {
        expect(normalizeCampaignType('delivery option')).toBe('SHP');
    });
    it('is case-insensitive for DELIVERY keyword', () => {
        expect(normalizeCampaignType('FREE DELIVERY')).toBe('SHP');
    });

    // PRS fallback
    it('defaults 기자단 → PRS', () => {
        expect(normalizeCampaignType('기자단 모집')).toBe('PRS');
    });
    it('defaults unknown string → PRS', () => {
        expect(normalizeCampaignType('무관')).toBe('PRS');
    });
    it('defaults empty string → PRS', () => {
        expect(normalizeCampaignType('')).toBe('PRS');
    });

    // Edge: Both keywords - first match wins
    it('prefers VST over SHP if both found (visit first)', () => {
        expect(normalizeCampaignType('방문+배송 복합')).toBe('VST'); // '방문' matched first
    });
});

describe('normalizeMediaType', () => {
    // BP
    it('normalizes 블로그 → BP', () => {
        expect(normalizeMediaType('네이버 블로그')).toBe('BP');
    });
    it('normalizes blog (EN) → BP', () => {
        expect(normalizeMediaType('blog review')).toBe('BP');
    });
    it('is case-insensitive for BLOG', () => {
        expect(normalizeMediaType('BLOG post')).toBe('BP');
    });

    // IP
    it('normalizes 인스타 → IP', () => {
        expect(normalizeMediaType('인스타그램 릴스')).toBe('IP');
    });
    it('normalizes insta (EN) → IP', () => {
        expect(normalizeMediaType('insta photo')).toBe('IP');
    });

    // YP
    it('normalizes 유튜브 → YP', () => {
        expect(normalizeMediaType('유튜브 쇼츠')).toBe('YP');
    });
    it('normalizes youtube (EN) → YP', () => {
        expect(normalizeMediaType('youtube video')).toBe('YP');
    });
    it('is case-insensitive for YOUTUBE', () => {
        expect(normalizeMediaType('YOUTUBE Shorts')).toBe('YP');
    });

    // OTHER fallback
    it('normalizes 틱톡 숏폼 → TK', () => {
        expect(normalizeMediaType('틱톡 숏폼')).toBe('TK');
    });
    it('defaults to OTHER for empty string', () => {
        expect(normalizeMediaType('')).toBe('OTHER');
    });
});
