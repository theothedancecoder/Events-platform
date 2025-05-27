import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb/database'
import Order from '@/lib/mongodb/database/models/order.model'
import Event from '@/lib/mongodb/database/models/event.model'
import User from '@/lib/mongodb/database/models/user.model'

export async function GET() {
  try {
    await connectToDatabase()

    // Get all orders with populated data
    const orders = await Order.find()
      .populate('event')
      .populate('buyer')
      .lean()

    // Get all events
    const events = await Event.find().lean()

    // Get all users
    const users = await User.find().lean()

    return NextResponse.json({
      success: true,
      data: {
        orders,
        events,
        users,
        counts: {
          orders: orders.length,
          events: events.length,
          users: users.length
        }
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch debug data'
    })
  }
}
