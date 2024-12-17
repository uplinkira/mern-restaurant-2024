const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Dish = require('../models/Dish');
const Product = require('../models/Product');

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const isNumeric = (str) => !isNaN(str) && !isNaN(parseFloat(str));

const searchItems = async (req, res) => {
 try {
   let { query = '', filter = 'restaurant', page = 1, limit = 10 } = req.query;
   console.log('Search request received:', { query, filter, page, limit });

   if (!query.trim()) {
     return res.status(400).json({
       success: false,
       message: 'Search query is required'
     });
   }

   const searchTerms = query
     .trim()
     .toLowerCase()
     .split(/\s+/)
     .filter(term => term.length > 0)
     .map(escapeRegex);

   const searchPatterns = searchTerms.map(term => new RegExp(term, 'i'));
   let results = [];
   
   const weights = {
     name: 3,
     description: 2,
     primary: 2,
     secondary: 1
   };

   switch (filter) {
     case 'restaurant': {
       const restaurantQuery = {
         $or: searchPatterns.map(pattern => ({
           $or: [
             { name: pattern },
             { description: pattern },
             { cuisineType: pattern }
           ]
         }))
       };

       results = await Restaurant.find(restaurantQuery)
         .select('name description cuisineType isVRExperience maxCapacity slug')
         .lean();

       results = results.map(restaurant => {
         let score = 0;
         searchPatterns.forEach(pattern => {
           if (pattern.test(restaurant.name)) score += weights.name;
           if (pattern.test(restaurant.description)) score += weights.description;
           if (pattern.test(restaurant.cuisineType)) score += weights.primary;
         });

         return {
           ...restaurant,
           relevanceScore: score,
           vrExperience: restaurant.isVRExperience ? 'VR Experience Available' : '',
           capacity: restaurant.maxCapacity ? `Capacity: ${restaurant.maxCapacity}` : ''
         };
       });
       break;
     }

     case 'dish': {
       const dishQuery = {
         $or: searchPatterns.map(pattern => ({
           $or: [
             { name: pattern },
             { description: pattern },
             // 修改数组字段的查询方式
             { ingredients: { $in: [pattern] } },
             { allergens: { $in: [pattern] } },
             { menus: { $in: [pattern] } },
             { restaurants: { $in: [pattern] } },
             // 添加数字字段的查询
             ...(isNumeric(pattern.source) ? [{ chenPiAge: Number(pattern.source) }] : [])
           ]
         }))
       };

       console.log('Dish search query:', JSON.stringify(dishQuery, null, 2));

       results = await Dish.find(dishQuery)
         .select('name description price ingredients allergens chenPiAge isSignatureDish restaurants menus slug')
         .lean();

       console.log('Raw dish results:', results);

       results = results.map(dish => {
         let score = 0;
         searchPatterns.forEach(pattern => {
           if (pattern.test(dish.name)) score += weights.name;
           if (pattern.test(dish.description)) score += weights.description;
           dish.ingredients?.forEach(ing => {
             if (pattern.test(ing)) score += weights.secondary;
           });
           if (isNumeric(pattern.source) && dish.chenPiAge === Number(pattern.source)) {
             score += weights.primary;
           }
           dish.allergens?.forEach(allergen => {
             if (pattern.test(allergen)) score += weights.secondary;
           });
           dish.menus?.forEach(menu => {
             if (pattern.test(menu)) score += weights.secondary;
           });
           dish.restaurants?.forEach(restaurant => {
             if (pattern.test(restaurant)) score += weights.secondary;
           });
         });

         return {
           ...dish,
           relevanceScore: score,
           formattedPrice: `¥${dish.price.toFixed(2)}`,
           signature: dish.isSignatureDish ? 'Signature Dish' : '',
           chenPiAge: dish.chenPiAge ? `${dish.chenPiAge} Year Aged Chen Pi` : '',
           allergenAlert: dish.allergens?.length > 0 
             ? `Allergens: ${dish.allergens.join(', ')}` 
             : 'No allergens'
         };
       });
       break;
     }

     case 'product': {
       const productQuery = {
         $or: searchPatterns.map(pattern => ({
           $or: [
             { name: pattern },
             { description: pattern },
             { category: pattern },
             { ingredients: pattern }
           ]
         }))
       };

       results = await Product.find(productQuery)
         .select('name description price category ingredients allergens isFeatured availableForDelivery slug')
         .lean();

       results = results.map(product => {
         let score = 0;
         searchPatterns.forEach(pattern => {
           if (pattern.test(product.name)) score += weights.name;
           if (pattern.test(product.description)) score += weights.description;
           if (pattern.test(product.category)) score += weights.primary;
           product.ingredients?.forEach(ing => {
             if (pattern.test(ing)) score += weights.secondary;
           });
         });

         return {
           ...product,
           relevanceScore: score,
           formattedPrice: `¥${product.price.toFixed(2)}`,
           featured: product.isFeatured ? 'Featured Product' : '',
           availability: product.availableForDelivery ? 'Available for Delivery' : 'In-Store Only',
           allergenAlert: product.allergens?.length > 0 
             ? `Allergens: ${product.allergens.join(', ')}` 
             : 'No allergens'
         };
       });
       break;
     }

     default:
       return res.status(400).json({
         success: false,
         message: 'Invalid filter type'
       });
   }

   results = results
     .filter(item => item.relevanceScore > 0)
     .sort((a, b) => b.relevanceScore - a.relevanceScore);

   const total = results.length;
   const skip = (Number(page) - 1) * Number(limit);
   results = results.slice(skip, skip + Number(limit));

   console.log(`Found ${total} results for ${filter}`);

   return res.status(200).json({
     success: true,
     data: results,
     meta: {
       total,
       page: Number(page),
       limit: Number(limit),
       pages: Math.ceil(total / Number(limit)),
       filter
     }
   });

 } catch (error) {
   console.error('Search error:', error);
   return res.status(500).json({
     success: false,
     message: 'Search failed',
     error: error.message
   });
 }
};

module.exports = { searchItems };