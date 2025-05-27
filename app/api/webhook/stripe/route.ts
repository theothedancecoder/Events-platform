import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/actions/order.actions'
import { ObjectId } from 'mongodb'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Log environment variables (without exposing secrets)
console.log('Environment check:', {
  hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
  hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  nodeEnv: process.env.NODE_ENV
});

// Add OPTIONS method to handle preflight requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}

export async function POST(request: Request) {
  console.log('Webhook endpoint hit:', request.method);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  const body = await request.text()
  console.log('Webhook raw body:', body);

  const sig = request.headers.get('stripe-signature') as string
  console.log('Stripe signature:', sig);

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  console.log('Using webhook secret:', endpointSecret ? 'Present' : 'Missing');

  let event

  try {
    console.log('Attempting to construct webhook event...');
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log('Event constructed successfully:', {
      type: event.type,
      id: event.id,
      apiVersion: event.api_version
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    console.error('Verification details:', {
      sigLength: sig?.length,
      bodyPreview: body.substring(0, 100) + '...',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
    return NextResponse.json({ message: 'Webhook error', error: err }, { status: 400 })
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

      // Validate eventId is a valid ObjectId (buyerId is a Clerk ID)
      if (!ObjectId.isValid(metadata.eventId)) {
        throw new Error('Invalid eventId format')
      }

      console.log('Webhook received checkout.session.completed:', {
        sessionId: id,
        amount: amount_total,
        eventId: metadata.eventId,
        buyerId: metadata.buyerId
      });

      const orderData = {
        stripeId: id,
        eventId: metadata.eventId,
        buyerId: metadata.buyerId, // This is the Clerk ID
        totalAmount: amount_total ? (amount_total / 100).toString() : '0',
        createdAt: new Date(),
      }

      try {
        console.log('Attempting to create order with data:', {
          stripeId: orderData.stripeId,
          eventId: orderData.eventId,
          buyerId: orderData.buyerId,
          amount: orderData.totalAmount
        });

        const newOrder = await createOrder(orderData);
        
        if (!newOrder) {
          console.error('Order creation returned null/undefined');
          throw new Error('Failed to create order - no order returned');
        }

        console.log('Order created successfully:', {
          orderId: newOrder._id,
          stripeId: newOrder.stripeId,
          buyerId: orderData.buyerId,
          eventId: orderData.eventId
        });

        return NextResponse.json({ 
          message: 'Order created successfully', 
          order: {
            _id: newOrder._id,
            stripeId: newOrder.stripeId,
            eventId: orderData.eventId,
            buyerId: orderData.buyerId
          }
        });
      } catch (createError) {
        console.error('Error creating order:', {
          error: createError instanceof Error ? createError.message : 'Unknown error',
          stack: createError instanceof Error ? createError.stack : undefined,
          orderData: {
            stripeId: orderData.stripeId,
            eventId: orderData.eventId,
            buyerId: orderData.buyerId
          }
        });

        return NextResponse.json(
          { 
            message: 'Error creating order', 
            error: createError instanceof Error ? createError.message : 'Unknown error',
            details: {
              stripeSessionId: id,
              eventId: metadata.eventId,
              buyerId: metadata.buyerId
            }
          },
          { status: 500 }
        );
      }
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
