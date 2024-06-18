const express = require('express');
const router = express.Router();
const User = require('../controllers/User'); 
const UserSchema = require('../models/User');
const Collection =  require('../models/Collections');
const Product = require('../models/product');
const Order = require('../models/Orders');

const restrictedPaths = [
    '/Checkout'
];

// Middleware to check authorization
router.use((req, res, next) => {
    if (req.session.user === undefined && restrictedPaths.includes(req.path)) {
        console.log('You are not authorized to access this path');
        res.status(403).send('You are not authorized to access this path');
    } else {
        next();
    }
});

// Route to get collection by name
router.get('/user/:collectionName', async (req, res) => {
    try {
        const formattedCollectionName = req.params.collectionName;
        const collectionName = formattedCollectionName.replace(/-/g, ' ');

        const collection = await Collection.findOne({ Collection_Name: collectionName });
        console.log(collectionName);
        if (!collection) {
            return res.status(404).send('Collection not found');
        }

        const products = await Product.find({ collection_id: collection._id });

        res.render('indian', {
            img: collection.img,
            Collection_Name: collection.Collection_Name,
            Collection_Description: collection.Collection_Description,
            products: products
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Other routes
router.post('/login', User.GetUser);
router.post('/signup', User.AddUser);
router.post('/checkAddress', User.checkAddress);
router.post('/checkLoggedIn', User.checkLoggedIn);
router.post('/search', User.Search);


// Handle POST request for add to cart
router.post('/add-to-cart', User.AddToCart)

// Handle POST request for cart
router.get('/ShoppingCart', User.Cart);


router.post('/add-to-cart', User.AddToCart);
router.post('/ShoppingCart', User.Cart);

router.put('/updateCart', User.updateCart);
router.put('/updateCartPrice', User.updateCartPrice);
router.delete('/remove-from-cart/:productId', User.removeFromCart);
router.post('/checkout', User.Checkout);


// Get wishlist
router.get('/wishlist', User.getWishlist);

// Add to wishlist
router.post('/wishlist/add', User.AddToWishlist);

// Remove from wishlist
router.delete('/wishlist/remove/:productId', User.removeFromWishlist);




// router.post('/products/filter', async (req, res) => {
//     const { categories, colors, priceRange, materials } = req.body;

//     const filters = {};

//     if (categories && categories.length) filters.category = { $in: categories };
//     if (colors && colors.length) filters.color = { $in: colors };
//     if (materials && materials.length) filters.material = { $in: materials };
//     if (priceRange) filters.price = { $lte: priceRange };

//     console.log("Filters applied:", filters); // Debugging information

//     try {
//         const products = await Product.find(filters);
//         res.json(products);
//         console.log("Filtered products:", products); // Debugging information
//     } catch (error) {
//         console.error("Error fetching products:", error);
//         res.status(500).json({ message: 'Error fetching products', error });
//     }
// });

router.post('/filter', User.filterProducts); 

router.get('/shopAll',User.getShopAllProducts);

router.get('/indian',User.getIndianProducts);


router.post('/filter', User.filterProducts);
router.get('/shopAll', User.getShopAllProducts);

router.post('/Billing-Information', User.BillingInformation);

router.get('/Checkout', async (req, res) => {
    try {
        const user = await UserSchema.findById(req.session.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.render('Checkout', { user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/users/:id', User.getUserById);


router.get('/myAccount', User.getUserOrder );


router.get('/myAccount', User.getUserOrder);
router.delete('/cancel-order/:orderId', User.cancelOrder);
router.get('/Collections', async (req, res) => {
    try {
        const allCollections = await Collection.find({});

        // Render the template with the fetched collections
        res.render('Collections', { allCollections });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/Customize', (req, res) => {
    res.render("Customization.ejs");
});
router.get('/quiz', (req, res) => {
    res.render('quiz');
});



router.get('/stores', (req, res) => {
    res.render("stores.ejs");
});
router.get('/user/:collectionName', async (req, res) => {
    try {
        const formattedCollectionName = req.params.collectionName;
        const collectionName = formattedCollectionName.replace(/-/g, ' ');

        const collection = await Collection.findOne({ Collection_Name: collectionName });
        console.log(collectionName);
        if (!collection) {
            return res.status(404).send('Collection not found');
        }

        const products = await Product.find({ collection_id: collection.Collection_Name });

        res.render('indian', {
            img: collection.img,
            Collection_Name: collection.Collection_Name,
            Collection_Description: collection.Collection_Description,
            products: products
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});


const getCollectionProducts = async (req, res) => {
    const collectionId = req.params.collectionId;
    try {
        const collection = await Collection.findOne({ _id: collectionId }).populate('item_products');
        if (!collection) {
            return res.status(404).send('Collection not found');
        }
        res.render('collection', {
            collectionName: collection.Collection_Name,
            collectionDescription: collection.Collection_Description,
            collectionImage: collection.img,
            products: collection.item_products
        });
    } catch (error) {
        console.error('Error fetching collection products:', error);
        res.status(500).send('Server Error');
    }
};

router.get('/collection/:collectionId', getCollectionProducts);
router.put('/cancelOrder/:orderId',User.cancelOrder);
module.exports = router;
