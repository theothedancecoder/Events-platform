'use server'

import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/utils'

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'
import User from '../mongodb/database/models/user.model'
import Category from '../mongodb/database/models/category.model'
import { connectToDatabase } from '../mongodb/database'
import Event from '../mongodb/database/models/event.model'

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    .populate({ path: 'category', model: Category, select: '_id name' })
}

function isValidImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    // Allow URLs from known upload domains without typical image extensions
    const allowedHostnames = ['utfs.io', 'sea1.ingest.uploadthing.com', 'yfg7y7pev1.ufs.sh'];
    if (allowedHostnames.includes(parsedUrl.hostname)) {
      return true;
    }
    // Basic check for image file extensions
    return /\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff?)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

export async function getEventById(eventId: string) {
  if (!eventId) return null;
  
  try {
    await connectToDatabase();
    const event = await populateEvent(Event.findById(eventId));
    
    if (!event) return null;
    
    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    console.error('Error in getEventById:', error);
    return null;
  }
}

// CREATE
export const createEvent = async({ userId, event, path }: CreateEventParams)=> {
  try {
    await connectToDatabase()

    const organizer = await User.findOne ({clerkId:userId} )
    if (!organizer) {throw new Error('Organizer not found')}

    // Validate imageUrl
    if (event.imageUrl && !isValidImageUrl(event.imageUrl)) {
      throw new Error('Invalid image URL')
    }

    const newEvent = await Event.create({ ...event, category: event.categoryId, organizer: organizer._id })
   return JSON.parse(JSON.stringify(newEvent))
  } catch (error) {
    handleError(error)
  }
}

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase()

    console.log('updateEvent userId:', userId)
    // Try finding by clerkId first, if not found, try finding by _id
    let organizer = await User.findOne({ clerkId: userId })
    if (!organizer) {
      organizer = await User.findById(userId)
    }
    console.log('updateEvent organizer:', organizer)
    if (!organizer) throw new Error('Organizer not found')

    const eventToUpdate = await Event.findById(event._id)
    if (!eventToUpdate) {
      throw new Error('Event not found')
    }

    // Check if the user is the organizer of the event
    if (eventToUpdate.organizer.toString() !== organizer._id.toString()) {
      throw new Error('Unauthorized: You are not the organizer of this event')
    }

    // Validate imageUrl
    if (event.imageUrl && !isValidImageUrl(event.imageUrl)) {
      throw new Error('Invalid image URL')
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: event.categoryId },
      { new: true }
    )
    revalidatePath(path)

    return JSON.parse(JSON.stringify(updatedEvent))
  } catch (error) {
    handleError(error)
  }
}


// DELETE
export async function deleteEvent({ userId, eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase()

    // Find the current user
    let organizer = await User.findOne({ clerkId: userId })
    if (!organizer) {
      organizer = await User.findById(userId)
    }
    if (!organizer) {
      throw new Error('Unauthorized: Could not verify user')
    }

    // Find the event
    const event = await Event.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    // Check if the user is the organizer of the event
    if (event.organizer.toString() !== organizer._id.toString()) {
      throw new Error('Unauthorized: You are not the organizer of this event')
    }

    // Delete the event
    const deletedEvent = await Event.findByIdAndDelete(eventId)
    if (deletedEvent) revalidatePath(path)
  } catch (error) {
    handleError(error)
  }
}

// GET ALL EVENTS
export async function getAllEvents({ query, limit = 6, page, category }: GetAllEventsParams) {
  try {
    await connectToDatabase()

    const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
    const categoryCondition = category ? await getCategoryByName(category) : null
    const conditions = {
      $and: [titleCondition, categoryCondition ? { category: categoryCondition._id } : {}],
    }

    const skipAmount = (Number(page) - 1) * limit
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    }
  } catch (error) {
    handleError(error)
  }
}

// GET EVENTS BY ORGANIZER
export async function getEventsByUser({ userId, limit = 6, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase()

    console.log('getEventsByUser userId:', userId)
    // Try finding by clerkId first, if not found, try finding by _id
    let organizer = await User.findOne({ clerkId: userId })
    if (!organizer) {
      organizer = await User.findById(userId)
    }
    console.log('getEventsByUser organizer:', organizer)
    if (!organizer) throw new Error('Organizer not found')

    const conditions = { organizer: organizer._id }
    const skipAmount = (Number(page) - 1) * limit

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return { data: JSON.parse(JSON.stringify(events)), totalPages: Math.ceil(eventsCount / limit) }
  } catch (error) {
    handleError(error)
  }
}

// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit
    const conditions = { $and: [{ category: categoryId }, { _id: { $ne: eventId } }] }

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return { data: JSON.parse(JSON.stringify(events)), totalPages: Math.ceil(eventsCount / limit) }
  } catch (error) {
    handleError(error)
  }
}
