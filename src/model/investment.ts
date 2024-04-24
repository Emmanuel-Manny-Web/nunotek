import { Schema, model } from "mongoose"

export interface UInvestment {
  user: string
  product: string
  start: Date
  end: Date
  deposit: number
  dailyIncome: number
  totalIncome: number
  period: number
  time: string
  active: boolean
  count: number
  createdAt: Date
  updatedAt: Date
}

const investmentSchema = new Schema<UInvestment>({
  user: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  deposit: {
    type: Number,
    required: true
  },
  dailyIncome: {
    type: Number,
    required: true
  },
  totalIncome: {
    type: Number,
    required: true
  },
  period: {
    type: Number,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  count: {
    type: Number,
    rrequired: true,
    default: 0
  }
}, { timestamps: true })

export default model<UInvestment>('investment', investmentSchema)