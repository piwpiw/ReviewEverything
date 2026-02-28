require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PAGE_ID = process.env.NOTION_PAGE_ID || 'a03a5442b7cc4c20b20c6b68d6ad4ab5'; // Default to user's page

const targetDir = 'D:\\Project';
const indexPath = path.join(targetDir, 'NOTION_MASTER_INDEX.md');

async function clearNotionPage(pageId) {
    console.log(`🧹 Clearing existing blocks from Notion Page: ${pageId}...`);
    try {
        let hasMore = true;
        let startCursor = undefined;
        let totalDeleted = 0;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: pageId,
                start_cursor: startCursor,
                page_size: 100,
            });

            for (const block of response.results) {
                await notion.blocks.delete({ block_id: block.id });
                totalDeleted++;
            }

            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }
        console.log(`✅ Cleared ${totalDeleted} blocks.`);
    } catch (error) {
        console.error("❌ Failed to clear Notion page:", error.message);
        throw error;
    }
}

async function appendNotionBlocks(pageId, blocks) {
    console.log(`🚀 Appending ${blocks.length} new blocks to Notion Page...`);
    try {
        // Append in batches of 100 max (API limit)
        for (let i = 0; i < blocks.length; i += 100) {
            const batch = blocks.slice(i, i + 100);
            await notion.blocks.children.append({
                block_id: pageId,
                children: batch
            });
            console.log(`   -> Appended batch ${i / 100 + 1} (${batch.length} blocks)`);
        }
        console.log(`✅ Successfully synced all blocks to Notion!`);
    } catch (error) {
        console.error("❌ Failed to append Notion blocks:", error.message);
        throw error;
    }
}

// Quick parser to convert our specific MD format to Notion Blocks
function parseMarkdownToBlocks(mdContent) {
    const lines = mdContent.split('\n');
    const blocks = [];

    let currentToggle = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // H1
        if (line.startsWith('# ')) {
            blocks.push({
                object: 'block', type: 'heading_1',
                heading_1: { rich_text: [{ type: 'text', text: { content: line.replace('# ', '') } }] }
            });
        }
        // H2 -> Heading 2
        else if (line.startsWith('## ')) {
            blocks.push({
                object: 'block', type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: line.replace('## ', '') } }] }
            });
        }
        // Blockquote -> Callout (looks better in Notion)
        else if (line.startsWith('> ')) {
            const content = line.replace('> ', '').replace(/`/g, ''); // strip backticks for simplicity
            blocks.push({
                object: 'block', type: 'callout',
                callout: {
                    rich_text: [{ type: 'text', text: { content: content } }],
                    icon: { type: "emoji", emoji: "💡" }
                }
            });
        }
        // Toggle Start
        else if (line.includes('<summary>')) {
            const match = line.match(/<b>(.*?)<\/b>/);
            const title = match ? match[1] : '목록 보기';
            currentToggle = {
                object: 'block', type: 'toggle',
                toggle: {
                    rich_text: [{ type: 'text', text: { content: title } }],
                    children: [] // Needs up to 100 children max per toggle
                }
            };
            // Note: We don't push currentToggle into blocks yet. We wait until </details> 
            // to see how many children it has, so we can split it if > 100.
        }
        // Links inside Toggle
        else if (line.startsWith('- [') && currentToggle) {
            // Expected: - [Title](./path.md) `(rawname.md)`
            const linkMatch = line.match(/- \[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
                const title = linkMatch[1];
                let rawLink = linkMatch[2];
                // Notion API requires HTTP links, cannot be local relative paths.
                // We will just put the title and path as text for now, since Notion API 
                // link objects must be valid URLs (http/https).

                currentToggle.toggle.children.push({
                    object: 'block', type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [
                            { type: 'text', text: { content: title, link: null } },
                            { type: 'text', text: { content: ` (${rawLink})` }, annotations: { code: true, color: 'gray' } }
                        ]
                    }
                });
            }
        }
        // End Toggle
        else if (line.includes('</details>')) {
            if (currentToggle) {
                // If more than 100 children, we need to split it since Notion API only allows 100 children per block creation.
                const children = currentToggle.toggle.children;
                if (children.length > 100) {
                    const chunkSize = 100;
                    const originalTitle = currentToggle.toggle.rich_text[0].text.content;

                    for (let i = 0; i < children.length; i += chunkSize) {
                        const chunk = children.slice(i, i + chunkSize);
                        const partNum = Math.floor(i / chunkSize) + 1;

                        blocks.push({
                            object: 'block', type: 'toggle',
                            toggle: {
                                rich_text: [{ type: 'text', text: { content: `${originalTitle} (Part ${partNum})` } }],
                                children: chunk
                            }
                        });
                    }
                } else {
                    blocks.push(currentToggle);
                }
            }
            currentToggle = null;
        }
        // Divider
        else if (line.startsWith('---')) {
            blocks.push({ object: 'block', type: 'divider', divider: {} });
        }
    }

    return blocks;
}

async function run() {
    if (!process.env.NOTION_API_KEY) {
        console.error("❌ process.env.NOTION_API_KEY is not set.");
        process.exit(1);
    }

    if (!fs.existsSync(indexPath)) {
        console.error(`❌ Index file not found at ${indexPath}`);
        process.exit(1);
    }

    try {
        const mdContent = fs.readFileSync(indexPath, 'utf-8');
        console.log("🧩 Parsing Markdown to Notion Blocks...");
        const blocks = parseMarkdownToBlocks(mdContent);

        await clearNotionPage(PAGE_ID);
        await appendNotionBlocks(PAGE_ID, blocks);
    } catch (err) {
        console.error("Workflow failed:", err);
    }
}

run();
