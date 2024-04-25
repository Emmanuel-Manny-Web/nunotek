import "dotenv/config"
import express from "express"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import Router from "./routes/router"
import Routes from "./routes/adminRoutes"
import { HTTPS } from "express-sslify"
import { Request, Response } from "express"

const app = express()
if(process.env.NODE_ENV === 'production') {
  app.use(HTTPS({ trustProtoHeader: true }))
}

app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static('public'))

app.use('/', Router)
app.use('/control-route', Routes)

app.use("*", (req: Request, res: Response) => res.redirect('/signin'))

mongoose.connect(process.env.DB_URI!)
.then(() => console.log('Connected to the database'))
.catch(err => console.log(err.message))

app.listen(process.env.PORT as number | undefined, () => console.log(`Server running on port ${process.env.PORT!}`))