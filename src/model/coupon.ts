import { Schema, model } from "mongoose"
import { IUser } from "./user"

export interface ICoupon {
  active: boolean
  count: number
  code: string
  users: IUser[]
}

const couponSchema = new Schema<ICoupon>({
  count: {
    type: Number,
    required: true,
    default: 0
  },
  active: {
    type: Boolean,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  users: {
    type: [],
    default: []
  }
})

export default model<ICoupon>('coupon', couponSchema)