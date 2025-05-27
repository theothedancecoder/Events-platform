import { Schema, model, models, Document } from 'mongoose'

export interface IOrder extends Document {
  createdAt: Date
  stripeId: string
  totalAmount: string
  event: Schema.Types.ObjectId
  buyer: Schema.Types.ObjectId
}

export type IOrderItem = {
  _id: string
  totalAmount: string
  createdAt: Date
  eventTitle: string
  eventId: string
  buyer: string
}

const OrderSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  stripeId: {
    type: String,
    required: true,
    unique: true,
  },
  totalAmount: {
    type: String,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
})

// Add indexes for faster lookups
OrderSchema.index({ event: 1 })
OrderSchema.index({ buyer: 1 })
// Removed duplicate stripeId index since it's already defined in the schema

const Order = models.Order || model('Order', OrderSchema)

export default Order
