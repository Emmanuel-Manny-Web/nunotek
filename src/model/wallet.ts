import { Schema, model } from 'mongoose'
import isEmail from 'validator/lib/isEmail'

export interface IWallet {
  amount: number,
  userid: string,
  email: string
  profit: number
}

const walletSchema = new Schema<IWallet>({
  amount: {
    type: Number,
    required: true
  },
  userid: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    validate: [isEmail, 'Provide a proper email']
  },
  profit: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true })

const wallet = model<IWallet>('wallet', walletSchema)

export default wallet