import { describe, it, expect } from 'vitest';
import { RevuAdapter } from '../sources/adapters/revu';

describe('Adapter Fixture Basic Validations', () => {
    it('Instantiates RevuAdapter safely', () => {
        const revu = new RevuAdapter();
        expect(revu.platformId).toBe(1);
        expect(revu.baseUrl).toBe('https://www.revu.net');
    });

    it('Safely returns empty list before mapping real dom', async () => {
        const revu = new RevuAdapter();
        const data = await revu.fetchList(1);
        expect(data).toEqual([]); // Represents stub safety
    });
});
