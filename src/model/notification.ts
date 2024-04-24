import { Schema, model } from "mongoose"

interface INotification {
  email: string
  message: string
  amount: number
  createdAt: number
}

const notificationSchema = new Schema<INotification>({
  email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { timestamps: true })

export default model<INotification>('notification', notificationSchema)