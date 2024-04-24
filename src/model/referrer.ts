import { Schema, model } from "mongoose"
import { IUser } from "./user"

export interface IReferrer {
  email: string
  referrals: number
  users: IUser[]
  parent: string
  grandparent: string
  greatgrandparent: string
  grandchildren: IUser[]
  greatgrandchildren: IUser[]
}

const referrerSchema = new Schema<IReferrer>({
  email: {
    type: String,
    required: true
  },
  referrals: {
    type: Number,
    required: true,
    default: 0
  },
  users: {
    type: [],
    default: []
  },
  parent: {
    type: String
  },
  grandparent: {
    type: String
  },
  greatgrandparent: {
    type: String
  },
  grandchildren: {
    type: [],
    default: []
  },
  greatgrandchildren: {
    type: [],
    default: []
  }
}, { timestamps: true })

export default model<IReferrer>('referrer', referrerSchema)