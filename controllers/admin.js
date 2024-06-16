const User = require('../models/User');
const collections = require('../models/Collections');
const bcrypt = require('bcrypt');
const Product = require('../models/product');

// Function to add an admin
const addAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber } = req.body;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            firstname: firstName,
            lastname: lastName,
            email,
            password: hashedPassword,
            isAdmin: true,
            address: [], // Optional field, can be updated if needed
            wishlist: [],
            orders: [],
            cart: [],
            Token: '',
            Tokenexpiry: null,
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Admin added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Function to add an admin
const addCollection = async (req, res) => {
    try {
        const {CollectionName,CollectionDescription} = req.body;

        // Hash the password before saving
        // const hashedPassword = await bcrypt.hash(password, 10);
        console.log(CollectionName);
        console.log(CollectionName);
        const newCollection = new collections ({
            Collection_Name: CollectionName,
            Collection_Description:CollectionDescription,

          
        });

        await newCollection.save();
        res.status(201).json({ message: 'collection added successfully' });
        console.log("collection added successfully")
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//edit collection on the server side
const editCollection = async (req, res) => {
    const { id, collectionName, description, launchDate } = req.body;
    try {
        const updatedCollection = await Collection.findByIdAndUpdate(id, {
            Collection_Name: collectionName,
            Collection_Description: description,
            Date: new Date(launchDate) // Ensure the date is correctly formatted
        }, { new: true });
        res.status(200).json({ success: true, data: updatedCollection });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
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
        sizes,
        rating,
        material,
        color,
        no_sales
    } = req.body;

    try {
        // Validate input (example of basic validation)
        if (!product_id || !collection_id || !name || !description || !category || !price || !img || !material || !color) {
            return res.status(400).json({ message: 'All fields are required except sizes, rating, and no_sales' });
        }

        // Create a new Product object based on the schema
        const newProduct = new Product({
            product_id,
            collection_id,
            name,
            description,
            category,
            price,
            img,
            sizes: sizes || [], // If sizes are not provided, default to an empty array
            rating: rating || 0, // Default rating to 0 if not provided
            material,
            color,
            no_sales: no_sales || 0 // Default no_sales to 0 if not provided
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

module.exports = {
    addAdmin,
    addCollection,
    addProduct, 
    GetAllUsers
}









