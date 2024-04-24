import { Request, Response } from "express"
import { products, ProductType, BankType } from "../exports/exports"
import Users, { IUser } from "../model/user"
import Wallet, { IWallet } from "../model/wallet"
import Referrer, { IReferrer } from "../model/referrer"
import Deposit, { IDeposit } from "../model/deposit"
import Notification from "../model/notification"
import Investments from "../model/investment"
import Account from "../model/account"
import Withdraw, { IWithdraw } from "../model/withdraw"
import Bank from "../model/bank"
import Coupon, { ICoupon } from "../model/coupon"
import { compareSync, genSaltSync, hashSync } from "bcryptjs"
import * as jwt from "jsonwebtoken"

const Flutterwave = require("flutterwave-node-v3");
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY!,
  process.env.FLW_SECRET_KEY!
);

interface Team {
  user: string
  product: string
  cost: number
}

const createAccessToken = (id: string) => {
  return jwt.sign({ id }, process.env.SECRET_ACCESS_TOKEN!, {
    expiresIn: '7d'
  })
}
const getEndDate = (start: Date, runtime: number) => {
  return new Date(start.setDate(start.getDate() + runtime))
}
const generateNarration = () => {
  const str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  var narration = "";
  for (let i = 0; i < 16; i++) {
    narration += str[Math.floor(Math.random() * 36)];
  }
  return narration;
}
const investmentDate = (runtime: number) => {
  var date = new Date()
  const end = getEndDate(date, runtime)
  const start = new Date()
  const time = end.toString()
  const period = end.getTime()
  return { start, end, time, period }
}
const capitalize = (str: string): string => {
  const firstLetter = str[0].toUpperCase()
  const word = str.replace(str[0], firstLetter)
  return word
}
const getBanks = async (): Promise<BankType[]> => {
  const res = await fetch('https://api.flutterwave.com/v3/banks/NG', {
    method: "get",
    headers: {
      'Authorization': `Bearer ${process.env.FLW_SECRET_KEY!}`
    }
  })
  const data = await res.json()
  return data.data
}

const generatePromoAmount = () => {
  var amount = Math.floor(Math.random() * 101)
  while (amount < 20) {
    amount = Math.floor(Math.random() * 101)
  }
  return amount
}

