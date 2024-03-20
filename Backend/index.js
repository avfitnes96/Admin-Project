const express = require("express");
const Config = require('./db/Config');
const User = require("./models/User");
const Driver = require("./models/Driver");
const Adduser = require("./models/Adduser")
const Car = require("./models/Car")
const File = require("./models/File")
const Cors = require("cors");
const bodyParser = require('body-parser');
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.json());
app.use(Cors());

app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/CarImage', express.static(path.join(__dirname, '/CarImage')));
app.use('/DriverImage', express.static(path.join(__dirname, '/DriverImage')));



// Login Route
app.post('/User', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body)

        console.log("Received credentials:", email, password);
        if (email && password) {
            const user = await User.findOne({ email: email });
            if (user) {
                // Check if the provided password matches the stored password
                if (user.password === password) {
                    res.json({
                        status: "success",
                        message: "Login successful",
                        user: {
                            _id: user._id,
                            email: user.email,
                            // Include other user properties if needed
                        },
                    });
                } else {
                    res.status(401).json({
                        status: "failed",
                        message: "Email or password does not match",
                    });
                }
            } else {
                res.status(404).json({
                    status: "failed",
                    message: "Email is not registered",
                });
            }
        } else {
            res.status(400).json({
                status: "failed",
                message: "Email and password are required fields",
            });
        }
        console.log("Finished userLogin successfully");
    } catch (error) {
        console.error("Error in userLogin:", error);
        res.status(500).json({
            status: "failed",
            message: "Unable to login. Internal server error.",
        });
    }
});
// Update password route
app.post('/changePassword', async (req, res) => {
    try {
        const { oldPassword, newPassword, userEmail } = req.body;
        console.log(oldPassword, newPassword, userEmail)

        if (!userEmail) {
            return res.status(400).json({
                status: "failed",
                message: "User email not found in session.",
            });
        }

        // Fetch the user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: "User not found.",
            });
        }

        // Check if old password is correct
        // const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (oldPassword != user.password) {
            return res.status(401).json({
                status: "failed",
                message: "Old password is incorrect.",
            });
        }

        // Hash the new password before storing it
        // const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        const updatedUser = await User.updateOne(
            { email: userEmail },
            { password: newPassword },
        );

        console.log("USER:::::::::", updatedUser)

        if (updatedUser) {
            return res.json({
                status: "success",
                message: "Password updated successfully.",
            });
        } else {
            return res.status(500).json({
                status: "failed",
                message: "Internal server error. Unable to update password.",
            });
        }
    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({
            status: "failed",
            message: "Unable to update password. Internal server error.",
        });
    }
});


//adduser api  

