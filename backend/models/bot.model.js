import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    text:{
        type:String,    
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
})

const Bot = mongoose.model("Bot",userSchema)
export default Bot;