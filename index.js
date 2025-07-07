const sequelize = require('./database');
const User = require('models/User');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database!');

    // Sync the model with DB (creates table if not exists)
    await sequelize.sync();

    // Create a new user
    const newUser = await User.create({
      name: 'Saif',
      email: 'saif@example.com',
      password_hash: 'hashed_password_here',
    });

    console.log('User created:', newUser.toJSON());

    // Fetch all users
    const users = await User.findAll();
    console.log('All users:', users.map(u => u.toJSON()));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

main();