app.post('/Adduser', async (req, res) => {
    const { firstname, lastname, email, technology, age, gender, phoneNumber, address } = req.body;

    try {
        // Check if the email is already registered
        const existingUser = await Adduser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Create a new user
        const newUser = new Adduser({
            firstname,
            lastname,
            email,
            technology,
            age,
            gender,
            phoneNumber,
            address,
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


//get users api 
app.get("/User", async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await Adduser.find().sort({ timeTemps: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users.", error: error.message });
    }
});

//users delete api 
app.delete("/User/:_id", async (req, resp) => {
    const result = await Adduser.deleteOne({ _id: req.params._id })
    resp.send(result);
});

//user update api 
app.get("/UpdateUser/:_id", async (req, resp) => {
    const result = await Adduser.findOne({ _id: req.params._id })
    if (result) {
        resp.send(result);
    } else {
        resp.send({ result: "No Record Found" })
    }
});

app.put("/UpdateUser/:_id", async (req, resp) => {
    try {
        const result = await Adduser.updateOne(
            { _id: req.params._id }, // Filter to find the document with the given _id
            { $set: req.body } // Update with the data from req.body
        );
        resp.send(result);
    } catch (error) {
        resp.status(500).send(error);
    }
});

//search api user
app.get('/search/:key', async (req, res) => {
    try {
        const { key } = req.params;
        // Perform a case-insensitive search for users whose firstname, lastname, or email match the search value
        const filteredUsers = await Adduser.find({
            $or: [
                { firstname: { $regex: new RegExp(key, 'i') } },
                { lastname: { $regex: new RegExp(key, 'i') } },
                { email: { $regex: new RegExp(key, 'i') } }
            ]
        });
        res.json(filteredUsers);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


//total users api
app.get('/api/total-users', async (req, res) => {
    try {
        const totalUsers = await Adduser.countDocuments();
        res.json({ totalUsers });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//total male user api
app.get('/api/total-male', async (req, res) => {
    try {
        const totalMaleUsers = await Adduser.countDocuments({ gender: 'male' });
        res.json({ totalMaleUsers });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//active deactive api user 
app.patch('/Active/:id', async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        const user = await Adduser.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the active state in the database
        user.active = active;
        await user.save();

        res.json({ message: 'Active state updated successfully' });
    } catch (error) {
        console.error('Error updating active state:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//image uplaod api
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9) + file.originalname.slice(-4); // Append a unique suffix to the filename
        cb(null, uniqueSuffix); // Generate a unique filename for the uploaded file
    }
});

const upload = multer({ storage: storage });

// Endpoint to handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });

    }

    try {
        // Save the file path to the database
        const newFile = new File({ path: req.file.path });
        await newFile.save();
        console.log(newFile)
        res.json({ imagePath: req.file.path });
    } catch (error) {
        console.error("Error saving file path to database:", error);
        res.status(500).json({ error: 'Failed to save file path to database' });
    }
});

// Drivers add api 
const storageDriver = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'DriverImage/'); // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9) + file.originalname.slice(-4); // Append a unique suffix to the filename
        cb(null, uniqueSuffix); // Generate a unique filename for the uploaded file
    }
});

const uploadDriver = multer({ storage: storageDriver });

app.post('/AddDriver', uploadDriver.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Extract car data from the request body
        const { driverName, licenseNumber, phoneNumber, address } = req.body;

        // Validate required fields
        if (!driverName || !licenseNumber || !phoneNumber || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Save the file path and other car data to the database
        const newDriver = new Driver({
            driverName,
            licenseNumber,
            phoneNumber,
            address,
            image: req.file.path // Assuming req.file.path contains the path to the uploaded image
        });

        await newDriver.save();
        res.json({ message: 'driver details and image uploaded successfully', car: newDriver });
    } catch (error) {
        console.error("Error saving driver details and file path to database:", error);
        res.status(500).json({ error: 'Failed to save driver details and file path to database' });
    }
});

//get all drivers api
app.get("/Driver", async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await Driver.find().sort({ timeTemps: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users.", error: error.message });
    }
});

app.delete("/Driver/:_id", async (req, resp) => {
    const result = await Driver.deleteOne({ _id: req.params._id })
    resp.send(result);
});

//driver update api 
app.get("/UpdateDriver/:_id", async (req, resp) => {
    const result = await Driver.findOne({ _id: req.params._id })
    if (result) {
        resp.send(result);
    } else {
        resp.send({ result: "No Record Found" })
    }
});

app.put("/UpdateDriver/:_id", async (req, resp) => {
    try {
        const result = await Driver.updateOne(
            { _id: req.params._id }, // Filter to find the document with the given _id
            { $set: req.body } // Update with the data from req.body
        );
        resp.send(result);
    } catch (error) {
        resp.status(500).send(error);
    }
});

//search api driver
app.get('/searchDriver/:key', async (req, res) => {
    const key = req.params.key.toLowerCase();
    try {
        const result = await Driver.find({
            $or: [
                { driverName: { $regex: key, $options: 'i' } }, // Case-insensitive search for driverName
                { licenseNumber: { $regex: key, $options: 'i' } }, // Case-insensitive search for licenseNumber
                { phoneNumber: { $regex: key } }, // Exact match for phoneNumber
                { address: { $regex: key, $options: 'i' } }, // Case-insensitive search for address
            ],
        });
        res.json(result);
    } catch (error) {
        console.error("Error searching data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//total drivers api show
app.get('/api/total-drivers', async (req, res) => {
    try {
        const totalDrivers = await Driver.countDocuments();
        res.json({ totalDrivers });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//active deactive api user 
app.patch('/ActiveDriver/:id', async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        const driver = await Driver.findById(id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update the active state in the database
        driver.active = active;
        await driver.save();

        res.json({ message: 'Active state updated successfully' });
    } catch (error) {
        console.error('Error updating active state:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//get car api 
app.get("/Car", async (req, res) => {
    try {
        // Fetch all users from the database
        const cars = await Car.find().sort({ timeTemps: -1 });
        res.status(200).json(cars);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users.", error: error.message });
    }
});

//car delete api 
app.delete("/Car/:_id", async (req, resp) => {
    const result = await Car.deleteOne({ _id: req.params._id })
    resp.send(result);
});

//car update api 
app.get("/UpdateCar/:id", async (req, resp) => {
    try {
        const result = await Car.findOne({ _id: req.params.id });
        if (result) {
            resp.send(result);
        } else {
            resp.status(404).send({ error: "No Record Found" });
        }
    } catch (error) {
        console.error("Error fetching car details:", error);
        resp.status(500).send({ error: "Failed to fetch car details" });
    }
});

const storageup = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9) + file.originalname.slice(-4); // Append a unique suffix to the filename
        cb(null, uniqueSuffix); // Generate a unique filename for the uploaded file
    }
});

// const uploadup = multer({ storage: storageup });
const uploadup = multer({ dest: 'uploads/' });
app.put("/UpdateCar/:id", uploadup.single("image"), async (req, res) => {
    try {
        const { model, brand, year, color, price, registrationDate } = req.body;
        const imagePath = req.file ? req.file.path : null; // Store the image path if uploaded

        // Update the car data in the database using Mongoose
        const updatedCar = await Car.findByIdAndUpdate(req.params.id, {
            model,
            brand,
            year,
            color,
            price,
            registrationDate,
            image: imagePath // Update the image path in the database
        }, { new: true });

        if (!updatedCar) {
            return res.status(404).json({ error: "Car not found" });
        }

        res.json({ success: true, message: "Car data updated successfully", updatedCar });
    } catch (error) {
        console.error("Error updating car data:", error);
        res.status(500).json({ error: "Failed to update car data" });
    }
});



//search api car
app.get('/searchCar/:key', async (req, res) => {
    try {
        const { key } = req.params;
        // Perform  match the search value
        const filteredCars = await Car.find({
            $or: [
                { model: { $regex: new RegExp(key, 'i') } },
                { brand: { $regex: new RegExp(key, 'i') } },

            ]
        });
        res.json(filteredCars);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//add car image api
// Endpoint to handle image upload along with other fields
const storagecar = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'CarImage/'); // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9) + file.originalname.slice(-4); // Append a unique suffix to the filename
        cb(null, uniqueSuffix); // Generate a unique filename for the uploaded file
    }
});

const uploadCar = multer({ storage: storagecar });

app.post('/Addcar', uploadCar.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Extract car data from the request body
        const { model, brand, year, color, price, registrationDate } = req.body;

        // Validate required fields
        if (!model || !brand || !year || !color || !price || !registrationDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Save the file path and other car data to the database
        const newCar = new Car({
            model,
            brand,
            year,
            color,
            price,
            registrationDate,
            image: req.file.path // Assuming req.file.path contains the path to the uploaded image
        });

        await newCar.save();
        res.json({ message: 'Car details and image uploaded successfully', car: newCar });
    } catch (error) {
        console.error("Error saving car details and file path to database:", error);
        res.status(500).json({ error: 'Failed to save car details and file path to database' });
    }
});


app.listen(5500, () => {
    console.log("Server is running on port 5500");
});
