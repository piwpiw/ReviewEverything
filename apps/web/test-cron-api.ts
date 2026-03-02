async function triggerApi() {
    try {
        console.log("Triggering Reviewnote (Platform 2)...");
        const res1 = await fetch("http://localhost:3000/api/admin/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform_id: 2 })
        });
        const json1 = await res1.json();
        console.log("Reviewnote Response:", json1);

        console.log("\nTriggering DinnerQueen (Platform 3)...");
        const res2 = await fetch("http://localhost:3000/api/admin/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform_id: 3 })
        });
        const json2 = await res2.json();
        console.log("DinnerQueen Response:", json2);

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
triggerApi();
