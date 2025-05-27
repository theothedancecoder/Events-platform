"use server"

import Stripe from 'stripe';
import { CheckoutOrderParams, CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams } from "@/types"
import { redirect } from 'next/navigation';
import { handleError } from '../utils';
import {ObjectId} from 'mongodb';
import { connectToDatabase } from '../mongodb/database';
import Order from '../mongodb/database/models/order.model';
import User from '../mongodb/database/models/user.model';
import Event from '../mongodb/database/models/event.model';

export const checkoutOrder = async (order: CheckoutOrderParams) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const price = order.isFree ? 0 : Number(order.price) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: price,
            product_data: {
              name: order.eventTitle
            }
          },
          quantity: 1
        },
      ],
      metadata: {
        eventId: order.eventId,
        buyerId: order.buyerId,
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    });

    redirect(session.url!)
  } catch (error) {
    throw error;
  }
}

export const createOrder = async (order: CreateOrderParams) => {
  try {
    await connectToDatabase();
    
    // Find the user by Clerk ID
    const buyer = await User.findOne({ clerkId: order.buyerId });
    if (!buyer) {
      throw new Error('User not found');
    }

    const eventObjectId = new ObjectId(order.eventId);
    
    const newOrder = await Order.create({
      stripeId: order.stripeId,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      event: eventObjectId,
      buyer: buyer._id,
    });

    console.log('Order created:', {
      id: newOrder._id,
      event: newOrder.event,
      buyer: newOrder.buyer,
      amount: newOrder.totalAmount
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    console.error('Error creating order:', error);
    handleError(error);
  }
}

// GET ORDERS BY EVENT
export async function getOrdersByEvent({ searchString, eventId }: GetOrdersByEventParams) {
  try {
    await connectToDatabase()

    if (!eventId) {
      console.log('No eventId provided');
      return [];
    }

    if (!ObjectId.isValid(eventId)) {
      console.error('Invalid event ID format:', eventId);
      return [];
    }

    const eventObjectId = new ObjectId(eventId);
    
    // First check if the event exists
    const event = await Event.findById(eventObjectId);
    if (!event) {
      console.log('Event not found:', eventId);
      return [];
    }

    // Find orders with populated references
    const orders = await Order.aggregate([
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
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventInfo'
        }
      },
      {
        $unwind: {
          path: '$buyerInfo',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $unwind: {
          path: '$eventInfo',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $addFields: {
          buyerName: {
            $concat: ['$buyerInfo.firstName', ' ', '$buyerInfo.lastName']
          }
        }
      },
      {
        $match: {
          $or: [
            { buyerName: { $regex: searchString || '', $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          createdAt: 1,
          eventTitle: '$eventInfo.title',
          eventId: '$eventInfo._id',
          buyer: '$buyerName'
        }
      }
    ]).exec();

    console.log('Orders found:', orders.length);
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    handleError(error);
    return [];
  }
}

// GET ORDERS BY USER
export async function getOrdersByUser({ userId, limit = 3, page }: GetOrdersByUserParams) {
  try {
    await connectToDatabase()

    // Find the user by Clerk ID
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const skipAmount = (Number(page) - 1) * limit
    const conditions = { buyer: user._id }

    const ordersQuery = Order.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: 'event',
        model: Event,
        populate: {
          path: 'organizer',
          model: User,
          select: '_id firstName lastName',
        },
      })

    const ordersCount = await Order.countDocuments(conditions)

    const orders = await ordersQuery

    return { data: JSON.parse(JSON.stringify(orders)), totalPages: Math.ceil(ordersCount / limit) }
  } catch (error) {
    handleError(error)
  }
}
