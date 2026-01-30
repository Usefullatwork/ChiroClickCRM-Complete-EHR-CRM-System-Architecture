const fs = require('fs');
const data = JSON.parse(fs.readFileSync('D:/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/frontend/src/data/vestibular-exercises.json', 'utf8'));

// Create structured seed data for the backend
const seedData = {
  categories: {},
  exercises: []
};

// Build categories hierarchy and exercises
data.exercises.forEach(ex => {
  const parentCat = ex.parentCategory || 'Other';
  const subCat = ex.category || 'General';

  // Track categories
  if (!seedData.categories[parentCat]) {
    seedData.categories[parentCat] = new Set();
  }
  seedData.categories[parentCat].add(subCat);

  // Extract Vimeo ID for embed
  const vimeoMatch = ex.vimeoUrl ? ex.vimeoUrl.match(/vimeo\.com\/(\d+)/) : null;
  const vimeoId = vimeoMatch ? vimeoMatch[1] : null;

  seedData.exercises.push({
    id: ex.id,
    name: ex.name,
    description: ex.description || '',
    category: parentCat,
    subcategory: subCat,
    vimeoId: vimeoId,
    vimeoUrl: ex.vimeoUrl,
    thumbnailId: ex.thumbnail,
    bodyRegion: parentCat.includes('BPPV') || parentCat.includes('VRT') ? 'vestibular' :
                parentCat.includes('Physical') ? 'full-body' :
                parentCat.includes('Cerebellar') ? 'neurological' : 'other',
    difficultyLevel: 'beginner',
    isActive: true
  });
});

// Convert category sets to arrays
const categories = Object.entries(seedData.categories).map(([name, subs]) => ({
  name,
  subcategories: [...subs]
}));

const output = {
  categories,
  exercises: seedData.exercises
};

// Create data directory if needed
fs.mkdirSync('D:/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend/src/data', { recursive: true });

fs.writeFileSync('D:/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend/src/data/vestibular-exercises-seed.json', JSON.stringify(output, null, 2));
console.log('Created seed file with:');
console.log('- Categories:', categories.length);
console.log('- Exercises:', seedData.exercises.length);
console.log('\nCategories:');
categories.forEach(c => console.log('  -', c.name, '(', c.subcategories.length, 'subcategories)'));
console.log('\nSample exercise with description:');
console.log(JSON.stringify(seedData.exercises[0], null, 2));
