/**
 * Update all product image_url fields in brands.ts to use
 * category images from the downloaded Supabase assets.
 * 
 * Usage: node scripts/update-product-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BRANDS_FILE = path.join(PROJECT_ROOT, 'src', 'services', 'brands.ts');

// Mapping of category names → category image constant names
const CATEGORY_IMAGE_MAP = {
    'Elite': 'catAirElite',
    'Plus': 'catAirPlus',
    'Revolution Ultra': 'catAirRevolution',
    'Big Max': 'catIplayBigMax',
    'Max': 'catIplayMax',
    'Xbox': 'catIplayXbox',
    'Xbox Pro': 'catIplayXboxPro',
    'High GTS': 'catMaskkingHighGts',
    'High Pro': 'catMaskkingHighPro',
    'Ice X': 'catMaskkingHighPro',     // fallback
    'Jam': 'catMaskkingHighPro',     // fallback  
    'Ultra': 'catMaskkingHighPro',     // fallback
    'Vimaxi': 'catMaskkingHighPro',     // fallback
    'Spongie': 'catMaskkingHighPro',     // fallback
    'RC10000': 'catMaskkingHighPro',     // fallback
    'Turbo X': 'catMaskkingHighPro',     // fallback
    'Lightweight': 'catMaskkingHighPro',     // fallback
    'Blade': 'catWakaBlade',
    'SoPro': 'catWakaSopro',
    'Nova': 'catWakaSomax',
    '4500': 'catWonderG4',
    'Neo P9000': 'catWonderG4',
    'Bugatti': 'catMaskkingHighPro',     // fallback
    'Synix': 'catMaskkingHighPro',     // fallback
    'Regal': 'catMaskkingHighPro',     // fallback
    'Vibar': 'catIplayMax',            // fallback
};

// Also fix brand_id based image mapping for products without a category field
const BRAND_CATEGORY_MAP = {
    '1': {
        'Elite': 'catAirElite',
        'Plus': 'catAirPlus',
        'Revolution Ultra': 'catAirRevolution',
    },
    '2': { '*': 'catAirPlus' },
    '3': { '*': 'catMaskkingHighPro' },
    '4': { '*': 'catMaskkingHighPro' },
    '5': { '*': 'catMaskkingHighPro' },
    '6': { '*': 'catMaskkingHighPro' },
    '7': { '*': 'catMaskkingHighPro' },
    '8': { '*': 'catMaskkingHighPro' },
    '9': {
        'Big Max': 'catIplayBigMax',
        'Max': 'catIplayMax',
        'Vibar': 'catIplayMax',
    },
    '10': {
        'Xbox': 'catIplayXbox',
        'Xbox Pro': 'catIplayXboxPro',
    },
    '12': { '*': 'catMaskkingHighPro' },
    '13': {
        'High GT': 'catMaskkingHighPro',
        'High Pro': 'catMaskkingHighPro',
    },
    '14': { 'High GTS': 'catMaskkingHighGts' },
    '15': { 'Ice X': 'catMaskkingHighPro' },
    '16': { 'Jam': 'catMaskkingHighPro' },
    '17': { 'Ultra': 'catMaskkingHighPro' },
    '18': { 'Vimaxi': 'catMaskkingHighPro' },
    '19': { 'Spongie': 'catMaskkingHighPro' },
    '20': { 'RC10000': 'catMaskkingHighPro' },
    '21': { '*': 'catMaskkingHighPro' },
    '22': { 'Turbo X': 'catMaskkingHighPro' },
    '23': { 'Lightweight': 'catMaskkingHighPro' },
    '24': {
        '4500': 'catWonderG4',
        'Neo P9000': 'catWonderG4',
    },
    '25': {
        'Blade': 'catWakaBlade',
        'SoPro': 'catWakaSopro',
        'Nova': 'catWakaSomax',
    },
};

let content = fs.readFileSync(BRANDS_FILE, 'utf-8');

// Fix: logoMaskking → logoMaskkingHighPro (line ~184 in the new file)
// The old code referenced `logoMaskking` which matched maskking.png, but now we use the real DB logo
content = content.replace(
    /logo_url: logoMaskking,/g,
    'logo_url: logoMaskkingHighPro,'
);

// Replace all `image_url: prodAirPlus` → category image
content = content.replace(/image_url: prodAirPlus,/g, 'image_url: catAirPlus,');
content = content.replace(/image_url: prodAirmez,/g, 'image_url: catAirPlus,');
content = content.replace(/image_url: prodBlockElf,/g, 'image_url: catAirPlus,');
content = content.replace(/image_url: prodBugatti,/g, 'image_url: catAirPlus,');
content = content.replace(/image_url: prodEasySmart,/g, 'image_url: catAirPlus,');
content = content.replace(/image_url: prodMaskking,/g, 'image_url: catMaskkingHighPro,');
content = content.replace(/image_url: prodWaka,/g, 'image_url: catWakaBlade,');
content = content.replace(/image_url: prodWonder,/g, 'image_url: catWonderG4,');
content = content.replace(/image_url: prodGeneric,/g, 'image_url: catAirPlus,');

// Now replace ALL empty image_url fields with the correct category image
// Pattern: image_url: '', category: 'CATEGORY_NAME'
content = content.replace(
    /image_url: '', category: '([^']+)'/g,
    (match, categoryName) => {
        const imgConst = CATEGORY_IMAGE_MAP[categoryName] || 'prodGeneric';
        return `image_url: ${imgConst}, category: '${categoryName}'`;
    }
);

// Also handle products that had no category field at all (some entries in Elite, Plus, Revolution Ultra)
// These are products with category embedded in the comment block but not in the object
// They look like: image_url: ''  (followed by , in_stock or just in_stock with category missing)
// Let's find remaining empty image_url and fix them based on context
const lines = content.split('\n');
let currentCategory = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect category comments like: // AIR - ELITE, // AIRMEZ, etc.
    const commentMatch = line.match(/\/\/\s*(AIR\s*-\s*ELITE|AIR\s*-\s*PLUS|AIR\s*-\s*REVOLUTION ULTRA|AIRMEZ|BLOCK-ELF|BUGATTI|EASY-SMART|ELF-BAR|FLY|HELLO-SYNIX|IPLAY\s+BIG\s+MAX|IPLAY\s+MAX|IPLAY\s+VIBAR|IPLAY\s+XBOX|MASKKING|WAKA|WONDER|IVG|RIFBAR|TYSON|RABBEATS|METAKU)/i);
    if (commentMatch) {
        const catName = commentMatch[1].trim().toUpperCase();
        if (catName.includes('ELITE')) currentCategory = 'catAirElite';
        else if (catName.includes('PLUS') && catName.includes('AIR')) currentCategory = 'catAirPlus';
        else if (catName.includes('REVOLUTION')) currentCategory = 'catAirRevolution';
        else if (catName.includes('AIRMEZ')) currentCategory = 'catAirPlus';
        else if (catName.includes('BLOCK')) currentCategory = 'catAirPlus';
        else if (catName.includes('BUGATTI')) currentCategory = 'catAirPlus';
        else if (catName.includes('EASY')) currentCategory = 'catAirPlus';
        else if (catName.includes('ELF')) currentCategory = 'catAirPlus';
        else if (catName.includes('FLY')) currentCategory = 'catAirPlus';
        else if (catName.includes('SYNIX')) currentCategory = 'catAirPlus';
        else if (catName.includes('BIG MAX')) currentCategory = 'catIplayBigMax';
        else if (catName.includes('IPLAY MAX')) currentCategory = 'catIplayMax';
        else if (catName.includes('VIBAR')) currentCategory = 'catIplayMax';
        else if (catName.includes('XBOX')) currentCategory = 'catIplayXbox';
        else if (catName.includes('MASKKING')) currentCategory = 'catMaskkingHighPro';
        else if (catName.includes('WAKA')) currentCategory = 'catWakaBlade';
        else if (catName.includes('WONDER')) currentCategory = 'catWonderG4';
        else currentCategory = 'prodGeneric';
    }

    // Fix any remaining image_url: '' without category
    if (line.includes("image_url: ''") && currentCategory) {
        lines[i] = line.replace("image_url: ''", `image_url: ${currentCategory}`);
    }
}

content = lines.join('\n');

fs.writeFileSync(BRANDS_FILE, content, 'utf-8');
console.log('✅ Updated brands.ts with category image references');

// Count remaining empty image_urls
const remaining = (content.match(/image_url: ''/g) || []).length;
console.log(`   Remaining empty image_url: ${remaining}`);
