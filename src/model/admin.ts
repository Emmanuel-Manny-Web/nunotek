import { Schema, model, Model } from "mongoose"
import { compareSync, hashSync, genSaltSync } from "bcryptjs"

export interface IAdmin {
  username: string
  password: string
  _id: string
}

interface IAdminModel extends Model<IAdmin> {
  login(username: string, password: string): Promise<IAdmin>
  register(username: string, password: string): Promise<IAdmin>
}

const adminSchema = new Schema<IAdmin, IAdminModel>({
  username: {
    type: String,
    required: true,
    lowercase: true,
    minlength: 5
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, { timestamps: true })

adminSchema.statics.register = async function(username: string, password: string) {
  const admin = await this.findOne({ username })
  const length = (await this.find()).length
  if(!admin && length < 2) {
    const salt = genSaltSync(10)
    const authPass = hashSync(password, salt)
    return this.create({ username, password: authPass })
  } throw new Error("Username exists!")
}

adminSchema.statics.login = async function(username: string, password: string) {
  const admin = await this.findOne({ username })
  if(admin) {
    const auth = compareSync(password, admin.password)
    if(auth) return admin
    else throw new Error("Invalid password credentials")
  } else throw new Error("Invalid login credentials")
}

export default model<IAdmin, IAdminModel>('admin', adminSchema)