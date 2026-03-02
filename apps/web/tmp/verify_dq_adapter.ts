import { DinnerQueenAdapter } from '../sources/adapters/dinnerqueen';

async function testDQAdapter() {
    const adapter = new DinnerQueenAdapter();
    console.log("Fetching DinnerQueen campaigns via adapter...");
    const results = await adapter.fetchList(1);
    console.log(`Results: ${results.length}`);
    if (results.length > 0) {
        console.log("First item:", results[0]);
        const isSample = results[0].original_id.includes('sample');
        console.log("Is sample data?", isSample);
    }
}

testDQAdapter();
