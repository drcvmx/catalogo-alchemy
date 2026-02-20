const fs = require('fs');
const f = 'src/services/brands.ts';
let c = fs.readFileSync(f, 'utf8');

// Only clear brand descriptions (the ones in the brands array objects, not product descriptions)
// Brand descriptions are multi-word strings, product descriptions are always ''
const brandDescs = [
    "Dispositivos premium de última generación con tecnología avanzada.",
    "Innovación y diseño en cada producto. Calidad excepcional.",
    "Lujo y rendimiento incomparables. La excelencia en vapeo.",
    "Dispositivos POD desechables. Simplicidad y conveniencia.",
    "5th Edition. Diseño único y sabores excepcionales.",
    "Experiencia refrescante de alta calidad.",
    "Vuela alto con sabores únicos.",
    "Innovación y tecnología avanzada.",
    "Máximo rendimiento y potencia.",
    "La nueva generación de vapeo.",
    "Calidad real para paladares exigentes.",
    "Profesionalismo en cada calada.",
    "Gran Turismo de sabores.",
    "Frescura extrema en cada puff.",
    "La evolución del sabor intenso.",
    "Potencia ultra para los más exigentes.",
    "Máxima intensidad en rojo.",
    "Diversión y sabor en cada puff.",
    "El ritmo del vapor premium.",
    "Velocidad y potencia explosiva.",
    "Elegancia minimalista premium.",
    "Potencia de campeón mundial.",
    "Nubes explosivas de sabor.",
    "Frescura tropical en cada inhalación.",
];

for (const desc of brandDescs) {
    c = c.replace(`description: '${desc}'`, "description: ''");
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done - cleared all brand descriptions');
