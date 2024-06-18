const User = require('../models/User'); 
const Product = require('../models/product');
const bcrypt = require('bcrypt');
const Orderr= require('../models/Orders');
// const natural = require('natural');
// const spellcheck = new natural.Spellcheck(['gold', 'silver', 'red']); // Extend with relevant terms


// Handle User login
// Handle User login
const GetUser = async (req, res) => {
    console.log('Entered GetUser function');

    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Email and password are required');
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Email not associated with any account');
            return res.status(400).json({ error: 'The entered email address is not associated with any account' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Merge guest cart with user cart
        if (req.session.cart && req.session.cart.items.length > 0) {
            req.session.cart.items.forEach(sessionItem => {
                const existingItem = user.cart.items.find(dbItem => dbItem.productId.toString() === sessionItem.productId.toString());
                if (existingItem) {
                    existingItem.quantity += sessionItem.quantity;
                } else {
                    user.cart.items.push(sessionItem);
                }
            });

            // Update total price in user's cart
            user.cart.totalprice += req.session.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

            await user.save();
            req.session.cart.items = []; // Clear the session cart after merging
            req.session.cart.totalprice = 0; // Reset session cart total price
        }

        // Set session
        req.session.user = user;

        // Return user data including isAdmin flag
        res.status(200).json({ user });
    } catch (error) {
        console.error('Error in GetUser:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



// Handle User signup
const AddUser = async (req, res) => {
    console.log('Entered AddUser function');
    const { firstname, lastname, email, password, address } = req.body;

    console.log('Received fields:', { firstname, lastname, email, password, address });

    if (!firstname || !lastname || !email || !password) {
        console.log('Missing fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            address,
            cart: {
                items: [],
                totalprice: 0
            }
        });

        await newUser.save();
        req.session.user = newUser;

        // Merge guest cart with new user cart
        if (req.session.cart && req.session.cart.items) {
            newUser.cart.items = req.session.cart.items;
            await newUser.save();
            req.session.cart.items = []; // Clear the session cart after merging
        }

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check Address
const checkAddress = async (req, res) => {
    console.log('enta beted5ol hena aslun?');
    const { address } = req.body;
    console.log("address: " + address);

    if(address) {
        try {
            const userExists = await User.findOne({ email: address });
            if (userExists) {
                console.log('msh el mafrood yed5ol hena');
                return res.status(400).json({ error: 'Address already taken' });
            }
            console.log('el mafrood yed5ol hena');
            res.status(200).json({ message: 'Address is available' });
        } catch (error) {
            console.log('hal fy error masalan?')
            res.status(500).json({ error: "catch el checkAddress fy error" });
        }
    } else {
        res.status(500).json({error: "undefined email"})
    }
}

// Check Login
const checkLoggedIn = async(req, res) => {
    console.log('checking login');
    try {
        if (req.session.user) {
            console.log('user in session');
            res.status(200).json({ loggedIn: true });
        } else {
            console.log('please log in');
            res.status(200).json({ loggedIn: false });
        }
    } catch (error) {
        console.error('Error checking login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
const filterProducts = async (req, res) => {
    console.log("Filters received:", req.body); // Debugging information

    const { categories, colors, priceRange, materials } = req.body;
    const filters = {};

    if (categories && categories.length) filters.category = { $in: categories };
    if (colors && colors.length) filters.color = { $in: colors };
    if (materials && materials.length) filters.material = { $in: materials };
    if (priceRange) filters.price = { $lte: priceRange };

    console.log("Filters applied:", filters); // Debugging information

    try {
        const products = await Product.find(filters);
        console.log("Filtered products:", products); // Debugging information
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

const Search = async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const regex = new RegExp(query, 'i'); // Case-insensitive search
        const products = await Product.find({
            $or: [
                { product_id: regex },
                { name: regex },
                { material: regex },
                { description: regex },
                { category: regex }, 
                { color: regex }
            ]
        }).limit(9); // Limit results to 10 for performance

        // let didYouMean = [];
        // if (products.length === 0) {
        //     didYouMean = spellcheck.getCorrections(query, 1);
        // }

        res.status(200).json({ products });

    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
}

const AddToCart = async (req, res) => {
    const { productId, price } = req.body;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!req.session.user) {
            if (!req.session.cart) {
                req.session.cart = { items: [] };
            }
            const existingCartItem = req.session.cart.items.find(item => item.productId.toString() === productId.toString());
            if (existingCartItem) {
                existingCartItem.quantity += 1;
            } else {
                req.session.cart.items.push({
                    productId: productId,
                    quantity: 1,
                    price: price
                });
            }
            return res.status(200).json({ message: 'Product added to guest cart successfully' });
        }

        const user = await User.findById(req.session.user._id);
        const existingCartItem = user.cart.items.find(item => item.productId.toString() === productId.toString());
        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            user.cart.items.push({
                productId: productId,
                quantity: 1,
                price: price
            });
        }

        user.cart.totalprice = user.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await user.save();
        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const Cart = async (req, res) => {
    try {
        if (!req.session.user) {
            const sessionCart = req.session.cart ? req.session.cart.items : [];

            const cartItems = await Promise.all(sessionCart.map(async item => {
                const product = await Product.findById(item.productId);
                return {
                    productId: product,
                    quantity: item.quantity,
                    price: item.price
                };
            }));

            return res.render('ShoppingCart', {
                cart: { items: cartItems },
                user: null
            });
        }

        const user = await User.findById(req.session.user._id).populate('cart.items.productId');

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('ShoppingCart', {
            cart: user.cart,
            user: user
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Internal Server Error');
    }
}
// controllers/productController.js


const updateCart = async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find the correct size variant and check quantity
        const sizeVariant = product.sizes.find(size => size.quantity >= quantity);

        if (!sizeVariant) {
            return res.status(400).json({ error: 'Insufficient product quantity available' });
        }

        if (!req.session.user) {
            // Guest user
            if (!req.session.cart) {
                return res.status(404).json({ error: 'Cart not found' });
            }

            const cartItem = req.session.cart.items.find(item => item.productId.toString() === productId.toString());

            if (!cartItem) {
                return res.status(404).json({ error: 'Item not found in cart' });
            }

            cartItem.quantity = quantity;

            // Calculate total price directly
            let totalPrice = 0;
            for (const item of req.session.cart.items) {
                totalPrice += item.price * item.quantity;
            }
            req.session.cart.totalprice = totalPrice;

            return res.status(200).json({ message: 'Cart updated successfully', totalprice: req.session.cart.totalprice });
        }

        // Logged-in user
        const user = await User.findById(req.session.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cartItem = user.cart.items.find(item => item.productId.toString() === productId.toString());

        if (!cartItem) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;

        // Calculate total price directly
        let totalPrice = 0;
        for (const item of user.cart.items) {
            totalPrice += item.price * item.quantity;
        }
        user.cart.totalprice = totalPrice;

        await user.save();

        res.status(200).json({ message: 'Cart updated successfully', totalprice: user.cart.totalprice });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateCartPrice = async (req, res) => {
    try {
        const { totalPrice } = req.body;

        if (typeof totalPrice !== 'number' || isNaN(totalPrice)) {
            return res.status(400).json({ error: 'Invalid total price' });
        }

        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Assuming the user has a cart field which stores cart details
        user.cart.totalprice = totalPrice;
        await user.save();

        res.status(200).json({ message: 'Cart price updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}



const removeFromCart = async (req, res) => {
    console.log('Entered removeFromCart function');
    const productId = req.params.productId;

    try {
        if (req.session.user) {
            // Logged-in user
            const user = await User.findById(req.session.user._id);
            if (!user) {
                console.log('User not found');
                return res.status(404).send('User not found');
            }

            // Filter out the item from the user's cart
            user.cart.items = user.cart.items.filter(item => item.productId.toString() !== productId.toString());
            user.cart.totalprice = user.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

            await user.save();

            console.log('Product removed from user cart successfully');
            res.status(200).json({ message: 'Product removed from cart successfully' });
        } else if (req.session.cart) {
            // Guest user
            req.session.cart.items = req.session.cart.items.filter(item => item.productId.toString() !== productId.toString());
            console.log('Product removed from guest cart successfully');
            res.status(200).json({ message: 'Product removed from guest cart successfully' });
        } else {
            console.log('No cart found in session');
            res.status(404).send('No cart found in session');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).send('Internal Server Error');
    }
}

//get use4r  by id
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('user-detail', { user });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Server Error');
    }
};
const getUserOrder= async(req, res) => {
   

   

    try {
        // Check if the user is authenticated and their ID is available in the session
        if (!req.session.user || !req.session.user._id) {
            return res.status(403).send('User not authenticated');
        }

        const userId = req.session.user._id;

        // Find orders for the current user by their user ID
        const ordersUser = await Orderr.find({ user_id: userId })
            .populate({
                path: 'product_ids',
                select: 'name img price',
                model: 'Product'
            });

        console.log('Orders for user:', ordersUser); // Log the orders

        res.render('myAccount', { ordersUser }); // Pass ordersUser to the EJS template
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).render('error', { error });
    }
};


//Billing Information - Checkout
const BillingInformation = async (req, res) => {
    try {
        const { shipping__address } = req.body;

        // Update user's billing address in the database
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure user.address is initialized and is an array
        user.address = user.address || [];

        // Custom function to check for duplicate addresses
        const isDuplicateAddress = (newAddress) => {
            return user.address.some(addr => (
                addr.address.toLowerCase() === newAddress.address.toLowerCase() &&
                addr.city.toLowerCase() === newAddress.city.toLowerCase() &&
                addr.state.toLowerCase() === newAddress.state.toLowerCase()
            ));
        };

        // Check if the new address already exists in the user's array
        if (isDuplicateAddress(shipping__address)) {
            return res.status(200).json({ message: 'Address already exists' });
        }

        // If address doesn't exist, add it to the array
        user.shipping_address.push({
            address: shipping__address.address,
            city: shipping__address.city,
            state: shipping__address.state,
            postal_code: shipping__address.postal_code
        });

        await user.save();

        res.status(200).json({ message: 'Billing information updated successfully' });
    } catch (error) {
        console.error('Error updating billing information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getIndianProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('indian', { products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

const getShopAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('shopAll', { products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};


module.exports = {
    GetUser,
    AddUser,
    checkAddress,
    checkLoggedIn,
    Search,
    AddToCart,
    Cart, 
    updateCart,
    updateCartPrice,
    removeFromCart,
    getUserById, 
    BillingInformation,
    filterProducts,
    getUserOrder,
    getShopAllProducts,
    getIndianProducts

};
