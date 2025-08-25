import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true },  // no unique here
  userName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, default: "user" }
});

export default mongoose.model("User", userSchema);
