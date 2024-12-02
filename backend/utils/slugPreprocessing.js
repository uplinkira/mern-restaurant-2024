const fs = require('fs').promises;
const path = require('path');
const abbreviations = require('../data/abbrs.json');

// Helper function to normalize input values and remove special characters
const normalize = (input) => {
  // Remove accents and special characters
  const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Convert to lowercase, replace spaces with hyphens, and remove non-alphanumeric characters
  return normalized.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// Helper function to apply abbreviations from all categories
const applyAllAbbreviations = (input) => {
  let result = normalize(input);
  const allAbbrs = Object.values(abbreviations).reduce((acc, val) => ({...acc, ...val}), {});
  const sortedKeys = Object.keys(allAbbrs).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    result = result.replace(regex, allAbbrs[key]);
  }
  return result;
};

// Generate restaurant slug
function generateRestaurantSlug({ name, city }) {
  const nameSlug = applyAllAbbreviations(name);
  const citySlug = applyAllAbbreviations(city);
  
  // Combine name slug and city slug, avoiding repetition
  const slugParts = [...new Set(nameSlug.split('-').concat(citySlug.split('-')))];
  return slugParts.join('-');
}

// Generate dish slug
function generateDishSlug({ name }) {
  return applyAllAbbreviations(name);
}

// Generate product slug
function generateProductSlug(name) {
  return applyAllAbbreviations(name);
}

// Generate menu slug
function generateMenuSlug(name) {
  return applyAllAbbreviations(name);
}

// Helper function to update JSON files with slugs
async function updateJSONWithSlugs(fileName, slugGenerator) {
  const filePath = path.join(__dirname, '../data', fileName);
  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

  const updatedData = data.map((item) => ({
    ...item,
    slug: slugGenerator(item),
  }));

  await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
  console.log(`Updated ${fileName} with slugs.`);
}

// Main function to generate and save slugs
async function generateAndSaveSlugs() {
  try {
    await updateJSONWithSlugs('restaurants.json', generateRestaurantSlug);
    await updateJSONWithSlugs('dishes.json', generateDishSlug);
    await updateJSONWithSlugs('products.json', (item) => generateProductSlug(item.name));
    await updateJSONWithSlugs('menus.json', (item) => generateMenuSlug(item.name));

    console.log('All JSON files updated with slugs.');
  } catch (error) {
    console.error('Error generating and saving slugs:', error);
  }
}

// Run the script
generateAndSaveSlugs();

module.exports = {
  generateRestaurantSlug,
  generateDishSlug,
  generateProductSlug,
  generateMenuSlug,
};
//node utils/slugPreprocessing.js
