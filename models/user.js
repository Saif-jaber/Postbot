import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, default: 'user' },
  profilePicture: { type: String, default: 'images/profile-user.png' },
});

export default mongoose.model('User', userSchema);