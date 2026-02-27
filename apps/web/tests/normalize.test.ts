import { describe, it, expect } from 'vitest';
import { normalizeCampaignType, normalizeMediaType } from '../sources/normalize';

describe('normalize', () => {
    it('normalizes VST campaigns properly', () => {
        expect(normalizeCampaignType('방문 체험단')).toBe('VST');
        expect(normalizeCampaignType('Visit needed')).toBe('VST');
    });

    it('normalizes SHP campaigns properly', () => {
        expect(normalizeCampaignType('배송 캠페인')).toBe('SHP');
        expect(normalizeCampaignType('delivery option')).toBe('SHP');
    });

    it('defaults to PRS for reporters / unknown', () => {
        expect(normalizeCampaignType('기자단 모집')).toBe('PRS');
        expect(normalizeCampaignType('무관')).toBe('PRS');
    });

    it('normalizes BP properly', () => {
        expect(normalizeMediaType('네이버 블로그')).toBe('BP');
        expect(normalizeMediaType('blog review')).toBe('BP');
    });

    it('normalizes IP properly', () => {
        expect(normalizeMediaType('인스타그램 릴스')).toBe('IP');
        expect(normalizeMediaType('insta photo')).toBe('IP');
    });

    it('normalizes YP properly', () => {
        expect(normalizeMediaType('유튜브 쇼츠')).toBe('YP');
        expect(normalizeMediaType('youtube video')).toBe('YP');
    });
});
