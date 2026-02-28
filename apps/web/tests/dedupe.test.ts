/**
 * Dedupe & processAndDedupeCampaign Logic Tests
 *
 * These tests mock the Prisma db client so we test the logic
 * independently of a real database — zero DB dependency required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Prisma db ───────────────────────────────────────────────────────────
vi.mock('../lib/db', () => ({
    db: {
        campaign: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        campaignSnapshot: {
            create: vi.fn(),
        },
    },
}));

import { db } from '../lib/db';
import { processAndDedupeCampaign } from '../sources/normalize';
import type { ScrapedCampaign } from '../sources/types';

const PLATFORM_ID = 1;

const sampleCampaign: ScrapedCampaign = {
    original_id: 'rv_001',
    title: '강남 오마카세 체험',
    campaign_type: 'VST',
    media_type: 'BP',
    location: '서울 강남구',
    reward_text: '2인 코스 제공',
    thumbnail_url: 'https://example.com/thumb.jpg',
    url: 'https://revu.net/c/001',
    apply_end_date: new Date('2026-03-15'),
    recruit_count: 10,
    applicant_count: 4,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('processAndDedupeCampaign – new campaign', () => {
    it('creates a new Campaign + Snapshot when no existing record is found', async () => {
        vi.mocked(db.campaign.findUnique).mockResolvedValue(null as any);
        vi.mocked(db.campaign.create).mockResolvedValue({ id: 42 } as any);

        const result = await processAndDedupeCampaign(PLATFORM_ID, sampleCampaign);

        expect(db.campaign.findUnique).toHaveBeenCalledTimes(1);
        expect(db.campaign.create).toHaveBeenCalledTimes(1);

        // Verify create shape: should include inline snapshot
        const mockCallArgs: any = vi.mocked(db.campaign.create).mock.calls[0][0];

        expect(mockCallArgs.data.platform_id).toBe(PLATFORM_ID);
        expect(mockCallArgs.data.original_id).toBe('rv_001');

        const snapCreate: any = mockCallArgs.data.snapshots.create;
        expect(snapCreate.recruit_count).toBe(10);
        expect(snapCreate.applicant_count).toBe(4);
        expect(snapCreate.competition_rate).toBeCloseTo(0.4);

        expect(result.status).toBe('created');
        expect(result.id).toBe(42);
    });

    it('correctly calculates competition_rate as applicant/recruit', async () => {
        vi.mocked(db.campaign.findUnique).mockResolvedValue(null as any);
        vi.mocked(db.campaign.create).mockResolvedValue({ id: 1 } as any);

        const campaign: ScrapedCampaign = { ...sampleCampaign, recruit_count: 5, applicant_count: 15 };
        await processAndDedupeCampaign(PLATFORM_ID, campaign);

        const mockCallArgs: any = vi.mocked(db.campaign.create).mock.calls[0][0];
        const snapCreate: any = mockCallArgs.data.snapshots.create;
        expect(snapCreate.competition_rate).toBeCloseTo(3.0); // 15/5
    });

    it('sets competition_rate to 0 when recruit_count is 0 (avoids division by zero)', async () => {
        vi.mocked(db.campaign.findUnique).mockResolvedValue(null as any);
        vi.mocked(db.campaign.create).mockResolvedValue({ id: 1 } as any);

        const campaign: ScrapedCampaign = { ...sampleCampaign, recruit_count: 0, applicant_count: 0 };
        await processAndDedupeCampaign(PLATFORM_ID, campaign);

        const mockCallArgs: any = vi.mocked(db.campaign.create).mock.calls[0][0];
        const snapCreate: any = mockCallArgs.data.snapshots.create;
        expect(snapCreate.competition_rate).toBe(0);
    });
});

describe('processAndDedupeCampaign – existing campaign (upsert)', () => {
    const existingBase = {
        id: 99,
        snapshots: [
            {
                recruit_count: 10,
                applicant_count: 4,
                scraped_at: new Date(),
            },
        ],
    };

    it('updates title/apply_end_date but does NOT create new snapshot if counts unchanged', async () => {
        vi.mocked(db.campaign.findUnique).mockResolvedValue(existingBase as any);
        vi.mocked(db.campaign.update).mockResolvedValue(existingBase as any);

        const result = await processAndDedupeCampaign(PLATFORM_ID, sampleCampaign);

        expect(db.campaign.update).toHaveBeenCalledTimes(1);
        expect(db.campaignSnapshot.create).not.toHaveBeenCalled();
        expect(result.status).toBe('updated');
        expect(result.id).toBe(99);
    });

    it('creates a new snapshot when applicant_count has changed', async () => {
        const existing = { ...existingBase, snapshots: [{ ...existingBase.snapshots[0], applicant_count: 2 }] };
        vi.mocked(db.campaign.findUnique).mockResolvedValue(existing as any);
        vi.mocked(db.campaign.update).mockResolvedValue(existing as any);
        vi.mocked(db.campaignSnapshot.create).mockResolvedValue({ id: 200 } as any);

        const result = await processAndDedupeCampaign(PLATFORM_ID, {
            ...sampleCampaign,
            applicant_count: 8, // changed
        });

        expect(db.campaignSnapshot.create).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('updated_with_snapshot');
    });

    it('creates a new snapshot when recruit_count has changed', async () => {
        const existing = { ...existingBase, snapshots: [{ ...existingBase.snapshots[0], recruit_count: 5 }] };
        vi.mocked(db.campaign.findUnique).mockResolvedValue(existing as any);
        vi.mocked(db.campaign.update).mockResolvedValue(existing as any);
        vi.mocked(db.campaignSnapshot.create).mockResolvedValue({ id: 201 } as any);

        const result = await processAndDedupeCampaign(PLATFORM_ID, {
            ...sampleCampaign,
            recruit_count: 20, // changed
        });

        expect(db.campaignSnapshot.create).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('updated_with_snapshot');
    });

    it('creates a new snapshot when no previous snapshots exist on the existing campaign', async () => {
        const existing = { ...existingBase, snapshots: [] };
        vi.mocked(db.campaign.findUnique).mockResolvedValue(existing as any);
        vi.mocked(db.campaign.update).mockResolvedValue(existing as any);
        vi.mocked(db.campaignSnapshot.create).mockResolvedValue({ id: 202 } as any);

        const result = await processAndDedupeCampaign(PLATFORM_ID, sampleCampaign);

        expect(db.campaignSnapshot.create).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('updated_with_snapshot');
    });
});
