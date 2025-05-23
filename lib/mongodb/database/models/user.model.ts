import { model, models, Schema } from "mongoose"

const UserSchema = new Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },      // Removed unique constraint
    username: { type: String, required: true },   // Removed unique constraint
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    photo: { type: String, required: true },
})

const User = models.User || model('User', UserSchema)
export default User
