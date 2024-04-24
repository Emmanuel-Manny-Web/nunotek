import { Request, Response } from "express"
import * as jwt from "jsonwebtoken"
import User, { IUser } from "../model/user"
import Deposit, { IDeposit } from "../model/deposit"
import Notification from "../model/notification"
import Investments, { UInvestment } from "../model/investment"
import Wallet from "../model/wallet"
import Coupon, { ICoupon } from "../model/coupon"
import Referrer, { IReferrer } from "../model/referrer"

export const CheckToken = async (req: Request, res: Response, next: Function) => {
  const token = req.cookies.pid
  if(token) {
    const auth = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN as string)
    if(!auth) next()
    else res.redirect('/dashboard')
  } else next()
}

function addHours(date: Date, hours: number) {
  date.setHours(date.getHours() + hours);
  return date;
}

const getEndDate = (start: Date, runtime: number) => {
  return new Date(start.setDate(start.getDate() + runtime))
}

const investmentDate = (runtime: number) => {
  var date = new Date()
  const end = getEndDate(date, runtime)
  const start = new Date()
  const time = end.toString()
  const period = end.getTime()
  return { start, end, time, period }
}

export const DownLineCheck = async function (req: Request, res: Response, next: Function) {
  const user = res.locals.user
  const referrer = await Referrer.findOne({ email: user.email }) as IReferrer
  const investment = await Investments.findOne({ user: user.email, deposit: { $gte: 50000 }, active: true }) as UInvestment
  const array: UInvestment[] = []
  var num = 0
  if (referrer.referrals < 50 && referrer.users.length < 50 && !investment) {
    next()
  } else {
    referrer.users.map(async (downliners) => {
      var active = await Investments.findOne({ user: downliners.email, active: true })
      while (active) {
        num += 1
        array.push(active)
        active = null
      }
    })
    setTimeout(async () => {
      if (num >= 50) {
        const existing = await Investments.findOne({ user: user.email, product: "Special Package", active: true })
        if (!existing) {
          const { end, start, time, period } = investmentDate(20)
          await Investments.create({ user: user.email, product: "Special Package", start, end, time, period, deposit: 0, dailyIncome: 1000, totalIncome: 20000 })
        }
        next()
      } else {
        next()
      }
    }, 5000)
  }
}

export const CouponCheck = async function (req: Request, res: Response, next: Function) {
  const coupon = await Coupon.findOne({ active: true }) as ICoupon
  if (coupon) {
    coupon.users.length >= 15 || coupon.count >= 15 ? await Coupon.findOneAndUpdate({ active: true }, { active: false }) && res.redirect('/account') : next()
  } else next()
}

export const AuthUser = async function (req: Request, res: Response, next: Function) {
  const token = req.cookies.pid
  if (!token) {
    res.redirect('/login')
  } else {
    const auth = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN!) as jwt.JwtPayload
    if (auth) {
      const user = await User.findById(auth.id) as IUser
      const wallet = await Wallet.findOne({ email: user.email })
      if (user && !user.ban) {
        const deposit = await Deposit.findOne({ email: user.email, status: "Pending" }) as IDeposit
        if (deposit) {
          if (!deposit.transactionID) {
            var now = new Date()
            var oneHourLater = addHours(new Date(deposit.createdAt), 1)
            if (now > oneHourLater) {
              await Deposit.findOneAndUpdate({ email: user.email, status: "Pending" }, { status: "Declined" })
            }
          } else {
            const res = await fetch(`https://api.flutterwave.com/v3/transactions/${deposit.transactionID}/verify`, {
              method: "get",
              headers: {
                Authorization: "Bearer " + process.env.BUDPAY_SECRET_KEY!
              }
            })
            const { data } = await res.json()
            console.log(data)
            if (data.status === 'successful') {
              await Deposit.findOneAndUpdate({ email: user.email, status: "Pending" }, { status: "Approved" })
              await Notification.create({ email: data.customer.email, amount: data.amount, message: `Approved deposit of ₦ ${Number(data.amount).toLocaleString() }` })
            } else if (data.status === 'failed') {
              await Deposit.findOneAndUpdate({ email: user.email, status: "Pending" }, { status: "Declined" })
            } else {
              var now = new Date()
              var tomorrow = new Date(deposit.createdAt.setDate(deposit.createdAt.getDate() + 1))
              if (now > tomorrow) {
                await Deposit.findOneAndUpdate({ email: user.email, status: "Pending" }, { status: "Declined" })
              }
            }
          }
        }
        const investments = await Investments.find({ user: user.email, active: true })
        if(investments.length > 0) {
          investments.forEach(async (investment) => {
            const { start, count, id, end } = investment
            const now = new Date()
            var tomorrow = new Date(start.setDate(start.getDate() + 1))
            var num = 0
            if(now > end) {
              await Investments.findByIdAndUpdate(id, { active: false })
            } else {
              while(now > tomorrow) {
                tomorrow = new Date(tomorrow.setDate(tomorrow.getDate() + 1))
                num += 1
              }
              if (new Date(start.setDate(start.getDate() + 15)) === end) {
                num = (num > count) && (count < 15) ? num - count : 0
              } else {
                num = (num > count) && (count < 20) ? num - count : 0
              }
              for(let i = 0; i < num; i++) {
                try {
                  await Wallet.findOneAndUpdate({ email: user.email }, {
                    $inc: {
                      profit: investment.dailyIncome
                    }
                  }, { new: true })
                  await Investments.findByIdAndUpdate(id, {
                    $inc: {
                      count: 1
                    }
                  }, { new: true })
                  await Notification.create({ email: user.email, amount: investment.dailyIncome, message: `Daily profit from ${investment.product.toUpperCase()} plan` })
                } catch(err: any) {
                  throw new Error(err.message)
                }
              }
            }
          })
        }
        res.locals.user = user
        res.locals.wallet = wallet
        next()
      }
      else {
        res.cookie("pid", "")
        res.redirect('/login')
      }
    } else {
      res.redirect('/login')
    }
  }
}