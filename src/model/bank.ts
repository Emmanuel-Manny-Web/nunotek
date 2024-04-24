import { Schema, model } from "mongoose"

interface IBank {
  name: string
  accountname: string
  bankname: string
  accountnumber: string
  code: string
}

const bankSchema = new Schema<IBank>({
  name: {
    type: String,
    required: true,
    default: "admin"
  },
  accountname: {
    type: String,
    required: true
  },
  bankname: {
    type: String,
    required: true
  },
  accountnumber: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  }
})

export default model<IBank>('bank', bankSchema)