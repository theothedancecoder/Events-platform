import { connectToDatabase } from '@/lib/mongodb/database';
import Order from '@/lib/mongodb/database/models/order.model';
import User from '@/lib/mongodb/database/models/user.model';
import Event from '@/lib/mongodb/database/models/event.model';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    // Get database state
    const usersCount = await User.countDocuments();
    const eventsCount = await Event.countDocuments();
    const ordersCount = await Order.countDocuments();

    console.log('Database counts:', {
      users: usersCount,
      events: eventsCount,
      orders: ordersCount
    });

    // Get a sample of each collection
    const users = await User.find().limit(1);
    const events = await Event.find().limit(1);
    const orders = await Order.find().limit(1);

    // Get all orders with basic info
    const allOrders = await Order.find()
      .select('stripeId totalAmount createdAt')
      .populate('buyer', 'firstName lastName clerkId')
      .populate('event', 'title');

    console.log('All orders:', allOrders);

    return NextResponse.json({
      success: true,
      counts: {
        users: usersCount,
        events: eventsCount,
        orders: ordersCount
      },
      samples: {
        user: users[0] ? {
          _id: users[0]._id,
          clerkId: users[0].clerkId,
          name: `${users[0].firstName} ${users[0].lastName}`
        } : null,
        event: events[0] ? {
          _id: events[0]._id,
          title: events[0].title
        } : null,
        order: orders[0] ? {
          _id: orders[0]._id,
          stripeId: orders[0].stripeId,
          totalAmount: orders[0].totalAmount
        } : null
      },
      allOrders: allOrders.map(order => ({
        _id: order._id,
        stripeId: order.stripeId,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        buyer: order.buyer ? {
          _id: order.buyer._id,
          clerkId: order.buyer.clerkId,
          name: `${order.buyer.firstName} ${order.buyer.lastName}`
        } : null,
        event: order.event ? {
          _id: order.event._id,
          title: order.event.title
        } : null
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch database state' 
    }, { 
      status: 500 
    });
  }
}
