import { Request, Response } from "express"
import Users, { IUser } from "../model/user"
import Account, { IAccount } from "../model/account"
import Wallet, { IWallet } from "../model/wallet"
import Investment from "../model/investment"
import Notification from "../model/notification"
import Deposits from "../model/deposit"
import Withdrawals, { IWithdraw } from "../model/withdraw"
import AdminUser, { IAdmin } from "../model/admin"
import * as jwt from "jsonwebtoken"
import { BankType } from "../exports/exports"
import Bank from "../model/bank"
import Coupon from "../model/coupon"
import { genSaltSync, hashSync } from "bcryptjs"


const Flutterwave = require("flutterwave-node-v3")
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY!, process.env.FLW_SECRET_KEY!)

const joinDate = (date: Date) => {
  var joined = date.toDateString()
  var now = new Date().toDateString()
  return joined === now ?  true : false
}

const today = (date: Date) => {
  var today = date.toDateString()
  var now = new Date().toDateString()
  return today === now ? true : false
}

const month = (date: Date) => {
  var month = date.getMonth() + " " + date.getFullYear()
  var currentMonth = new Date().getMonth() + " " + new Date().getFullYear()
  return currentMonth === month ? true : false
}

const createToken = (id: string) => {
  return jwt.sign({ id }, process.env.ADMIN_SECRET_KEY!, {
    expiresIn: "2d"
  })
}
const createAccessToken = (id: string) => {
  return jwt.sign({ id }, process.env.SECRET_ACCESS_TOKEN!, {
    expiresIn: '7d'
  })
}

const generateCoupon = (): string => {
  const text = "ABCDEFGHIJKLMNOPQESTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"
  var coupon: string = ""
  for (let i = 0; i < 6; i++) {
    coupon += text[Math.floor(Math.random() * 62)]
  }
  return coupon
}

const getBanks = async (): Promise<BankType[]> => {
  const res = await flw.Bank.country({ "country": "NG" })
  return res.data
}

