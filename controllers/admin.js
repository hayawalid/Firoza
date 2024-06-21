const User = require('../models/User');
const collections = require('../models/Collections');
const bcrypt = require('bcrypt');
const Product = require('../models/product');
const Order = require('../models/Orders');
const Request = require('../models/Requests');
const Customization = require('../models/Customization')
const Review = require('../models/reviews');
const { v4: uuidv4 } = require('uuid');
const formidable = require('formidable')

// Function to add an admin
const addAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            firstname: firstName,
            lastname: lastName,
            email,
            password: hashedPassword,
            isAdmin: true,
            // Optional fields initialized as empty arrays
            shipping_address: [],
            wishlist: [],
            orders: [],
            cart: {
                items: [],
                totalprice: 0
            },
            Token: '',
            Tokenexpiry: null,
        });

        await newAdmin.save();
        res.status(200).json({ message: 'Admin added successfully' });
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ error: error.message });
    }
};



// Function to add collection
const addCollection = async (req, res) => {
    const {
        CollectionName,
        CollectionDescription,
        img
    } = req.body;

    try {
        // Validate input
        if (!CollectionName || !CollectionDescription) {
            return res.status(400).send('<script>alert("Collection name and description are required"); window.history.back();</script>');
        }

        // Check if the collection name already exists
        const existingCollection = await collections.findOne({ Collection_Name: CollectionName });
        if (existingCollection) {
            return res.status(400).send('<script>alert("Collection name already exists"); window.history.back();</script>');
        }

        // Create a new Collection object based on the schema
        const newCollection = new collections({
            Collection_Name: CollectionName,
            Collection_Description: CollectionDescription,
            collection_id: uuidv4(),
            img
        });

        // Save the collection to the database
        await newCollection.save();

        res.status(201).send('<script>alert("Collection added successfully"); window.location.href = "/admin/Dashboard";</script>');
    } catch (error) {
        console.error(error);
        res.status(500).send(`<script>alert("An error occurred: ${error.message}"); window.history.back();</script>`);
    }
};

