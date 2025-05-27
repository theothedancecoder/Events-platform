import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/actions/order.actions'
import { ObjectId } from 'mongodb'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ message: 'Webhook error', error: err })
  }

  // Get the ID and type
  const eventType = event.type

  try {
    // CREATE
    if (eventType === 'checkout.session.completed') {
      const { id, amount_total, metadata } = event.data.object as Stripe.Checkout.Session

      // Validate required metadata
      if (!metadata?.eventId || !metadata?.buyerId) {
        throw new Error('Missing required metadata: eventId or buyerId')
      }

      // Validate ObjectIds
      if (!ObjectId.isValid(metadata.eventId) || !ObjectId.isValid(metadata.buyerId)) {
        throw new Error('Invalid eventId or buyerId format')
      }

      const order = {
        stripeId: id,
        eventId: metadata.eventId,
        buyerId: metadata.buyerId,
        totalAmount: amount_total ? (amount_total / 100).toString() : '0',
        createdAt: new Date(),
      }

      console.log('Creating order with data:', order)

      const newOrder = await createOrder(order)
      console.log('Order created successfully:', newOrder)

      return NextResponse.json({ message: 'OK', order: newOrder })
    }

    return NextResponse.json({ message: 'Event processed', type: eventType })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { message: 'Error processing webhook', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
