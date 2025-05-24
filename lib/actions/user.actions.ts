'use server'

import { revalidatePath } from 'next/cache'
import User from '@/lib/mongodb/database/models/user.model'
import Order from '@/lib/mongodb/database/models/order.model'
import Event from '@/lib/mongodb/database/models/event.model'
import { handleError } from '@/lib/utils'
import { CreateUserParams, UpdateUserParams } from '@/types'
import { connectToDatabase } from '@/lib/mongodb/database'
import mongoose from 'mongoose'

export const createUser = async (user: CreateUserParams) => {
  try {
    console.log('Connecting to database...')
    const connection = await connectToDatabase()
    console.log('Connected to database')

    // Get the users collection directly
    const db = connection.connection.db
    const usersCollection = db.collection('users')

    // Use findOneAndUpdate with upsert to either update or insert
    const result = await usersCollection.findOneAndUpdate(
      { clerkId: user.clerkId }, // find criteria
      {
        $setOnInsert: {
          ...user,
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date()
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        upsert: true, // create if doesn't exist
        returnDocument: 'after' // return the updated/inserted document
      }
    )

    console.log('User processed:', result)
    return result
  } catch (error) {
    console.error('Error in createUser:', error)
    // If it's a duplicate key error, try to fetch the existing user
    if ((error as any)?.code === 11000) {
      try {
        const connection = await connectToDatabase()
        const db = connection.connection.db
        const usersCollection = db.collection('users')
        const existingUser = await usersCollection.findOne({ clerkId: user.clerkId })
        if (existingUser) {
          console.log('Found existing user:', existingUser)
          return existingUser
        }
      } catch (fetchError) {
        console.error('Error fetching existing user:', fetchError)
      }
    }
    throw error
  }
}

export async function getUserById(userId: string) {
  try {
    await connectToDatabase()

    const user = await User.findById(userId)

    if (!user) throw new Error('User not found')
    return JSON.parse(JSON.stringify(user))
  } catch (error) {
    console.error('Error getting user:', error)
    handleError(error)
    return null
  }
}

export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase()

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, { new: true })

    if (!updatedUser) throw new Error('User update failed')
    return JSON.parse(JSON.stringify(updatedUser))
  } catch (error) {
    console.error('Error updating user:', error)
    handleError(error)
    return null
  }
}

export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase()

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId })

    if (!userToDelete) {
      throw new Error('User not found')
    }

    // Unlink relationships
    await Promise.all([
      // Update the 'events' collection to remove references to the user
      Event.updateMany(
        { _id: { $in: userToDelete.events } },
        { $pull: { organizer: userToDelete._id } }
      ),

      // Update the 'orders' collection to remove references to the user
      Order.updateMany({ _id: { $in: userToDelete.orders } }, { $unset: { buyer: 1 } }),
    ])

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id)
    revalidatePath('/')

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null
  } catch (error) {
    console.error('Error deleting user:', error)
    handleError(error)
    return null
  }
}