const getCollections = async (req, res) => {
    try {
        const getC = await collections.find({});
        res.render('EditLayout', { getC });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to delete a collection
// const deleteCollection = async (req, res) => {
//     console.log("da5al gowa el function");
//     try {

//         console.log("akfufrujgr");
//         const { id } = req.params;
//         const deletedCollection = await collections.findByIdAndDelete(id);
//         console.log("1111111");
//         if (!deletedCollection) {
//             return res.status(404).json({ error: 'Collection not found' });
//         }
//         console.log(`Attempting to delete collection with ID: ${id}`);
//         res.status(200).json({ message: 'Collection deleted successfully' });
//     } catch (error) {
//         console.error('Error collection:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };

const deleteCollection = async (req, res) => {
    console.log("Entered the deleteCollection function");
    try {
        const { id } = req.params;
        // Find the collection by ID
        const deletedCollection = await collections.findByIdAndDelete(id);

        if (!deletedCollection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Extract the collection name from the deleted collection
        const collectionName = deletedCollection.Collection_Name;

        // Delete all products with the same collection ID (collection name)
        const deletedProducts = await Product.deleteMany({ collection_id: collectionName });



        res.status(200).json({ message: 'Collection and associated products deleted successfully' });
    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



//edit collection on the server side
const editCollection = async (req, res) => {
    const collectionId = req.params.id;
    const { CollectionName, CollectionDescription } = req.body;

    try {
        // Update the collection document by its collection_id
        const updatedCollection = await collections.findByIdAndUpdate(
            collectionId,
            {
                Collection_Name: CollectionName,
                Collection_Description: CollectionDescription
            },
            { new: true }
        );

        if (!updatedCollection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.status(200).json({ success: true, data: updatedCollection });
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({ error: error.message });
    }
};


// const editCollection = async (req, res) => {
   

//     form.parse(req, async (err, fields, files) => {
//         if (err) {
//             console.error('Error parsing form data:', err);
//             return res.status(500).json({ error: 'Failed to parse form data' });
//         }

//         const { collectionId, collectionName, collectionDescription } = fields;
//         const updateData = {
//             Collection_Name: collectionName,
//             Collection_Description: collectionDescription,
//         };

//         if (files.img) {
//             const oldPath = files.img.filepath;
//             const newPath = path.join(__dirname, 'uploads', files.img.originalFilename);
//             fs.rename(oldPath, newPath, (err) => {
//                 if (err) throw err;
//             });
//             updateData.img = `/uploads/${files.img.originalFilename}`;
//         }

//         try {
//             const updatedCollection = await collections.findByIdAndUpdate(collectionId, updateData, { new: true });

//             if (!updatedCollection) {
//                 return res.status(404).json({ error: 'Collection not found' });
//             }

//             res.status(200).json({ success: true, data: updatedCollection });
//         } catch (error) {
//             console.error('Error updating collection:', error);
//             res.status(500).json({ error: 'Failed to update collection' });
//         }
//     });
// };


const validateCollectionName = async (req, res) => {
    const { collectionName, collectionId } = req.body;
    try {
        const collection = await collections.findOne({ Collection_Name: collectionName });
        if (collection && collection._id.toString() !== collectionId) {
            return res.json({ isUnique: false });
        }
        return res.json({ isUnique: true });
    } catch (error) {
        console.error('Error validating collection name:', error);
        res.status(500).json({ error: 'Error validating collection name' });
    }
};


//Function to add a product
const addProduct = async (req, res) => {
    const {
        product_id,
        collection_id,
        name,
        description,
        category,
        price,
        img,
        material,
        color,
        rating,
        no_sales,
        sizes,
        quantities
    } = req.body;

    try {
        // Validate input
        if (!collection_id || !name || !description || !category || !price || !img || !material || !color || !quantities) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Ensure sizes and quantities arrays are the same length
        if (sizes.length !== quantities.length) {
            return res.status(400).json({ message: 'Add a size or quantity' });
        }

        // Create size-quantity pairs
        const sizeQuantityPairs = sizes.map((size, index) => ({
            size,
            quantity: quantities[index]
        }));

        // Create a new Product object based on the schema
        const newProduct = new Product({
            product_id,
            collection_id,
            name,
            description,
            category,
            price,
            img,
            sizes: sizeQuantityPairs,
            rating: rating || 0,
            material,
            color,
            no_sales: no_sales || 0
        });

        // Save the product to the database
        await newProduct.save();

        res.status(201).json({ message: 'Product added successfully', data: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};



const GetAllUsers = (req, res) => {
    User.find()
        .then(result => {

            res.render('Users', { users: result }); // Note the lowercase 'users'
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error retrieving users');
        });
};
//function to get orders

// const getOrders = (req, res) => {
//     Order.find()
//         .then(result => {

//             res.render('admin-orders', { orders: result }); // Note the lowercase 'users'
//         })
//         .catch(err => {
//             console.log(err);
//             res.status(500).send('Error retrieving users');
//         });
// };

// const getOrders = async (req, res) => {
//     try {
//         const orders = await Order.find()
//             .populate('user_id', 'name') // Populate user name
//             .populate('product_ids', 'name price'); // Populate product name and price

//         res.render('admin-orders', { orders }); // Pass the orders data to the view
//     } catch (err) {
//         console.error('Error fetching orders:', err);
//         res.status(500).send('Server Error');
//     }
// };

const getOrders = (req, res) => {
    Order.find()
        .populate('user_id', 'firstname lastname email') // Populate the user_id field with the firstname and lastname fields from the User model
        .populate({
            path: 'product_ids',
            select: 'name',
            model: 'Product'
        })
        .then(result => {
            res.render('admin-orders', { orders: result });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error retrieving orders');
        });
};


const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('Admin-products', { products });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).send('Server error');
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const usersWithCartItem = await User.find({ 'cart.items.productId': id });
        for (const user of usersWithCartItem) {
            user.cart.items = user.cart.items.filter(item => item.productId.toString() !== id.toString());
            user.cart.totalprice = user.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            await user.save();
        }

        // Remove product from users' wishlists
        const usersWithWishlistItem = await User.find({ wishlist: id });
        for (const user of usersWithWishlistItem) {
            user.wishlist = user.wishlist.filter(item => item.toString() !== id.toString());
            await user.save();
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// const editProduct = async (req, res) => {
//     try {
//         const { product_id, name, price, collection_id, category, description, sizes, quantities, material, color } = req.body;

//         if (!product_id || !name || !price || !collection_id || !category || !description || !sizes || !quantities || !material || !color) {
//             return res.status(400).json({ message: 'All fields are required' });
//         }

//         if (sizes.length !== quantities.length) {
//             return res.status(400).json({ message: 'Sizes and quantities must match' });
//         }

//         const sizeQuantityPairs = sizes.map((size, index) => ({
//             size,
//             quantity: quantities[index]
//         }));

//         const updatedProduct = await Product.findByIdAndUpdate(product_id, {
//             name,
//             price,
//             collection_id,
//             category,
//             description,
//             sizes: sizeQuantityPairs,
//             material,
//             color
//         }, { new: true });

//         if (!updatedProduct) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         res.status(200).json({ message: 'Product updated successfully', data: updatedProduct });
//     } catch (error) {
//         console.error('Error updating product:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };
const getEditCollectionPage = async (req, res) => {
    try {
        const collectionID = req.params.id;
        // const getcollections = await collectionID.find(); // Fetch all collections

        const collection = await collections.findById(collectionID);


        res.render('EditCollection', { collection });
    } catch (error) {
        res.status(500).send('Server error');
    }
};


const getEditProductPage = async (req, res) => {
    try {
        const productId = req.params.id;
        const getcollections = await collections.find(); // Fetch all collections

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('EditProduct', { product, getcollections });
    } catch (error) {
        res.status(500).send('Server error');
    }
};

// Function to handle product edits
const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = req.body;

        // Ensure the sizes are processed correctly if they come as arrays
        if (Array.isArray(updatedData.sizes)) {
            updatedData.sizes = updatedData.sizes.map((size, index) => ({
                size,
                quantity: updatedData.quantities[index]
            }));
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
        if (!updatedProduct) {
            return res.status(404).send('Product not found');
        }
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//-------------------------------------------------------habiba-------------------------------------------

const getDashboard = async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    

    try {
        const userCount = await User.countDocuments({ isAdmin: false });
        // 1. Count documents (orders) created in the last 30 days
        const orderCount = await Order.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // 2. Calculate revenue from orders in the last 30 days
        const ordersLast30Days = await Order.find({
            createdAt: { $gte: thirtyDaysAgo }
        })
            .populate({
                path: 'product_ids',
                select: 'name',
                model: 'Product'
            })
        let revenueLast30Days = 0;
        ordersLast30Days.forEach(order => {
            revenueLast30Days += order.total_price;
        });

        // 3. Find products that are out of stock
        const productsOutOfStock = await Product.find({
            sizes: { $elemMatch: { quantity: 0 } }
        });

        // Render the EJS template with the collected data
        res.render('main', {
            ordersLast30Days: orderCount,
            revenueLast30Days,
            productsOutOfStock,
            count:userCount
        });
    } catch (error) {
        console.error('Error fetching order count:', error);
        res.status(500).render('error', { error }); // Render an error page or handle the error as needed
    }
};

const calculateCRR = async (startDate, endDate) => {
    try {
        // Count customers at the start of the period (excluding admins)
        const startCustomersCount = await User.countDocuments({
            createdAt: { $lt: startDate },
            isadmin: false
        });
        console.log('start Customers Count:', startCustomersCount);
        // Count customers at the end of the period (excluding admins)
        const endCustomersCount = await User.countDocuments({
            createdAt: { $lt: endDate },
            isadmin: false
        });
        console.log('End Customers Count:', endCustomersCount);
        // Count new customers acquired during the period (excluding admins)
        const newCustomersCount = await User.countDocuments({
            createdAt: { $gte: startDate, $lt: endDate },
            isadmin: false
        });
        console.log('New Customers Count:', newCustomersCount);

        // Check for division by zero
        if (startCustomersCount === 0) {
            console.warn('Warning: startCustomersCount is 0. Division by zero avoided.');
            return 0; // Or handle it as per your application's logic
        }

        // Check for negative counts
        if (newCustomersCount > endCustomersCount) {
            console.warn('Warning: newCustomersCount exceeds endCustomersCount. Potential for negative retention rate.');
            return 0; // Or handle it as per your application's logic
        }
        // Calculate Customer Retention Rate
        const retentionRate = ((endCustomersCount - newCustomersCount) / startCustomersCount) * 100;

        return retentionRate; // This will be a percentage value
    } catch (error) {
        console.error('Error calculating Customer Retention Rate:', error);
        throw error;
    }
};


const getStatistics = async (req, res) => {
    try {
        const startDate = new Date('2024-06-01');
        const endDate = new Date('2024-07-01');

        const retentionRate = await calculateCRR(startDate, endDate);
        // Count the number of users
        const userCount = await User.countDocuments({ isAdmin: false });

        // Get best-selling products by revenue
        const bestSellers = await Product.aggregate([
            {
                $project: {
                    name: 1,
                    quantity: 1,  // Assuming you have a field for quantity
                    revenue: { $multiply: ["$price", "$no_sales"] }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // Get most purchased products by number of sales
        const mostPurchased = await Product.find()
            .sort({ no_sales: -1 })
            .limit(4) // Limit to top 4 for display purposes
            .select('name no_sales');

        // Render the statistics view with user count, best sellers, and most purchased products
        res.render('statistics', { count: userCount, bestSellers, mostPurchased, retentionRate: retentionRate.toFixed(2) });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};
const getadmin = async (req, res) => {
    res.render("AddAdmin.ejs");
};

// Get all requests
const getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find().sort({ _id: -1 }); // Fetch all requests, sorted by newest first
        res.render('Admin-Requests', { requests }); // Render the 'requests' view and pass the requests data
    } catch (err) {
        console.error('Error fetching requests:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Accept a request
const acceptRequest = async (req, res) => {
    try {
        await Request.findByIdAndUpdate(req.params.id, { approvement: true });
        res.sendStatus(200);
    } catch (err) {
        console.error('Error accepting request:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Reject a request
const rejectRequest = async (req, res) => {
    try {
        await Request.findByIdAndUpdate(req.params.id, { approvement: false });
        res.sendStatus(200);
    } catch (err) {
        console.error('Error rejecting request:', err);
        res.status(500).send('Internal Server Error');
    }
};

const admincheckaddress = async (req, res) => {
    try {
        const { address } = req.body;
        const user = await User.findOne({ email: address });
        if (user) {
            res.status(500).json({ available: false });
        } else {
            res.status(200).json({ available: true });
        }
    } catch (error) {
        console.error('Error checking email availability:', error);
        res.status(500).json({ available: false });
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete the user' });
    }
};

const SearchUsers = async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const regex = new RegExp(query, 'i'); // Case-insensitive search
        const users = await User.find({
            $or: [
                 // Searching by user ID (if matches)
                { email: regex }, // Searching by email
                { firstname: regex }, // Searching by firstname
                { lastname: regex } // Searching by lastname
            ]
        });

        res.status(200).json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
};



const SearchOrders = async (req, res) => {
    const { query, date } = req.body;

    try {
        // Search criteria arrays
        const userSearchCriteria = [];
        const productSearchCriteria = [];
        const dateSearchCriteria = {};

        // Search for Users by email
        if (query) {
            userSearchCriteria.push({ email: { $regex: query, $options: 'i' } });
        }

        // Search for Products by name
        if (query) {
            productSearchCriteria.push({ name: { $regex: query, $options: 'i' } });
        }

        // Add date search criteria
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            dateSearchCriteria.created_at = { $gte: startDate, $lt: endDate };
        }

        // Fetch Users and Products based on search criteria
        const users = await User.find({ $or: userSearchCriteria });
        const products = await Product.find({ $or: productSearchCriteria });

        // Extract User and Product IDs
        const userIds = users.map(user => user._id);
        const productIds = products.map(product => product._id);

        // Search Orders by User IDs, Product IDs, and Date
        const orders = await Order.find({
            $and: [
                { $or: [{ user_id: { $in: userIds } }, { product_ids: { $in: productIds } }] },
                dateSearchCriteria
            ]
        }).populate('user_id').populate('product_ids');

        // Send the results back to the client
        res.json({ orders });
    } catch (error) {
        console.error('Error searching orders:', error);
        res.status(500).send('Server Error');
    }
};
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate('user').populate('prod');
        res.render('reviewsAdmin', { reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send('Internal Server Error');
    }
};
module.exports = {
    addAdmin,
    addCollection,
    addProduct,
    editCollection,
    getCollections,
    deleteCollection,
    GetAllUsers,
    getOrders,
    getProducts,
    deleteProduct,
    getEditProductPage,
    editProduct,
    getDashboard,
    getStatistics,
    getadmin,
    getAllRequests,
    acceptRequest,
    rejectRequest,
    admincheckaddress,
    deleteUser,
    SearchOrders,
    SearchUsers,
    getReviews,
    validateCollectionName,
    getEditCollectionPage
};



//function to get orders

// exports.getOrders = async (req, res) => {
//     try {
//         const orders = await Order.find()
//             .populate({
//                 path: 'user_id',
//                 model: 'User'
//             })
//             .populate({
//                 path: 'product_ids',
//                 model: 'Product'
//             });

//         res.render('admin-orders', { orders });
//     } catch (err) {
//         console.error('Error fetching orders:', err);
//         res.status(500).send('Server Error');
//     }
// };

