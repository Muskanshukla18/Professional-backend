
import mongoose ,{Schema}from "mongoose"

import bcrypt, { compare } from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
   userName:{
  type :String,
  required:true,
  lowercase:true,
  unique:true,
  index:true,
  trim:true,
   },
   email:{
  type :String,
  required:true,
  lowercase:true,
  unique:true,
  trim:true,
   },
   fullName:{
  type :String,
  required:true,
  index:true,
  trim:true,
   },
   avatar:{
    type:String,  // clouding URL will be generated which is a string itself
    required:true,
   },
   coverImage:{
    type:String,  // Again URL
   },
   WatchHistory:[     // an Array for id for videos Watched
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Video",
    }
   ],
   password:{
    type:String,
    required:[true,"Password is required"],
   },
   RefreshToken:{
    type:String,
   }
  },{timestamps:true}              // for Time=> UpdatedAt.()  and CreatedAt.()
)

// uses async fxn , save property as we need to save after any changes made
// we need to use this.  because how can we access or work on Password from many fields of userSchema
   // save => document middleware

userSchema.pre("save", async function(next){
  if(!this.modified("password"))   return next();
 this.password= await bcrypt.hash(this.password,10)
 next();
})

// jwt => JsonWebToken

userSchema.methods.generateAccessToken = function(){
   jwt.sign({
    _id:this._id,
    email:this.email,
    userName:this.userName,
    fullName:this.fullName
   }),
   process.env.ACCESS_TOKEN_SECRET,
   {
     expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   }
}


userSchema.methods.generateRefreshToken = function(){
   jwt.sign({
    _id:this._id,
   }),
   process.env.REFRESH_TOKEN_SECRET,
   {
     expiresIn:process.env.REFRESH_TOKEN_EXPIRY
   }
}

userSchema.methods.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password,this.password)
}
export const User = mongoose.model("User",userSchema)












