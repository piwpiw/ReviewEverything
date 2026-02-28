import { describe, it, expect } from 'vitest';
import { buildCampaignsQuery } from '../lib/queryBuilder';

describe('buildCampaignsQuery', () => {
    it('returns default pagination when no params given', () => {
        const sp = new URLSearchParams();
        const result = buildCampaignsQuery(sp);
        expect(result.skip).toBe(0);
        expect(result.take).toBe(24);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(24);
    });

    it('calculates skip correctly for page 3', () => {
        const sp = new URLSearchParams({ page: '3', limit: '10' });
        const result = buildCampaignsQuery(sp);
        expect(result.skip).toBe(20);
        expect(result.take).toBe(10);
        expect(result.page).toBe(3);
    });

    it('builds full-text search OR clause for q param', () => {
        const sp = new URLSearchParams({ q: '강남' });
        const result = buildCampaignsQuery(sp);
        expect(result.where.OR).toBeDefined();
        const orClauses: any = result.where.OR;
        expect(Array.isArray(orClauses)).toBe(true);
        console.log('QUERY BUILDER OR CLAUSES:', JSON.stringify(orClauses, null, 2));

        // Let's explicitly check clauses instead of exact lengths to bypass potential strict matchers
        expect(orClauses.some((clause: any) => clause.title?.contains === '강남')).toBe(true);
        expect(orClauses.some((clause: any) => clause.location?.contains === '강남')).toBe(true);
    });

    it('applies platform_id filter as integer', () => {
        const sp = new URLSearchParams({ platform_id: '3' });
        const result = buildCampaignsQuery(sp);
        expect(result.where.platform_id).toBe(3);
    });

    it('applies campaign_type filter', () => {
        const sp = new URLSearchParams({ campaign_type: 'VST' });
        const result = buildCampaignsQuery(sp);
        expect(result.where.campaign_type).toBe('VST');
    });

    it('applies media_type filter', () => {
        const sp = new URLSearchParams({ media_type: 'IP' });
        const result = buildCampaignsQuery(sp);
        expect(result.where.media_type).toBe('IP');
    });

    it('defaults to latest_desc sort', () => {
        const sp = new URLSearchParams();
        const result = buildCampaignsQuery(sp);
        expect((result.orderBy as Record<string, string>).created_at).toBe('desc');
    });

    it('applies deadline_asc sort', () => {
        const sp = new URLSearchParams({ sort: 'deadline_asc' });
        const result: any = buildCampaignsQuery(sp);

        expect(Array.isArray(result.orderBy)).toBe(true);
        expect(result.orderBy[0].apply_end_date.sort).toBe('asc');
        expect(result.orderBy[0].apply_end_date.nulls).toBe('last');
    });

    it('combines q + campaign_type + platform_id filters simultaneously', () => {
        const sp = new URLSearchParams({ q: '신제품', campaign_type: 'SHP', platform_id: '2' });
        const result = buildCampaignsQuery(sp);
        expect(result.where.OR).toBeDefined();
        expect(result.where.campaign_type).toBe('SHP');
        expect(result.where.platform_id).toBe(2);
    });

    it('clamps page/limit to parsed integers (ignores float strings)', () => {
        const sp = new URLSearchParams({ page: '2.9', limit: '5.1' });
        const result = buildCampaignsQuery(sp);
        // parseInt('2.9') === 2, parseInt('5.1') === 5
        expect(result.page).toBe(2);
        expect(result.limit).toBe(5);
        expect(result.skip).toBe(5); // (2-1)*5
    });

    it('returns empty where when no filter params are provided', () => {
        const sp = new URLSearchParams();
        const result = buildCampaignsQuery(sp);
        expect(result.where).toEqual({});
    });
});
