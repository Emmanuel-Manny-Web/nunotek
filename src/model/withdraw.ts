import { Schema, model } from "mongoose"

export interface IWithdraw {
  email: string
  amount: number
  charge: number
  status: "Pending"| "Paid" | "Declined" | "Approved" | "Cancelled"
  mode: string
  createdAt: Date
  withdrawalID: string
}

const withdrawSchema = new Schema<IWithdraw>({
  email: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  charge: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: "Pending"
  },
  mode: {
    type: String,
    required: true,
    default: "Naira Bank Transfer"
  },
  withdrawalID: {
    type: String
  }
}, { timestamps: true })

export default model<IWithdraw>('withdrawal', withdrawSchema)