export default class Admin {
  static async getAdminLogin(req: Request, res: Response) {
    res.render('admin/index', { title: "PayFlow Admin | Login" })
  }
  static async registerAdmin(req: Request, res: Response) {
    const { username, password } = req.body
    try {
      await AdminUser.register(username, password)
      res.status(200).json({ ok: true })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async loginAdmin(req: Request, res: Response) {
    const { username, password } = req.body
    try {
      const admin = await AdminUser.login(username, password) as IAdmin
      const token = createToken(admin._id)
      res.cookie('queped', token, {
        maxAge: 1000 * 60 * 60 * 24
      })
      res.status(200).json({ ok: true })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async logoutAdmin(req: Request, res: Response) {
    res.cookie('queped', '')
    res.redirect('/admin-panel')
  }
  static async getAdminDashboard(req: Request, res: Response) {
    const users = await Users.find()
    var joined = 0
    users.map(async (user) => {
      joined = joinDate(user.createdAt) ? joined += 1 : joined
    })
    const latestUsers = await Users.aggregate([
      {
        $lookup: {
          from: "wallets",
          localField: "email",
          foreignField: "email",
          as: "wallet"
        }
      }
    ]).sort({ createdAt: -1 }).limit(5)
    const wallets = await Wallet.find().select({ "amount": 1, "profit": 1 })
    var totalUserFund = 0
    var totalProfitFund = 0
    wallets.map((wallet) => {
      totalUserFund += wallet.amount
      totalProfitFund += wallet.profit
    })
    const totalInvestment = (await Investment.find()).length
    const activeInvestment = (await Investment.find({ active: true })).length
    const completeInvestment = (await Investment.find({ active: false })).length
    var todayInvest = 0; var todayInvestmentAmount = 0; var todayInvestmentEarning = 0; var monthInvestmentAmount = 0; var totalInvestmentAmount = 0; var todayDeposit = 0; var monthDeposit = 0; var totalDeposit = 0;
    (await Investment.find()).map((investment) => {
      todayInvest = today(investment.createdAt) ? todayInvest += 1 : todayInvest
      todayInvestmentAmount = today(investment.createdAt) ? todayInvestmentAmount += investment.deposit : todayInvestmentAmount
      todayInvestmentEarning = today(investment.updatedAt) && investment.count > 0 ? todayInvestmentEarning += investment.dailyIncome : todayInvestmentEarning
      monthInvestmentAmount = month(investment.createdAt) ? monthInvestmentAmount += investment.deposit : monthInvestmentAmount
      totalInvestmentAmount += investment.deposit
    });
    (await Deposits.find({ status: "Approved" })).map((deposit) => {
      todayDeposit = today(deposit.createdAt) ? todayDeposit += deposit.amount : todayDeposit
      monthDeposit = month(deposit.createdAt) ? monthDeposit += deposit.amount : monthDeposit
      totalDeposit += deposit.amount
    });
    const pendingRequest = (await Deposits.find({ status: "Pending" })).length + (await Withdrawals.aggregate([
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$status", "Pending"] },
              { $eq: ["$status", "Approved"] }
            ]
          }
        }
      }
    ])).length;
    var todayPayout = 0; var monthPayout = 0; var monthCharge = 0; var totalPayout = 0;
    (await Withdrawals.find({ status: "Paid" })).map((withdrawal) => {
      todayPayout = today(withdrawal.createdAt) ? todayPayout += withdrawal.amount : todayPayout
      monthPayout = month(withdrawal.createdAt) ? monthPayout += withdrawal.amount : monthPayout
      monthCharge = month(withdrawal.createdAt) ? monthCharge += withdrawal.charge : monthCharge
      totalPayout += withdrawal.amount
    })

    res.render('admin/admindashboard', { title: 'Payflow Admin | Dashboard', users: users.length, joined, latestUsers, totalUserFund, totalProfitFund, totalInvestment, activeInvestment, completeInvestment, todayInvest,todayInvestmentAmount, todayInvestmentEarning, monthInvestmentAmount, totalInvestmentAmount, todayDeposit, monthDeposit, totalDeposit, pendingRequest, todayPayout, monthPayout, totalPayout, monthCharge })
  }
  static async getDepositBank(req: Request, res: Response) {
    const banks = await getBanks()
    banks.sort((a, b) => {
      const nameA = a.name.toUpperCase()
      const nameB = b.name.toUpperCase()
      if(nameA < nameB) {
        return -1
      } else if(nameA > nameB) {
        return 1
      }
      return 0
    })
    const account = await Bank.findOne({ name: "admin" })
    res.render("admin/bank", { title: "PayFlow Admin | Bank", banks, account })
  }
  static async getBankAccountName(req: Request, res: Response) {
    const { account_bank, account_number } = req.body
    try {
      const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
        method: "post",
        body: JSON.stringify({ account_bank, account_number }),
        headers: {
          'Authorization': `Bearer ${process.env.FLW_SECRET_KEY!}`,
          'Content-Type': 'application/json'
        }
      })
      const { data } = await response.json()
      res.status(200).json({ ok: true, data })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async addDepositBank(req: Request, res: Response) {
    const { bankcode, accountnumber, accountname } = req.body
    if(bankcode && accountnumber && accountname) {
      try {
        const banks = await getBanks()
        const bank = banks.filter((a) => a.code === bankcode).shift() as BankType
        const account = await Bank.findOne({ name: "admin" })
        account ? (await Bank.findOneAndUpdate({ name: "admin" }, { accountname, accountnumber, code: bankcode, bankname: bank.name })) : (await Bank.create({ accountname, accountnumber, code: bankcode, bankname: bank.name }))
        res.status(200).json({ ok: true, message: "Successfully added bank details." })
      } catch(err: any) {
        res.status(402).json({ ok: false, error: err.message })
      }
    } else {
      res.status(402).json({ ok: false, error: "Fill in all fields" })
    }
  }
  static async getAllInvestments(req: Request, res: Response) {
    const investments = await Investment.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "email",
          as: "user"
        }
      }
    ]).sort({ createdAt: -1 });
    res.render('admin/investment', { title: 'Payflow Admin | Investment List', investments })
  }
  static async getAllUsers(req: Request, res: Response) {
    const users = await Users.aggregate([
      {
        $lookup: {
          from: "wallets",
          localField: "email",
          foreignField: "email",
          as: "wallet"
        }
      },
      {
        $lookup: {
          from: "withdrawals",
          let: { email: "$email" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$status", "Paid"] },
                    { $eq: ["$email", "$$email"] }
                  ]
                }
              }
            }
          ],
          as: "withdrawal"
        }
      },
      {
        $unwind: '$wallet'
      }
    ]).sort({ createdAt: -1 })
    res.render('admin/users', { title: 'Payflow Admin | User List', users })
  }
  static async getAllDepositRequest(req: Request, res: Response) {
    const deposits = await Deposits.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$status", "Pending"] },
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      }
    ]).sort({ updatedAt: -1 })
    res.render('admin/userdeposit', { title: 'Payflow Admin | Deposit Request', deposits })
  }
  static async getAllDepositLog(req: Request, res: Response) {
    const deposits = await Deposits.aggregate([
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$status", "Approved"] },
              { $eq: ["$status", "Declined"] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      }
    ]).sort({ updatedAt: -1 })
    res.render('admin/depositlog', { title: 'Payflow Admin | Deposit Log', deposits })
  }
  static async approveDeposit(req: Request, res: Response) {
    const { narration, email, amount } = req.body
    try {
      await Deposits.findOneAndUpdate({ narration, status: "Pending" }, { status: "Approved" })
      await Wallet.findOneAndUpdate({ email }, {
        $inc: {
          amount
        }
      })
      res.status(200).json({ ok: true, message: `${email} deposit with ${narration} has been approved.` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async rejectDeposit(req: Request, res: Response) {
    const { narration, email, amount } = req.body
    try {
      await Deposits.findOneAndUpdate({ narration, status: "Pending" }, { status: "Declined" })
      res.status(200).json({ ok: true, message: `${email} deposit with ${narration} has been declined.` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async getAllWithdrawalRequest(req: Request, res: Response) {
    const withdrawals = await Withdrawals.aggregate([
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$status", "Pending"] },
              { $eq: ["$status", "Approved"] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "user"
        }
      },
      { $unwind: '$user' }
    ]).sort({ createdAt: -1 })
    withdrawals.map(async(withdrawal) => {
      if(withdrawal.withdrawalID) {
        const { data } = await flw.Transfer.get_a_transfer({ id: withdrawal.withdrawalID })
        console.log(data)
        if (data) {
          if(data.status === 'SUCCESSFUL') {
            await Withdrawals.findOneAndUpdate({ email: withdrawal.email, withdrawalID: withdrawal.withdrawalID }, { status: "Paid" }, { new: true })
          } else if(data.status === 'FAILED') {
            await Withdrawals.findOneAndUpdate({ email: withdrawal.email, withdrawalID: withdrawal.withdrawalID }, { status: "Declined" }, { new: true })
            await Wallet.findOneAndUpdate({ email: withdrawal.email }, {
              $inc: {
                profit: data.amount + withdrawal.charge
              }
            })
            await Notification.create({ email: withdrawal.email, message: `Refund for failed withdrawal`, amount: data.amount + withdrawal.charge })
          } 
        }
      }
    })
    res.render('admin/userwithdrawal', { title: 'Payflow Admin | Withdrawal Request', withdrawals })
  }
  static async payWithdrawal(req: Request, res: Response) {
    const { id } = req.body
    try {
      const withdrawal = await Withdrawals.findById(id) as IWithdraw
      const account = await Account.findOne({ email: withdrawal.email }) as IAccount
      const payload = {
        account_bank: account.code,
        account_number: account.accountnumber,
        amount: withdrawal.amount,
        currency: "NGN",
        narration: "HighFashion Withdrawal",
        reference: `TRF-${Date.now()}`
      }
      const response  = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: "post",
        body: JSON.stringify(payload),
        headers: {
          'Authorization': `Bearer ${process.env.FLW_SECRET_KEY!}`,
          'Content-Type': 'application/json'
        }
      })
      const { data } = await response.json()
      setTimeout(async () => {
        const { data: result } = await flw.Transfer.get_a_transfer({ id: JSON.stringify(data.id)})
        if(result.status === 'FAILED') {
          await Wallet.findOneAndUpdate({ email: withdrawal.email }, {
            $inc: {
              profit: withdrawal.amount + withdrawal.charge
            }
          })
          await Withdrawals.findByIdAndUpdate(id, { status: "Cancelled" })
          res.status(200).json({ ok: false, error: "Insufficients funds, unable to disburse" })
        } else if(result.status === 'SUCCESSFUL') {
          await Withdrawals.findByIdAndUpdate(id, { status: "Paid" })
          res.status(200).json({ ok: true, message: `${withdrawal.email} has been paid ₦ ${Number(withdrawal.amount).toLocaleString()} successfully` })
        } else {
          res.status(200).json({ ok: true, message: `${withdrawal.email} withdrawal of ₦ ${Number(withdrawal.amount).toLocaleString()} is pending.` })
        }
      }, 5000)
    } catch(error: any) {
      res.status(402).json({ ok: false, error: error.message })
    }
  }
  static async approveWithdrawal(req: Request, res: Response) {
    const { id } = req.body
    try {
      const withdrawal = await Withdrawals.findByIdAndUpdate(id, { status: "Approved" })
      res.status(200).json({ ok: true, message: `${withdrawal!.email} withdrawal of ₦ ${Number(withdrawal!.amount).toLocaleString()} has been approved` })
    } catch(error: any) {
      res.status(402).json({ ok: false, error: error.message })
    }
  }
  static async rejectWithdrawal(req: Request, res: Response) {
    const { id } = req.body
    try {
      const withdrawal = await Withdrawals.findByIdAndUpdate(id, { status: "Declined" }) as IWithdraw
      await Wallet.findOneAndUpdate({ email: withdrawal.email }, {
        $inc: {
          profit: withdrawal.charge + withdrawal.amount
        }
      })
      res.status(200).json({ ok: true, message: `${withdrawal!.email} withdrawal of ₦ ${Number(withdrawal!.amount).toLocaleString()} has been declined` })
    } catch(error: any) {
      res.status(402).json({ ok: false, error: error.message })
    }
  }
  static async getAllWithdrawalLog(req: Request, res: Response) {
    const withdrawals = await Withdrawals.aggregate([
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$status", "Paid"] },
              { $eq: ["$status", "Cancelled"] },
              { $eq: ["$status", "Declined"] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "user"
        }
      },
      {
        $unwind: '$user'
      }
    ]).sort({ createdAt: -1})
    res.render('admin/payoutlog', { title: 'Payflow Admin | Withdrawal Log', withdrawals })
  }
  static async getUserWithdrawalAmount(req: Request, res: Response) {
    const { email } = req.body
    var amountWithdrawn = 0;
    (await Withdrawals.find({ email, status: "Paid" })).map((withdrawal) => amountWithdrawn += withdrawal.amount)
    res.status(200).json({ ok: true, amountWithdrawn, email })
  }
  static async suspendWithdrawal(req: Request, res: Response) {
    const { email } = req.body
    try {
      await Users.findOneAndUpdate({ email }, { suspend: true })
      res.status(200).json({ ok: true, message: `${email} has been suspended` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async activateWithdrawal(req: Request, res: Response) {
    const { email } = req.body
    try {
      await Users.findOneAndUpdate({ email }, { suspend: false })
      res.status(200).json({ ok: true, message: `${email} has been activated` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async banUser(req: Request, res: Response) {
    const { email } = req.body
    try {
      await Users.findOneAndUpdate({ email }, { ban: true }, { new: true })
      await Deposits.findOneAndUpdate({ email, status: "Pending" }, { status: "Declined" })
      res.status(200).json({ ok: true, message: `${email} has been successfully banned` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async removeBan(req: Request, res: Response) {
    const { email } = req.body
    try {
      await Users.findOneAndUpdate({ email }, { ban: false }, { new: true })
      res.status(200).json({ ok: true, message: `${email} ban has been removed` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async addUserBalance(req: Request, res: Response) {
    const { email, amount } = req.body
    try {
      await Users.findOneAndUpdate({ email }, {
        $inc: {
          profit: amount
        }
      })
      res.status(200).json({ ok: true })
    } catch(err: any) {
      res.status(402).json({ ok: false })
    }
  }
  static async approve(req: Request, res: Response) {
    const { email, amount } = req.body
    try {
      await Deposits.findOneAndUpdate({ email }, { status: "Approved" })
      await Wallet.findOneAndUpdate({ email }, {
        $inc: {
          amount
        }
      })
      res.status(200).json({ ok: true, message: `${email} deposit has been approved.` })
    } catch(err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async loginUser(req: Request, res: Response) {
    const { email } = req.body
    try {
      const user = await Users.findOne({ email })
      if (user) {
        const token = createAccessToken(user._id)
        res.cookie('pid', token, {
          maxAge: 60 *60 *24 *1000
        })
        res.status(200).json({ ok: true, message: "Logged in successfully" })
      } else res.status(200).json({ ok: false })
    } catch(err: any) {
      res.status(201).json({ ok: false, error: err.message })
    }
  }
  static async getUserProfile(req: Request, res: Response) {
    const { id } = req.params
    const user = await Users.findById(id)
    const wallet = await Wallet.findOne({ email: user?.email })
    res.render('admin/userprofile', { title: "Admin | User Profile", user, wallet })
  }
  static async alterBalance(req: Request, res: Response) {
    const { method, amount, wallet } = req.body
    const { id } = req.params
    const user = await Users.findById(id) as IUser
    if (method === "add" && amount && wallet) {
      wallet === "main_balance" ? await Wallet.findOneAndUpdate({ email: user.email }, { $inc: { amount: amount } }) : await Wallet.findOneAndUpdate({ email: user.email }, { $inc: { profit: amount } })
      res.status(200).json({ ok: true, message: "Successfully updated user wallet" })
    } else if (method === "subtract" && amount && wallet) {
      wallet === "main_balance" ? await Wallet.findOneAndUpdate({ email: user.email }, { $inc: { amount: -amount } }) : await Wallet.findOneAndUpdate({ email: user.email }, { $inc: { profit: -amount } })
      res.status(200).json({ ok: true, message: "Successfully updated user wallet" })
    } else {
      res.status(200).json({ ok: false, error: "Error processing request" })
    }
  }
  static async changeUserPassword(req: Request, res: Response) {
    const { email, password } = req.body
    try {
      const salt = genSaltSync(10)
      const hash = hashSync(password, salt)
      await Users.findOneAndUpdate({ email }, { password: hash })
      res.status(200).json({ ok: true, message: "Password changed successfully" })
    } catch (err: any) {
      res.status(200).json({ ok: false, error: "Error processing request" })
    }
  }
  static async getCoupon(req: Request, res: Response) {
    const coupon = await Coupon.findOne({ active: true })
    try {
      res.render("admin/admincoupon", { title: "Admin | Coupon", coupon })
    } catch (err: any) {
      console.log(err.message)
      res.status(200).json({ ok: false, error: err.message })
    }
  }
  static async activateCoupon(req: Request, res: Response) {
    const code = generateCoupon()
    try {
      const coupon = await Coupon.findOne({ active: true })
      if (!coupon) {
        await Coupon.create({ active: true, code })
        res.status(200).json({ ok: true, message: "Coupon created successfully" })
      } else res.status(200).json({ ok: false, error: "There is currently an active coupon" })
    } catch (err: any) {
      res.status(200).json({ ok: false, error: err.message })
    }
  }
  static async deactivateCoupon(req: Request, res: Response) {
    const coupon = await Coupon.findOne({ active: true })
    if (coupon) {
      await Coupon.findOneAndUpdate({ active: true }, { active: false })
      res.status(200).json({ ok: true, message: "Coupon successfully deactivated" })
    } else res.status(200).json({ ok: false, error: "There is no active coupon" })
  }
}