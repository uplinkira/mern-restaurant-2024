// backend/controllers/searchController.js
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Dish = require('../models/Dish');
const Product = require('../models/Product');

// Helper functions
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

   // Prepare search terms
   const searchTerms = query
     .trim()
     .toLowerCase()
     .split(/\s+/)
     .filter(term => term.length > 0)
     .map(escapeRegex);

   const searchPatterns = searchTerms.map(term => new RegExp(term, 'i'));
   let results = [];
   
   // Relevance weights
   const weights = {
     name: 3,
     description: 2,
     primary: 2,    // For fields like cuisineType, category
     secondary: 1   // For fields like ingredients, specialties
   };

   switch (filter) {
     case 'restaurant': {
       const restaurantQuery = {
         $or: searchPatterns.map(pattern => ({
           $or: [
             { name: pattern },
             { description: pattern },
             { cuisineType: pattern },
             { specialties: pattern }
           ]
         }))
       };

       results = await Restaurant.find(restaurantQuery)
         .select(`
           name description cuisineType specialties
           isVRExperience maxCapacity slug email phone address
           openingHours
         `)
         .populate('dishDetails', 'name slug')
         .populate('menuDetails', 'name slug')
         .lean();

       results = results.map(restaurant => {
         let score = 0;
         searchPatterns.forEach(pattern => {
           if (pattern.test(restaurant.name)) score += weights.name;
           if (pattern.test(restaurant.description)) score += weights.description;
           if (pattern.test(restaurant.cuisineType)) score += weights.primary;
           restaurant.specialties?.forEach(specialty => {
             if (pattern.test(specialty)) score += weights.secondary;
           });
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

     case 'menu': {
       const menuQuery = {
         $or: searchPatterns.map(pattern => ({
           $or: [
             { name: pattern },
             { description: pattern }
           ]
         }))
       };

       results = await Menu.find(menuQuery)
         .select('name description restaurants slug')
         .populate('dishes', 'name slug price')
         .populate('restaurantDetails', 'name slug')
         .lean();

       results = results.map(menu => {
         let score = 0;
         searchPatterns.forEach(pattern => {
           if (pattern.test(menu.name)) score += weights.name;
           if (pattern.test(menu.description)) score += weights.description;
         });
         return {
           ...menu,
           relevanceScore: score,
           dishCount: menu.dishes?.length || 0
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
             { ingredients: pattern },
             { allergens: pattern }
           ]
         }))
       };

       results = await Dish.find(dishQuery)
         .select(`
           name description price ingredients allergens
           menus chenPiAge isSignatureDish restaurants slug
         `)
         .populate('menuDetails', 'name slug')
         .populate('restaurantDetails', 'name slug')
         .lean();

       results = results.map(dish => {
         let score = 0;
         searchPatterns.forEach(pattern => {
           if (pattern.test(dish.name)) score += weights.name;
           if (pattern.test(dish.description)) score += weights.description;
           dish.ingredients?.forEach(ing => {
             if (pattern.test(ing)) score += weights.secondary;
           });
           if (isNumeric(pattern) && dish.chenPiAge === Number(pattern)) {
             score += weights.primary;
           }
         });

         return {
           ...dish,
           relevanceScore: score,
           formattedPrice: `$${dish.price}`,
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
         .select(`
           name description price category ingredients
           allergens isFeatured availableForDelivery caution slug
         `)
         .populate('dishDetails', 'name slug')
         .populate('restaurantDetails', 'name slug')
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
           formattedPrice: `$${product.price}`,
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

   // Sort by relevance score and apply pagination
   results = results
     .filter(item => item.relevanceScore > 0)
     .sort((a, b) => b.relevanceScore - a.relevanceScore);

   const total = results.length;
   const skip = (Number(page) - 1) * Number(limit);
   results = results.slice(skip, skip + Number(limit));

   console.log(`Found ${total} results for ${filter}`);

   // Send consistent response format
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