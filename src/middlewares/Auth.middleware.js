
// Auth=>Middleware (verify if user is there)

import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";


export const verifyJwt = asyncHandler(async (req,res,next)=>{
     try {
        
     const token= req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
     
      console.log("Token received:", token);

     if (!token) {
        throw new ApiError(401,"unAuthorized Access");
     }
     
    

     const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

     const user = await User.findById(decodedToken?._id).select("-password -RefreshToken")

     
     if (!user) {
        throw new ApiError(401,"Invalid Access Token");
     }
    
      req.user=user;
      next();

     } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token");
        
     }
})





















