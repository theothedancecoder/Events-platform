import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

let cached = (globalThis as any).mongoose || { conn: null, promise: null }

export const connectToDatabase = async () => {
    if(cached.conn) return cached.conn  // Return existing connection if it exists

    if(!MONGODB_URI) throw new Error('MONGODB_URI is missing')

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: 'DanceItApp',
        bufferCommands: false,
    })

    cached.conn = await cached.promise
    return cached.conn
}
