import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb/database'
import Event from '@/lib/mongodb/database/models/event.model'
import Order from '@/lib/mongodb/database/models/order.model'
import User from '@/lib/mongodb/database/models/user.model'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    
    const eventId = '68338aea23a9bac4c8f24139'
    const eventObjectId = new ObjectId(eventId)

    // 1. Check Event
    const event = await Event.findById(eventObjectId)
    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found',
        eventId
      })
    }

    // 2. Get Raw Orders
    const rawOrders = await Order.find({ event: eventObjectId }).lean()

    // 3. Get User Info
    const userIds = rawOrders.map(order => order.buyer)
    const users = await User.find({ _id: { $in: userIds } }).lean()

    // 4. Try the aggregation pipeline
    const aggregatedOrders = await Order.aggregate([
      {
        $match: {
          event: eventObjectId
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyerInfo'
        }
      },
      {
        $unwind: '$buyerInfo'
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventInfo'
        }
      },
      {
        $unwind: '$eventInfo'
      }
    ])

    return NextResponse.json({
      success: true,
      event: {
        id: event._id,
        title: event.title
      },
      rawOrders: rawOrders.map(order => ({
        id: order._id,
        event: order.event,
        buyer: order.buyer,
        amount: order.totalAmount
      })),
      users: users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`
      })),
      aggregatedOrders: aggregatedOrders.map(order => ({
        id: order._id,
        event: order.eventInfo.title,
        buyer: `${order.buyerInfo.firstName} ${order.buyerInfo.lastName}`,
        amount: order.totalAmount
      }))
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
