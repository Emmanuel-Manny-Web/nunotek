import { Schema, model } from "mongoose"

export interface ICustomer {
  customer_code: string
  email: string
  dedicated_id: number
}

const customerSchema = new Schema<ICustomer>({
  customer_code: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  dedicated_id: {
    type: Number
  }
})

export default model<ICustomer>('customer', customerSchema)