/**
 * Download all unique images from Supabase Storage for the demo.
 * 
 * Usage: node scripts/download-images.mjs
 * 
 * This script:
 * 1. Queries the brands and categories tables
 * 2. Extracts unique image URLs
 * 3. Downloads them to public/brand-assets/{logos,banners,categories}/
 * 4. Outputs a JSON mapping file for reference
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Supabase config
const SUPABASE_URL = 'https://ozohmpsdxmlzyczrspfc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b2htcHNkeG1senljenJzcGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjkzNjQsImV4cCI6MjA4MzMwNTM2NH0.4T6XrRtSNxxVTaGwOKUAERsvap5d2KgIRTIrSVcYdEI';

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'brand-assets');

// --- Helpers ---

function fetchJSON(urlStr) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${data.substring(0, 200)}`));
                }
            });
        }).on('error', reject);
    });
}

function downloadFile(urlStr, destPath) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(destPath);
        fs.mkdirSync(dir, { recursive: true });

        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
        };

        https.get(options, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
                return;
            }
            const file = fs.createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(destPath);
            });
        }).on('error', reject);
    });
}

/**
 * Extract the local path from a Supabase Storage URL.
 * e.g. https://xxx.supabase.co/storage/v1/object/public/brand-assets/logos/air-plus.png
 *   -> logos/air-plus.png
 */
function extractStoragePath(url) {
    const marker = '/brand-assets/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
}

// --- Main ---

async function main() {
    console.log('🔄 Fetching brands from Supabase...');

    // Fetch ALL brands (use Range header to get more than default limit)
    const brands = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/brands?select=id,name,logo_url,banner_url&order=name`
    );
    console.log(`   Found ${brands.length} brand entries`);

    console.log('🔄 Fetching categories from Supabase...');
    const categories = await fetchJSON(
        `${SUPABASE_URL}/rest/v1/categories?select=id,name,brand_id,image_url&order=name`
    );
    console.log(`   Found ${categories.length} category entries`);

    // Collect unique image URLs
    const imageUrls = new Set();

    for (const b of brands) {
        if (b.logo_url) imageUrls.add(b.logo_url);
        if (b.banner_url) imageUrls.add(b.banner_url);
    }
    for (const c of categories) {
        if (c.image_url) imageUrls.add(c.image_url);
    }

    console.log(`\n📦 Found ${imageUrls.size} unique image URLs to download:\n`);

    // Download each
    const results = [];
    let downloaded = 0;
    let failed = 0;

    for (const url of imageUrls) {
        const relativePath = extractStoragePath(url);
        if (!relativePath) {
            console.log(`   ⚠️  Skipping (not a storage URL): ${url}`);
            failed++;
            continue;
        }

        const destPath = path.join(OUTPUT_DIR, relativePath);

        // Skip if file already exists
        if (fs.existsSync(destPath)) {
            const stat = fs.statSync(destPath);
            if (stat.size > 0) {
                console.log(`   ✅ Already exists: ${relativePath}`);
                results.push({ url, localPath: `/brand-assets/${relativePath}`, status: 'exists' });
                downloaded++;
                continue;
            }
        }

        try {
            await downloadFile(url, destPath);
            const stat = fs.statSync(destPath);
            console.log(`   ✅ Downloaded: ${relativePath} (${(stat.size / 1024).toFixed(1)} KB)`);
            results.push({ url, localPath: `/brand-assets/${relativePath}`, status: 'downloaded' });
            downloaded++;
        } catch (err) {
            console.log(`   ❌ Failed: ${relativePath} — ${err.message}`);
            results.push({ url, localPath: `/brand-assets/${relativePath}`, status: 'failed', error: err.message });
            failed++;
        }
    }

    console.log(`\n✨ Done! Downloaded: ${downloaded}, Failed: ${failed}`);

    // Write mapping file for reference
    const mappingPath = path.join(PROJECT_ROOT, 'scripts', 'image-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(results, null, 2));
    console.log(`📄 Mapping saved to: scripts/image-mapping.json`);

    // Also print unique categories with their images for brands.ts update
    console.log('\n--- Category Images (for brands.ts) ---');
    const uniqueCats = new Map();
    for (const c of categories) {
        if (c.image_url && !uniqueCats.has(c.name)) {
            const rel = extractStoragePath(c.image_url);
            uniqueCats.set(c.name, `/brand-assets/${rel}`);
        }
    }
    for (const [name, localPath] of uniqueCats) {
        console.log(`   ${name} → ${localPath}`);
    }

    // Print unique brand logos/banners
    console.log('\n--- Brand Images (for brands.ts) ---');
    const uniqueBrands = new Map();
    for (const b of brands) {
        if (!uniqueBrands.has(b.name)) {
            const logoRel = b.logo_url ? `/brand-assets/${extractStoragePath(b.logo_url)}` : null;
            const bannerRel = b.banner_url ? `/brand-assets/${extractStoragePath(b.banner_url)}` : null;
            uniqueBrands.set(b.name, { logo: logoRel, banner: bannerRel });
        }
    }
    for (const [name, paths] of uniqueBrands) {
        console.log(`   ${name} → logo: ${paths.logo}, banner: ${paths.banner}`);
    }
}

main().catch(console.error);
