import { Schema, model } from "mongoose"

interface IDeposit {
  sender: string
  amount: number
  narration: string
  status: "Pending" | "Approved" | "Declined"
  email: string
  method: string
  createdAt: number
}

const depositSchema = new Schema<IDeposit>({
  sender: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  narration: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: "Pending"
  },
  email: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    default: "Bank Transfer"
  }
}, { timestamps: true })

export default model<IDeposit>('deposit', depositSchema)