import * as jwt from "jsonwebtoken"
import { Request, Response } from "express"
import Investments from "../model/investment"
import Notification from "../model/notification"
import Wallet from "../model/wallet"
import Admin, { IAdmin } from "../model/admin"

const AuthCheck = async (req: Request, res: Response, next: Function) => {
  const token = req.cookies.queped
  if(token) {
    const auth = jwt.verify(token, process.env.ADMIN_SECRET_KEY!) as jwt.JwtPayload
    if(auth) {
      // (await Investments.find()).map(async (investment) => {
      //   const { start, count, id, end } = investment
      //   const now = new Date()
      //   var tomorrow = new Date(start.setDate(start.getDate() + 1))
      //   var num = 0
      //   if(now > end) {
      //     await Investments.findByIdAndUpdate(id, { active: false })
      //   } else {
      //     while(now > tomorrow) {
      //       tomorrow = new Date(tomorrow.setDate(tomorrow.getDate() + 1))
      //       num += 1
      //     }
      //     num = (num > count) && (count < 20) ? num - count : 0
      //     for(let i = 0; i < num; i++) {
      //       try {
      //         await Wallet.findOneAndUpdate({ email: investment.user }, {
      //           $inc: {
      //             profit: investment.dailyIncome
      //           }
      //         }, { new: true })
      //         await Investments.findByIdAndUpdate(id, {
      //           $inc: {
      //             count: 1
      //           }
      //         }, { new: true })
      //         await Notification.create({ email: investment.user, amount: investment.dailyIncome, message: `Daily profit from ${investment.product.toUpperCase()} plan` })
      //       } catch(err: any) {
      //         throw new Error(err.message)
      //       }
      //     }
      //   }
      // })
      const admin = await Admin.findById(auth.id) as IAdmin
      res.locals.admin = admin
      next()
    } else res.redirect('/admin-panel')
  } else res.redirect('/admin-panel')
}

export const checkLoggedIn = (req: Request, res: Response, next: Function) => {
  const token = req.cookies.queped
  if(token) {
    const auth = jwt.verify(token, process.env.ADMIN_SECRET_KEY!)
    if(!auth) next()
    else res.redirect('/admin-panel/dashboard')
  } else next()
}

export const BankAdmin = (req: Request, res: Response, next: Function) => {
  const admin = res.locals.admin
  if(admin) {
    admin.username === 'emmanuel' ? next() : res.redirect('/admin-panel/dashboard')
  } else res.redirect('/admin-panel/dashboard')
}

export default AuthCheck