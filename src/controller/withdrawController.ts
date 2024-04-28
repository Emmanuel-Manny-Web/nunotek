import Withdraw, { IWithdraw } from "../model/withdraw"
import { Response, Request } from "express"
import Wallet, { IWallet } from "../model/wallet"
import user, { IUser } from "../model/user"
import Investment from "../model/investment"
import Account, { IAccount } from "../model/account"
import Notification from "../model/notification"


const Flutterwave = require('flutterwave-node-v3')
const flw = new Flutterwave(process.env.FLW_PAYOUT_PUBLIC_KEY!, process.env.FLW_PAYOUT_SECRET_KEY!)

export default class Handler {
  static async getUserWithdrawRecord(req: Request, res: Response) {
    const { email } = res.locals.user
    const wallet = await Wallet.findOne({ email }) as IWallet
    const withdrawal = await Withdraw.findOne({ email, status: "Pending" }) as IWithdraw
    if (withdrawal) {
      const amount = withdrawal.amount + withdrawal.charge
      if (withdrawal.withdrawalID) {
        const response = await fetch(`https://api.flutterwave.com/v3/transfers/${withdrawal.withdrawalID}`, {
          method: "get",
          headers: {
            Authorization: "Bearer " + process.env.FLW_PAYOUT_SECRET_KEY!
          }
        })
        const { data } = await response.json()
        if(data.status === "SUCCESSFUL") {
          await Withdraw.findOneAndUpdate({ email, status: "Pending" }, { status: "Paid" }, { new: true })
        }
        else if (data.status === 'FAILED') {
          await Withdraw.findOneAndUpdate({ email, status: "Pending" }, { status: "Declined" }, { new: true })
          await Wallet.findOneAndUpdate({ email: wallet.email }, {
            $inc: {
              profit: amount
            }
          })
          await Notification.create({ email, message: `Refund for failed withdrawal`, amount: data.amount + withdrawal.charge })
        }
      } else {
        await Withdraw.findOneAndUpdate({ email, status: "Pending" }, { status: "Declined" }, { new: true })
        await Wallet.findOneAndUpdate({ email: wallet.email }, {
          $inc: {
            profit: amount
          }
        })
        await Notification.create({ email, message: `Refund for failed withdrawal`, amount: withdrawal.amount + withdrawal.charge })
      }
    }
    const withdrawals = await Withdraw.find({ email }).sort({ createdAt: -1 })
    res.render("client/withdraw-history", { title: "Nunotek | Withdrawal Record", ok: true, withdrawals })
  }
  static async withdraw(req: Request, res: Response) {
    const wallet = res.locals.wallet as IWallet
    const users = res.locals.user as IUser
    const { amount } = req.body
    const account = await Account.findOne({ email: wallet.email }) as IAccount
    const withdrawals = await Withdraw.find({ email: users.email, status: "Paid" }).select({ "createdAt": 1 })
    const date = new Date().toString().slice(0, 15)
    var count = 0
    withdrawals.map((withdrawal) => withdrawal.createdAt.toString().slice(0, 15) === date ? count += 1 : count)
    if (count < 2) {
      const withdraw = await Withdraw.find({ email: users.email, status: "Pending" })
      const investments = await Investment.find({ user: users.email, active: true })
      if (investments.length > 0) {
        if(withdraw.length < 1) {
          try {
            if(account) {
              if (amount >= 1000 && amount <= 500000) {
                if (wallet.profit >= parseInt(amount)) {
                  var deduct = 0.05 * parseInt(amount)
                  var paid = parseInt(amount) - deduct
                  if(!users.suspend) {
                    const payload = {
                      account_bank: account.code,
                      account_number: account.accountnumber,
                      amount: paid,
                      currency: "NGN",
                      narration: "Nunotek Payment",  
                      reference: `TRF-${Date.now()}`
                    }
                    const response = await flw.Transfer.initiate(payload)
                    const { data } = response
                    setTimeout(async () => {
                      if (data !== null) {
                        const { data: result } = await flw.Transfer.get_a_transfer({ id: JSON.stringify(data.id) })
                        await Wallet.findOneAndUpdate({ email: wallet.email }, {
                          profit: wallet.profit - parseInt(amount)
                        })
                        if(result.status === "SUCCESSFUL") {
                          await Withdraw.create({ email: wallet.email, amount: paid, charge: deduct, status: "Paid", withdrawalID: JSON.stringify(data.id) })
                          await Notification.create({ email: wallet.email, amount: paid, message: `Successful withdrawal of ₦${Number(paid).toLocaleString()}` })
                          res.status(200).json({ ok: true, message: "Withdrawal has been made successfully." })
                        } else if(result.status === 'FAILED') {
                          await Withdraw.create({ email: wallet.email, amount: paid, charge: deduct, withdrawalID: JSON.stringify(data.id), status: "Declined" })
                          await Notification.create({ email: wallet.email, amount: paid, message: `Declined withdrawal of ₦${Number(paid).toLocaleString()}` })
                          await Wallet.findOneAndUpdate({ email: wallet.email }, {
                            $inc: {
                              profit: amount
                            }
                          })
                          res.status(200).json({ ok: true, message: "Withdrawal request has been made, payment will be received shortly." })
                        } else {
                          await Withdraw.create({ email: wallet.email, amount: paid, charge: deduct, withdrawalID: JSON.stringify(data.id) })
                          res.status(200).json({ ok: true, message: "Withdrawal request has been made, payment will be received shortly." })
                        } 
                      } else {
                        await Withdraw.create({ email: wallet.email, amount: paid, charge: deduct, status: "Declined" })
                        await Notification.create({ email: wallet.email, amount: paid, message: `Failed to process withdrawal of ₦${Number(paid).toLocaleString()}` })
                        res.status(200).json({ ok: false, error: "Error processing request" })
                      }
                    }, 1000)
                  } else {
                    await Wallet.findOneAndUpdate({ email: wallet.email }, {
                      profit: wallet.profit - parseInt(amount)
                    })
                    await Withdraw.create({ email: wallet.email, amount: paid, charge: deduct })
                    res.status(200).json({ ok: true, message: "Withdrawal request has been made, payment will be received shortly." })
                  }
                } else res.status(201).json({ ok: false, error: "Insufficient profit balance, purchase an investment to earn profit." })
              } else {
                res.status(201).json({ ok: false, error: "Minimum withdrawal of 1000 and maximum 500,000"})
              }
            } else {
              res.status(201).json({ ok: false, error: "You must bind an account to enable withdrawal"})
            }
          } catch(err: any) {
            res.status(201).json({ ok: false, error: err.message })
          }
        } else {
          res.status(201).json({ ok: false, error: "You have a pending withdrawal!" })
        }
      } else res.status(200).json({ ok: false, error: "Purchase an investment plan to enable withdrawal" }) 
    } else {
      res.status(200).json({ ok: false, error: "Maximum withdrawal of twice a day" })
    }
  }
  static async successfulWithdrawal(req: Request, res: Response) {
    const { data, event } = req.body
    const signature = req.headers['verif-hash']
    if (data.status === 'SUCCESSFUL' && event === 'transfer.completed' && process.env.FLW_SECRET_WITHDRAWAL_HASH === signature) {
      await Withdraw.findOneAndUpdate({ withdrawalID: data.id }, { status: "Paid" })
      res.status(201).json({ ok: true })
    } else if (data.status === "FAILED" && event === "transfer.completed" && process.env.FLW_SECRET_WITHDRAWAL_HASH === signature) {
      const withdrawal = await Withdraw.findOne({ withdrawalID: data.id, status: "Pending" }) as IWithdraw
      if (withdrawal) {
        await Wallet.findOneAndUpdate({ email: withdrawal.email }, {
          $inc: {
            profit: data.amount + Math.floor(withdrawal.charge)
          }
        })
        await Withdraw.findOneAndUpdate({ withdrawalID: data.id }, { status: "Declined" })
        await Notification.create({ email: withdrawal.email, message: `Refund for failed withdrawal`, amount: data.amount + withdrawal.charge })
      }
      res.status(200).json({ ok: true })
    } else {
      res.status(201).json({ ok: false })
    }
  }
  static async failedWithdrawal(req: Request, res: Response) {
    const { data, event } = req.body
    const signature = req.headers['verif-hash']
    if (data.status === "FAILED" && event === "transfer.completed" && process.env.FLW_SECRET_WITHDRAWAL_HASH === signature) {
      const withdrawal = await Withdraw.findOne({ withdrawalID: data.id }) as IWithdraw
      await Wallet.findOneAndUpdate({ email: withdrawal.email }, {
        $inc: {
          profit: data.amount + Math.floor(withdrawal.charge)
        }
      })
      await Withdraw.findOneAndUpdate({ withdrawalID: data.id }, { status: "Declined" })
      await Notification.create({ email: withdrawal.email, message: `Refund for failed withdrawal`, amount: data.amount + withdrawal.charge })
      res.status(200).json({ ok: true })
    } else {
      res.status(201).json({ ok: false })
    }
  }
}