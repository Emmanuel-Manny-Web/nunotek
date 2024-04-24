import { Model, Schema, model } from 'mongoose';
import { compareSync, hashSync, genSaltSync } from "bcryptjs"
import isEmail from 'validator/lib/isEmail';

export interface IUser {
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  phone: string
  referralcode?: string
  _id: string
  suspend: boolean
  createdAt: Date
  ban: boolean
}

interface IUserModel extends Model<IUser> {
  login(email: string, password: string): Promise<IUser>
  register(body: IUser): Promise<IUser>
}

export const generateReferralCode = (): string => {
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
  var code = ''
  for(let i = 0; i < 8; i++) {
    var num = Math.floor(Math.random() * 62)
    code += str[num]
  }
  return code
}

const userSchema = new Schema<IUser, IUserModel>({
  email: {
    type: String,
    required: [true, 'An email must be provided'],
    validate: [isEmail, 'Provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'A password must be provided'],
    minlength: [6, 'Password must be at least 6 chars long']
  },
  phone: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    required: [true, 'A first name must be provided'],
  },
  lastname: {
    type: String,
    required: [true, 'A lastname must be provided']
  },
  referralcode: {
    type: String
  },
  suspend: {
    type: Boolean,
    required: true,
    default: false
  },
  ban: {
    type: Boolean,
    required: true,
    default: false
  }
}, { timestamps: true })

userSchema.statics.login = async function(email: string, password: string) {
  const user = await this.findOne({ email })
  if(user) {
    if(!user.ban) {
      const auth = compareSync(password, user.password)
      if(auth) return user
      throw new Error("Invalid email or password")
    } else throw new Error("Account has been suspended!")
  } else throw new Error("User does not exist")
}

userSchema.statics.register = async function(body: IUser): Promise<IUser> {
  const { email, firstname, lastname, phone } = body
  const user = await this.findOne({ email })
  if(!user) {
    const salt = genSaltSync(10)
    var code = generateReferralCode()
    body.password = hashSync(body.password, salt)
    var referrer = await this.findOne({ referralcode: code })
    while(referrer) {
      code = generateReferralCode()
      referrer = await this.findOne({ referralcode: code })
    }
    const member = this.create({ email, firstname, lastname, password: body.password, referralcode: code, phone })
    return member
  }
  throw new Error("Email address already exists")
}

const user = model<IUser, IUserModel>('User', userSchema)

export default user