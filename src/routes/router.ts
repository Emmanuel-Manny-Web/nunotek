import { Router } from "express"
import API from "../controller/controller"
import { CheckToken, AuthUser, CouponCheck, DownLineCheck } from "../middleware/auth"
import Handler from "../controller/withdrawController"

const router = Router()

router.get('/register', CheckToken, API.getSignUp)
router.get('/signin', CheckToken, API.getSignIn)
router.get('/logout', AuthUser, API.logout)
router.get('/forgot-password', CheckToken, API.getForgotPassword)
router.get('/dashboard', AuthUser, DownLineCheck, API.getUserDashboard)
router.get('/trx-log', AuthUser, DownLineCheck, API.getUserTransactionLogs)
router.get('/funding', AuthUser, DownLineCheck, API.getUserFunding)
router.get('/recharge', AuthUser, DownLineCheck, API.getUserRecharge)
router.get('/funding-history', AuthUser, DownLineCheck, API.getFundingHistory)
router.get('/withdraw', AuthUser, DownLineCheck, API.getUserWithdrawal)
router.get('/about-us', AuthUser, DownLineCheck, API.getAbout)
router.get('/coupon', AuthUser, CouponCheck, DownLineCheck, API.getCoupon)
router.get('/share', AuthUser, DownLineCheck, API.getUserLink)
router.get('/withdraw-history', AuthUser, DownLineCheck, Handler.getUserWithdrawRecord)
router.get('/account-setup', AuthUser, DownLineCheck, API.getAccountSetup)
router.get('/investment-log', AuthUser, DownLineCheck, API.getUserInvestments)
router.get('/team', AuthUser, DownLineCheck, API.getUserTeam)
router.get('/profile', AuthUser, DownLineCheck, API.getUserProfile)
router.get('/bind-account', AuthUser, DownLineCheck, API.getBindAccount)
router.get('/change-password', AuthUser, DownLineCheck, API.getSetPassword)
router.get('/health', AuthUser, DownLineCheck, API.getHealthCheck)
router.post('/signup', CheckToken, API.register)
router.post('/login', CheckToken, API.login)
router.post('/activate-coupon', AuthUser, API.activateCoupon)
router.post('/investment', AuthUser, API.createInvestment)
router.post('/reset-password', AuthUser, API.resetPassword)
router.post('/deposit', AuthUser, API.createDeposit)
router.post('/account-name', AuthUser, API.getAccountName)
router.post('/bind-account', AuthUser, API.bindAccount)
router.post('/withdraw-cash', AuthUser, Handler.withdraw)
router.post('/flw-webhook', API.webhookHandler)
router.post('/successful-withdrawal', Handler.successfulWithdrawal)
router.post('/failed-withdrawal', Handler.failedWithdrawal)

export default router