const fs = require('fs').promises;
const path = require('path');
const abbreviations = require('../data/abbrs.json');

// 规范化输入，移除特殊字符
const normalize = (input) => {
  if (!input) return '';
  const str = String(input);
  const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// 应用所有缩写规则
const applyAllAbbreviations = (input) => {
  if (!input) return '';
  let result = normalize(input);
  
  // 按类别应用缩写规则
  const categories = [
    'cities',
    'culinary',
    'modifiers',
    'dish_types',
    'business',
    'general'
  ];

  // 合并所有缩写规则，但保持优先级
  const allAbbrs = categories.reduce((acc, category) => {
    return { ...acc, ...abbreviations[category] };
  }, {});

  // 按长度排序，确保长的词先被替换
  const sortedKeys = Object.keys(allAbbrs).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    result = result.replace(regex, allAbbrs[key]);
  }
  
  return result;
};

// 生成餐厅 slug
function generateRestaurantSlug({ name, address }) {
  if (!name) return '';
  
  // 应用餐厅名称缩写
  const nameSlug = applyAllAbbreviations(name);
  
  // 应用城市缩写
  const citySlug = address?.city ? abbreviations.cities[address.city.toLowerCase()] || 
    applyAllAbbreviations(address.city) : '';
  
  // 组合 name 和 city，避免重复
  const slugParts = [...new Set([...nameSlug.split('-'), citySlug])];
  return slugParts.filter(Boolean).join('-');
}

// 生成菜单 slug
function generateMenuSlug({ name, category }) {
  if (!name) return '';
  
  // 应用菜单名称缩写
  const nameSlug = applyAllAbbreviations(name);
  
  // 应用类别缩写
  const categorySlug = category ? applyAllAbbreviations(category) : '';
  
  // 组合 name 和 category，避免重复
  const slugParts = [...new Set([...nameSlug.split('-'), ...categorySlug.split('-')])];
  return slugParts.filter(Boolean).join('-');
}

// 生成菜品 slug
function generateDishSlug({ name }) {
  if (!name) return '';
  
  // 只使用菜品名称生成 slug
  return applyAllAbbreviations(name);
}

// 生成产品 slug
function generateProductSlug({ name }) {
  if (!name) return '';
  
  // 只使用产品名称生成 slug
  return applyAllAbbreviations(name);
}

// 更新 JSON 文件，添加对餐厅引用的处理
async function updateJSONWithSlugs(fileName, slugGenerator) {
  try {
    const filePath = path.join(__dirname, '../data', fileName);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    console.log(`Processing ${fileName}...`);
    
    // 创建餐厅名称到 slug 的映射
    const restaurantMapping = {
      'Chen Pi Chen Shenzhen': 'cpc-sz',
      'Chen Pi Chen Zhongshan': 'cpc-zs',
      'Gan Pi VR Restaurant': 'gp-vr-rest-sz'
    };

    // 如果是处理 dishes.json，先读取 menus.json 获取名称到 slug 的映射
    let menuNameToSlug = {};
    if (fileName === 'dishes.json') {
      const menusPath = path.join(__dirname, '../data/menus.json');
      const menusData = JSON.parse(await fs.readFile(menusPath, 'utf8'));
      menuNameToSlug = menusData.reduce((acc, menu) => {
        acc[menu.name] = menu.slug;
        return acc;
      }, {});
    }
    
    const updatedData = data.map((item) => {
      const slug = slugGenerator(item);
      if (!slug) {
        console.warn(`Warning: Could not generate slug for item:`, item);
        return item;
      }
      
      // 更新餐厅引用为 slug
      if (item.restaurants) {
        item.restaurants = item.restaurants.map(restaurantName => {
          const slug = restaurantMapping[restaurantName];
          if (!slug) {
            console.warn(`Warning: Could not find slug for restaurant: ${restaurantName}`);
          }
          return slug || restaurantName;
        });
      }

      // 如果是菜品，更新菜单引用为 slug
      if (fileName === 'dishes.json' && item.menus) {
        item.menus = item.menus.map(menuName => {
          const slug = menuNameToSlug[menuName];
          if (!slug) {
            console.warn(`Warning: Could not find slug for menu: ${menuName}`);
          }
          return slug || menuName;
        });
      }
      
      return { ...item, slug };
    });

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
    console.log(`✅ Updated ${fileName} with slugs`);
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);
    throw error;
  }
}

// 主函数
async function generateAndSaveSlugs() {
  try {
    console.log(' Starting slug generation...');
    
    // 先处理 restaurants.json，因为其他文件依赖它的 slug
    await updateJSONWithSlugs('restaurants.json', generateRestaurantSlug);
    
    // 然后处理 menus.json，因为 dishes.json 依赖它的 slug
    await updateJSONWithSlugs('menus.json', generateMenuSlug);
    
    // 最后处理 dishes.json 和 products.json
    await updateJSONWithSlugs('dishes.json', generateDishSlug);
    await updateJSONWithSlugs('products.json', generateProductSlug);
    
    console.log('✨ All JSON files updated with slugs successfully!');
  } catch (error) {
    console.error('❌ Error generating and saving slugs:', error);
    process.exit(1);
  }
}

// 执行脚本
generateAndSaveSlugs();

// 导出函数供其他模块使用
module.exports = {
  generateRestaurantSlug,
  generateMenuSlug,
  generateDishSlug,
  generateProductSlug,
  normalize,
  applyAllAbbreviations
};

// 使用方法：node utils/slugPreprocessing.js
