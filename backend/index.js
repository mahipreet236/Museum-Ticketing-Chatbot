import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'
import chatbotRoutes from './routes/user.chatbot.route.js'

const app = express()
dotenv.config()

const port = process.env.PORT || 3000

app.use(express.json());
app.use(cors());
// Data base connection
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("Connected to Mongo Db")
}).catch((error)=>{
    console.log("Error not connecrd to Mongo DB",error)
})

//Route Define
app.use("/bot/v1/",chatbotRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
