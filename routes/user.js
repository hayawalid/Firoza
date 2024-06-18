const express = require('express');
const router = express.Router();
const User = require('../controllers/User'); 

const restrictedPaths = [
    // '/admin',
    '/Checkout'
];

// Unauthorized users 
router.use((req, res, next) => {
    if (req.session.user === undefined && restrictedPaths.includes(req.path)) {
        console.log(req.session.user);
        console.log('You are not authorized to access this path');
        res.status(403).send('You are not authorized to access this path');
    } else {
        next();
    }
});

// Handle POST request for login
router.post('/login', User.GetUser);

// Handle POST request for signup
router.post('/signup', User.AddUser);

// Handle POST request for checkAddress
router.post('/checkAddress', User.checkAddress);

// Handle POST request for checkLoggedIn
router.post('/checkLoggedIn', User.checkLoggedIn);

// Handle POST request for search
router.post('/search', User.Search);

// Handle POST request for add to cart
router.post('/add-to-cart', User.AddToCart)

// Handle POST request for cart
router.post('/ShoppingCart', User.Cart);

// Route to remove an item from the cart
router.delete('/remove-from-cart/:productId', User.removeFromCart);

//
router.post('/Billing-Information', User.BillingInformation);

router.get('/users/:id', User.getUserById);

router.get('/myAccount', User.getUserOrder );

module.exports = router;