export default class API {
  static async getSignUp(req: Request, res: Response) {
    res.render('signup', { title: "Nunotek | Signup" })
  }
  static async getSignIn(req: Request, res: Response) {
    res.render('signin', { title: "Nunotek | Signin" })
  }
  static async getForgotPassword(req: Request, res: Response) {
    res.render('forgotpassword', { title: "Nunotek | Forgotten Password" })
  }
  static async getUserDashboard(req: Request, res: Response) {
    const user = res.locals.user
    const wallet = await Wallet.findOne({ email: user.email })
    const referrers = await Referrer.findOne({ email: user.email })
    const investments = await Investments.find({ user: user.email })
    res.render('client/dashboard', { title: "Nunotek | Dashboard", products, wallet, referrers, investments })
  }
  static async getAbout(req: Request, res: Response) {
    res.render('client/about', { title: "Nunotek | About" })
  }
  static async getCoupon(req: Request, res: Response) {
    const coupon = await Coupon.findOne({ active: true })
    res.render('client/coupon', { title: "Nunotek | Copuon Code", coupon })
  }
  static async getUserLink(req: Request, res: Response) {
    const user = res.locals.user
    res.render('client/share', { title: "Nunotek | Referral", user })
  }
  static async getHealthCheck(req: Request, res: Response) {
    res.status(200).json({ ok: true, status: 200 })
  }
  static async getUserAccount(req: Request, res: Response) {
    const user = res.locals.user
    const wallet = await Wallet.findOne({ email: user.email })
    const coupon = await Coupon.findOne({ active: true })
    res.render('client/account', { title: "Nunotek | Account", wallet, coupon })
  }
  static async getUserTransactionLogs(req: Request, res: Response) {
    const user = res.locals.user
    const notifications = await Notification.find({ email: user.email }).sort({ createdAt: -1 })
    res.render('client/transaction-log', { title: "Nunotek | Transaction Logs", notifications })
  }
  static async getBindAccount(req: Request, res: Response) {
    const { email } = res.locals.user as IUser
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
    const account = await Account.findOne({ email })
    res.render('client/bind-account', { title: "Nunotek | Bind Account", banks, account })
  }
  static async getSetPassword(req: Request, res: Response) {
    res.render('client/set-password', { title: "Nunotek | Set Password"})
  }
  static async getUserInvestments(req: Request, res: Response) {
    const user = res.locals.user as IUser
    const investments = await Investments.find({ user: user.email })
    const wallet = await Wallet.findOne({ email: user.email })
    res.render('client/investment-log', { title: "Nunotek | Investment Logs", investments, wallet })
  }
  static async getUserTeam(req: Request, res: Response) {
    const user = res.locals.user
    const wallet = await Wallet.findOne({ email: user.email })
    const referrals = await Referrer.find({ parent: user.email })
    const grandparents = await Referrer.find({ grandparent: user.email })
    const greatgrandparents = await Referrer.find({ greatgrandparent: user.email })
    const referrers = await Referrer.findOne({ email: user.email })
    const array: Team[] = []
    const secondGen: Team[] = []
    const thirdGen: Team[] = []
    const sumTotalFirstGen: number[] = []
    const sumTotalSecondGen: number[] = []
    const sumTotalThirdGen: number[] = []
    const todayIncomeFirst: number[] = []
    const todayIncomeSecond: number[] = []
    const todayIncomeThird: number[] = []
    const today = new Date().toString().slice(0, 15)
    referrals ? referrals.forEach(async (referral) => {
      const investments = await Investments.find({ user: referral.email, active: true })
      investments.map((investment) => {
        array.push({ user: referral.email, product: investment.product, cost: investment.deposit })
        sumTotalFirstGen.push(investment.deposit * 0.1)
        investment.createdAt.toString().slice(0, 15) === today ? todayIncomeFirst.push(investment.deposit * 0.1) : todayIncomeFirst
      })
    }) : null
    grandparents ? grandparents.forEach(async (referral) => {
      const investments = await Investments.find({ user: referral.email, active: true })
      investments.map((investment) => {
        secondGen.push({ user: referral.email, product: investment.product, cost: investment.deposit })
        sumTotalSecondGen.push(investment.deposit * 0.05)
        investment.createdAt.toString().slice(0, 15) === today ? todayIncomeSecond.push(investment.deposit * 0.05) : todayIncomeSecond
      })
    }) : null
    greatgrandparents ? greatgrandparents.forEach(async (referral) => {
      const investments = await Investments.find({ user: referral.email, active: true })
      investments.map((investment) => {
        thirdGen.push({ user: referral.email, product: investment.product, cost: investment.deposit })
        sumTotalThirdGen.push(investment.deposit * 0.01)
        investment.createdAt.toString().slice(0, 15) === today ? todayIncomeThird.push(investment.deposit * 0.01) : todayIncomeThird
      })
    }) : null
    const totalReferrals = referrals || grandparents || greatgrandparents ? referrals.length + grandparents.length + greatgrandparents.length : 0
    setTimeout(() => {
      const firstGenTotal = array.length > 0 ? sumTotalFirstGen.reduce((a, b) => a + b) : 0
      const secondGenTotal = secondGen.length > 0 ? sumTotalSecondGen.reduce((a, b) => a + b) : 0
      const thirdGenTotal = thirdGen.length > 0 ? sumTotalThirdGen.reduce((a, b) => a + b) : 0
      res.render('client/team', { title: "Nunotek | Team", array, referral_code: user.referralcode, totalReferrals, secondGen, thirdGen, firstGenTotal, secondGenTotal, thirdGenTotal, wallet, todayIncomeFirst, todayIncomeSecond, todayIncomeThird, referrers })
    }, 1000)
  }
  static async getUserProfile(req: Request, res: Response) {
    const user = res.locals.user
    const wallet = await Wallet.findOne({ email: user.email })
    // const referral = await Referrer.findOne({ email: user.email }) as IReferrer
    // var referralIncome = 0
    // referral.users.forEach(async (user) => {
    //   const investments = await Investments.find({ user: user.email })
    //   investments.forEach((investment) => {
    //     var bonus = 0.1 * investment.deposit
    //     referralIncome += bonus
    //   })
    // })
    // setTimeout(() => {
    //   res.render('client/profile', { title: "Nunotek | Profile", referralIncome })
    // }, 1000)
    res.render('client/profile', { title: "Nunotek | Profile", user, wallet })
  }
  static async activateCoupon(req: Request, res: Response) {
    const { code } = req.body
    const user = res.locals.user
    try {
      const coupon = await Coupon.findOne({ active: true }) as ICoupon
      if (coupon.users.length < 100) {
        if (code === coupon.code) {
          const promo_user = await Coupon.findOne({ active: true }).select({ "users": 1 })
          if (promo_user?.users.every(person => person.email !== user.email)) {
            const amount = generatePromoAmount()
            await Wallet.findOneAndUpdate({ email: user.email }, {
              $inc: {
                amount
              }
            })
            await Coupon.findOneAndUpdate({ active: true }, {
              $inc: {
                count: 1
              },
              $push: {
                users: user
              }
            })
            await Notification.create({ email: user.email, message: `₦${ Number(amount).toLocaleString() } added to your account balance via promo code`, amount })
            res.status(200).json({ ok: true, message: "Promo code used successfully" }) 
          } else res.status(200).json({ ok: false, error: "You have used this coupon" })
        } else res.status(200).json({ ok: false, error: "Invalid/expired coupon code" })
      } else {
        await Coupon.findOneAndUpdate({ active: true }, { active: false })
        res.status(200).json({ ok: false, error: "Invalid/expired coupon code" })
      }
    } catch (err: any) {
      res.status(200).json({ ok: false, error: "Error processing request" })
    }
  }
  static async getUserFunding(req: Request, res: Response) {
    const user = res.locals.user
    const deposit = await Deposit.findOne({ email: user.email, status: "Pending" })
    res.render('client/funding', { title: "Nunotek | Funding", deposit })
  }
  static async getUserRecharge(req: Request, res: Response) {
    const user = res.locals.user
    const deposit = await Deposit.findOne({ email: user.email, status: 'Pending' })
    const account = await Bank.findOne({ name: "admin" })
    if (deposit) {
      if (account) {
        res.render("client/gateway", { title: "Nunotek | Recharge", deposit, account })
      } else {
        const details = {
          tx_ref: deposit.narration,
          amount: deposit.amount,
          email: user.email,
          narration: `Nunotek Deposit`,
          is_permanent: false,
        }
        const response = await flw.VirtualAcct.create(details)
        res.render("client/gateway", { title: "Nunotek | Recharge", deposit, account, bank: response.data })
      }
    } else {
      res.redirect('/funding')
    }
  }
  static async getFundingHistory(req: Request, res: Response) {
    const user = res.locals.user
    const deposits = await Deposit.find({ email: user.email }).sort({ createdAt: -1 })
    res.render('client/funding-history', { title: "Nunotek | Funding History", deposits })
  }
  static async getUserWithdrawal(req: Request, res: Response) {
    const { email } = res.locals.user
    const account = await Account.findOne({ email })
    if (!account) {
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
      res.render('client/withdraw', { title: "Nunotek | Withdraw", account, banks })
    } else res.render('client/withdraw', { title: "Nunotek | Withdraw", account })
  }
  static async getAccountName(req: Request, res: Response) {
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
      const data = await response.json()
      res.status(200).json({ ok: true, data })
    } catch (err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async bindAccount(req: Request, res: Response) {
    const { email } = res.locals.user as IUser
    const { accountname, accountnumber, bankname } = req.body
    if(accountname && accountnumber && bankname) {
      try {
        const banks = await getBanks()
        const bank = banks.filter((a) => a.code === bankname).shift() as BankType
        const account = await Account.findOne({ email })
        account ? await Account.findOneAndUpdate({ email }, { accountname, accountnumber, bankname: bank.name, code: bank.code }) : await Account.create({ accountname, accountnumber, bankname: bank.name, email, code: bank.code })
        res.status(200).json({ ok: true, message: "You have successfully binded your bank account."})
      } catch(err: any) {
        res.status(402).json({ ok: false, error: err.message})
      }
    } else res.status(402).json({ ok: false, error: "Fill in all fields" })
  }
  static async getUserWithdrawalHistory(req: Request, res: Response) {
    const user = res.locals.user
    const withdrawals = await Withdraw.find({ email: user.email })
    res.render('client/withdraw-history', { title: "Nunotek | Withdraw History", withdrawals })
  }
  static async getAccountSetup(req: Request, res: Response) {
    const { email } = res.locals.user
    const account = await Account.findOne({ email })
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
    res.render('client/bind-account', { title: "Nunotek | Bind Account", banks, account })
  }
  static async resetPassword(req: Request, res: Response) {
    const user = res.locals.user
    const { email, password, old_password } = req.body
    const valid = compareSync(old_password, user.password)
    if (valid) {
      const salt = genSaltSync(10)
      const hashedPassword = hashSync(password, salt)
      await Users.findOneAndUpdate({ email }, { password: hashedPassword })
      res.status(200).json({ ok: true, message: "Password changed successfully" })
    } else res.status(200).json({ ok: false, message: "Invalid password" })
  }
  static async register(req: Request, res: Response) {
    const body = req.body as IUser
    const { code } = req.query
    try {
      const user = await Users.register(body)
      await Wallet.create({ amount: 200, userid: user._id, email: body.email })
      await Referrer.create({ email: user.email })
      await Notification.create({ email: user.email, amount: 200, message: "Welcome Bonus" })
      if (code) {
        const referrer = await Users.findOne({ referralcode: code }) as IUser
        const { parent } = await Referrer.findOne({ email: referrer.email }).select({ "parent": 1 }) as IReferrer
        if (!parent) {
          await Referrer.findOneAndUpdate({ email: referrer?.email }, {
            $push: {
              users: user
            },
            $inc: {
              referrals: 1
            }
          })
          await Referrer.findOneAndUpdate({ email: user.email }, { parent: referrer?.email })
          await Notification.create({ email: referrer?.email, message: `${capitalize(user.email)} registered via your link`, amount: 0 })
        } else {
          (
            parent ? await Referrer.findOneAndUpdate({ email: parent }, {
              $push: {
                grandchildren: user
              },
              $inc: {
                referrals: 1
              }
            }) : null
          )
          const { parent: greatgrandfather } = await Referrer.findOne({ email: parent }).select({ "parent": 1 }) as IReferrer
          (
            greatgrandfather ? await Referrer.findOneAndUpdate({ email: greatgrandfather }, {
              $push: {
                greatgrandchildren: user
              },
              $inc: {
                referrals: 1
              }
            }) : null
          )
          await Referrer.findOneAndUpdate({ email: referrer?.email }, {
            $push: {
              users: user
            },
            $inc: {
              referrals: 1
            }
          })
          parent ? await Referrer.findOneAndUpdate({ email: user.email }, { parent: referrer?.email, grandparent: parent }) && await Notification.create({ email: parent, message: `${capitalize(user.email)} registered via your downline ${referrer.email}`, amount: 0 }) : await Referrer.findOneAndUpdate({ email: user.email }, { parent: referrer?.email })
          greatgrandfather ? await Referrer.findOneAndUpdate({ email: user.email }, { greatgrandparent: greatgrandfather }) && await Notification.create({ email: greatgrandfather, message: `${capitalize(user.email)} registered via your second generation downline ${referrer.email}`, amount: 0 }) : null
          await Notification.create({ email: referrer?.email, message: `${capitalize(user.email)} registered via your link`, amount: 0 })
        }
      }
      res.status(200).json({ ok: true, message: "Registered successfully" })
    } catch(err: any) {
      res.status(401).json({ ok: false, error: err.message })
    }
  }
  static async login(req: Request, res: Response) {
    const { email, password } = req.body
    try {
      const user = await Users.login(email, password)
      const token = createAccessToken(user?._id)
      res.cookie('pid', token, {
        maxAge: 60 *60 *24 *1000
      })
      res.status(200).json({ ok: true, message: "Logged in successfully" })
    } catch (err: any) {
      res.status(402).json({ ok: false, error: err.message })
    }
  }
  static async logout(req: Request, res: Response) {
    const token = req.cookies.pid
    if (token) {
      res.cookie('pid', '')
      res.redirect('/login')
    } else res.status(200).json({ ok: false })
  }
  static async createInvestment(req: Request, res: Response) {
    const user = res.locals.user as IUser
    const { product } = req.body
    if (product) {
      var item = products.filter((p) => p.name === product).shift() as ProductType
      const { end, start, time, period } = investmentDate(20)
      if (Object.keys(item).length >= 5 && Object.values(item).every((i) => i !== null && i !== '')) {
        const { amount } = await Wallet.findOne({ email: user.email }) as IWallet
        if (amount >= item.deposit) {
          try {
            const { parent, grandparent, greatgrandparent } = await Referrer.findOne({ email: user.email }) as IReferrer
            const bonus = 0.2 * item.deposit
            const grandBonus = 0.1 * item.deposit
            const greatgrandBonus = 0.05 * item.deposit
            parent ? 
            await Wallet.findOneAndUpdate({ email: parent }, { $inc: { profit: bonus }}) && await Notification.create({ email: parent, amount: bonus, message: `20% bonus from ${item.name} investment plan purchased by ${user.email}` })
            : null
            grandparent ? 
            await Wallet.findOneAndUpdate({ email: grandparent }, { $inc: { profit: grandBonus }}) && await Notification.create({ email: grandparent, amount: grandBonus, message: `10% bonus from ${item.name} investment plan purchased by ${user.email}` })
            : null
            greatgrandparent ? 
            await Wallet.findOneAndUpdate({ email: greatgrandparent }, { $inc: { profit: greatgrandBonus }}) && await Notification.create({ email: greatgrandparent, amount: greatgrandBonus, message: `5% bonus from ${item.name} investment plan purchased by ${user.email}` })
            : null
            await Investments.create({ user: user.email, start, end, time, period, product: item.name, deposit: item.deposit, dailyIncome: item.dailyIncome, totalIncome: item.totalIncome })
            await Wallet.findOneAndUpdate({ email: user.email }, { $inc: { amount: -item.deposit } })
            await Notification.create({ email: user.email, amount: item.deposit, message: `Purchased ${item.name} plan of ₦ ${Number(item.deposit).toLocaleString()}` })
            res.status(200).json({ ok: true })
          } catch(err: any) {
            res.status(402).json({ ok: false, error: err.message })
          }
        } else {
          res.status(201).json({ ok: false, error: "Insufficient funds" })
        }
      } else res.status(402).json({ ok: false, error: "Error processing request, deal currently unavailable."})
    } else res.redirect('/account')
  }
  static async createDeposit(req: Request, res: Response) {
    const { amount } = req.body
    const { email, firstname, lastname } = res.locals.user
    const transactionRef = generateNarration()
    const deposit = await Deposit.findOne({ email, status: "Pending" })
    if (parseInt(amount) >= 100) {
      if (!deposit) {
        await Deposit.create({ sender: firstname + " " + lastname, narration: transactionRef, email, amount })
        res.status(200).json({ ok: true, message: "Your recharge request has been successfully made, ensure to visit your recharge records" })
      } else {
        res.status(201).json({ ok: true, error: "You have a pending recharge request."})
      }
    } else res.status(201).json({ ok: false, error: "Minimum recharge of 1,500"})
  }
  static async getUserWithdrawRecord(req: Request, res: Response) {
    const { email } = res.locals.user
    const wallet = await Wallet.findOne({ email }) as IWallet
    const withdrawal = await Withdraw.findOne({ email, status: "Pending" }) as IWithdraw
    if (withdrawal) {
      const amount = withdrawal.amount + withdrawal.charge
      const response = await fetch(`https://api.flutterwave.com/v3/transfers/${withdrawal.withdrawalID}`, {
        method: "get",
        headers: {
          Authorization: "Bearer " + process.env.FLW_PAYOUT_SECRET_KEY!
        }
      })
      const {data} = await response.json()
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
    }
    const withdraws = await Withdraw.find({ email }).sort({ createdAt: -1 })
    res.render("client/withdrawRecords", { title: "Nunotek | Withdrawal Record", ok: true, withdraws })
  }
  static async withdraw(req: Request, res: Response) {
    const wallet = res.locals.wallet as IWallet
    const users = res.locals.user as IUser
    const { amount } = req.body
    const account = await Account.findOne({ email: wallet.email })
    const withdraw = await Withdraw.find({ email: users.email, status: "Pending" })
    if(withdraw.length < 1) {
      try {
        if(account) {
          if (amount >= 1000) {
            if(wallet.profit >= parseInt(amount)) {
              var deduct = 0.07 * parseInt(amount)
              var paid = parseInt(amount) - deduct
              if(!users.suspend) {
                const payload = {
                  account_bank: account.code,
                  account_number: account.accountnumber,
                  amount: paid,
                  currency: "NGN",
                  narration: "Nunotek Withdrawal",
                  reference: `TRF-${Date.now()}`
                }
                const response = await flw.Transfer.initiate(payload)
                // console.log(response)
                const { data } = response
                // console.log(data)
                setTimeout(async () => {
                  const { data: result } = await flw.Transfer.get_a_transfer({ id: JSON.stringify(data.id) })
                  // console.log(result)
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
            res.status(201).json({ ok: false, error: "Minimum withdrawal of 1000"})
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
  }
  static async failedWithdrawal(req: Request, res: Response) {
    const { data, event } = req.body
    const signature = req.headers['verif-hash']
    if (data.status === "FAILED" && event === "transfer.completed" && process.env.FLW_SECRET_WITHDRAWAL_HASH === signature) {
      const withdrawal = await Withdraw.findOne({ withdrawalID: data.id }) as IWithdraw
      await Wallet.findOneAndUpdate({ email: withdrawal.email }, {
        $inc: {
          profit: data.amount
        }
      })
      await Withdraw.findOneAndUpdate({ withdrawalID: data.id }, { status: "Declined" })
      res.status(200).json({ ok: true })
    } else {
      res.status(201).json({ ok: false })
    }
  }
  static async webhookHandler(req: Request, res: Response) {
    const signature = process.env.FLW_SECRET_HASH!
    if (signature === req.headers["verif-hash"]) {
      const { data, event } = req.body
      const deposit = await Deposit.findOne({ email: data.customer.email, status: "Pending" }) as IDeposit
      if (data.status === 'successful' && data.amount === deposit.amount) {
        await Deposit.findOneAndUpdate({ email: data.customer.email, status: "Pending" }, { status: "Approved", transactionID: data.id })
        await Wallet.findOneAndUpdate({ email: data.customer.email }, {
          $inc: {
            amount: data.amount
          }
        })
        await Notification.create({ email: data.customer.email, amount: data.amount, message: `Approved deposit of ₦ ${Number(data.amount).toLocaleString() }` })
      } else if (data.status === 'pending') {
        await Deposit.findOneAndUpdate({ email: data.customer.email, status: "Pending" }, { transactionID: data.id })
      } else {
        await Deposit.findOneAndUpdate({ email: data.customer.email, status: "Pending" }, { status: "Declined", transactionID: data.id })
      }
      res.status(200).json({ ok: true })
    } else {
      res.status(201).json({ ok: false })
    }
  }
}