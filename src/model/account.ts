import { Schema, model } from "mongoose"

export interface IAccount {
  email: string
  accountname: string
  accountnumber: string
  bankname: string
  code: string
}

const accountSchema = new Schema<IAccount>({
  email: {
    type: String,
    required: true,
  },
  accountname: {
    type: String,
    required: true,
    lowercase: true
  },
  accountnumber: {
    type: String,
    required: true
  },
  bankname: {
    type: String,
    required: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true
  }
}, { timestamps: true })

export default model<IAccount>('account', accountSchema)