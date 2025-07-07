const express = require('express');
const bcrypt = require('bcrypt');
const sequelize = require('./database');
const User = require('../models/User');

const app = express();
app.use(express.urlencoded({ extended: true })); // parse form data

app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists (optional)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send('User with this email already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const newUser = await User.create({
      name,
      email,
      password_hash: hashedPassword,
    });

    res.send('User created successfully!');

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.get('/signup', (req, res) => {
  res.send('Signup page or form here');
});


// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
