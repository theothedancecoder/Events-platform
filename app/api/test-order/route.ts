import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/actions/order.actions'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb/database'
import Order from '@/lib/mongodb/database/models/order.model'
import Event from '@/lib/mongodb/database/models/event.model'

export async function GET() {
  try {
    await connectToDatabase()

    // First, verify the event exists
    const eventId = '68338aea23a9bac4c8f24139' // The event ID from the logs
    const event = await Event.findById(eventId)

    if (!event) {
      return NextResponse.json({
        success: false,
        message: 'Event not found',
        eventId
      })
    }

    // Get all existing orders
    const existingOrders = await Order.find({ event: new ObjectId(eventId) }).lean()

    // Create a test order
    const testOrder = {
      stripeId: `test_${Date.now()}`,
      eventId,
      buyerId: event.organizer.toString(), // Using organizer as buyer for test
      totalAmount: '100',
      createdAt: new Date()
    }

    const newOrder = await createOrder(testOrder)

    return NextResponse.json({
      success: true,
      message: 'Test completed',
      event: {
        id: event._id,
        title: event.title
      },
      existingOrders: existingOrders.map(order => ({
        id: order._id,
        event: order.event,
        buyer: order.buyer,
        amount: order.totalAmount
      })),
      newOrder
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
