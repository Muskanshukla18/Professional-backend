
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessandRefreshToken = async(userId)=>{
try {
  const user = await User.findById(userId);
  const AccessToken = user.generateAccessToken();
  const RefreshToken = user.generateRefreshToken();

   user.RefreshToken =  RefreshToken;
   await user.save({validateBeforeSave:false})
   
   return{AccessToken,RefreshToken}
     
} catch (error) {
  console.error("Token generation failed:", error);
  throw new ApiError(500,"Something went wrong While generating Access and Refresh Token");
}
}


const registerUser = asyncHandler(async(req,res)=>{
   // get user details from frontend or userSchema 
   // validation check= fields(should not be empty)
   // check if user already exists-(either username or email)
   // check for images , check for avatar
   // uplaod them to cloudinary, avatar
   // create user object- create entry in db
   // remove password and refresh token field from response
   // check for userCreation
   // return res

   const{userName,fullName,email,password}=req.body;
   console.log("email:",email);
   
    //  if (userName=="") {
    //    throw new ApiError(400,"username is required")
    //  }    // can write like this for all but will take alot of time
   
    if ([userName,fullName,email,password].some( (field)=>{field?.trim()===""} )) {
      throw new ApiError(400,"All fields are required")
    }

   const existedUser= await User.findOne({
    $or:[{userName},{email}]        // userName or email
   })

   if (existedUser) {
    throw new ApiError(409,"user with this email or userName already exists")
   }
    
   console.log(req.files);
   
   const avatarLocalPath = req.files?.avatar[0]?.path;
   const CoverImageLocalPath = req.files?.coverImage[0]?.path;

   if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage= await uploadOnCloudinary(CoverImageLocalPath);
   
   if(!avatar){
    throw new ApiError(400,"Avatar file is required")
   }
   
  const user= await User.create({
    fullName ,
    email,
    password,
    userName:userName.toLowerCase(),
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
  })

  const createdUser = await User.findById(user._id).select("-password -RefreshToken")
 
  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
  }
  

  return res.status(201).json(
    new ApiResponse(200, createdUser,"User registered successfully" )
  )
  



  });

const loginUser= asyncHandler(async(req,res)=>{
    // req body-> data
    // validation-userName or email
    // find the user
    // check for password
    // generate Access and Refresh token
    // send Cookies

    const {userName , email,password}=req.body;

    if(!(userName || email)){
      throw new ApiError(404,"username or email is required");
    }
   
    //User.()=>MongoDb   // user.()=>Your methods in userSchema

    const user= await User.findOne({
    $or:[{userName},{email}]
     })

   if (!user) {
    throw new ApiError(404,"User does not exist");
   }
   
   const ispasswordvalid = await user.isPasswordCorrect(password)
   
   if (!ispasswordvalid) {
    throw new ApiError(401,"Invalid user credentials");
   }

  const{AccessToken,RefreshToken}= await generateAccessandRefreshToken(user._id)
  console.log("Generated tokens:", AccessToken, RefreshToken);

  const loggedInUser = await User.findById(user._id).select("-password -RefreshToken")

  const Options={
    httpOnly:true,
    secure:true
  }

 return res
 .status(200)
 .cookie("AccessToken",AccessToken,Options)
 .cookie("RefreshToken",RefreshToken,Options)
 .json(
  new ApiResponse(200,
    {
      user: loggedInUser,AccessToken,RefreshToken
    },
    "User LoggedIn Successfully"
)
 )
});

const logoutUser = asyncHandler(async(req,res)=>{
  // find User
  await User.findByIdAndUpdate(
    req.user._id,
    {
       $set:{
        RefreshToken: undefined,
       }
    },
    {
      new:true,
    }
  )

  const Options={
    httpOnly:true,
    secure:true
  }

 return res
 .status(200)
 .clearCookie("AccessToken",Options)
 .clearCookie("RefreshToken",Options)
 .json(new ApiResponse(200,{},"User logged out"))


})


const RefreshAccessToken= asyncHandler(async(req,res)=>{

 
  const incomingRefreshToken = req.cookie.RefreshToken||req.body.RefreshToken;

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request for Refresh token");
  }
  
   try{
  const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id)
 
  if (!user) {
    throw new ApiError(401,"Invalid Refresh Token");
  }
  
  if (incomingRefreshToken!=user?.RefreshToken) {
    throw new ApiError(401,"Refresh token is expired or invalid");
  }
  
  const Options={
    httpOnly:true,
    secure:true
  }

 const{AccessToken,newRefreshToken}=await generateAccessandRefreshToken(user._id)

 return res
 .status(200)
 .cookie("AccessToken",AccessToken,Options)
 .cookie("RefreshToken",newRefreshToken,Options)
 .json(
    new ApiResponse(
      200,
      {AccessToken,RefreshToken:newRefreshToken},"Access Token Refreshed"
    )
 )
  }

  catch(error){
   throw new ApiError(401,error?.message||"Invalid Refresh Token");
  }



})


const changeCurrentPassword=asyncHandler(async(req,res)=>{

  const{oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
  
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password");
  }
  
  user.password=newPassword;
  await user.save({validateBeforeSave:false})

 return res
 .status(200)
 .json(new ApiResponse(200,{},"Password Changed"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"Current user fetched successfully")
})


const updateAccountDetails=asyncHandler(async(req,res)=>{

  const{fullName,email} = req.body;

  if(!(fullName && email)){
    throw new ApiError(400,"All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        fullName,
        email:email
      }
    },{
      new:true
    }.select("-password")
  )

  return res
 .status(200)
 .json( new ApiResponse(200,user,"Account Details updated Successfully"))



})


const updateUserAvatar=asyncHandler(async(req,res)=>{

  const avatarLocalPath=req.files?.path

  if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is missing");
  }
  
  const avatar= await uploadOnCloudinary(avatarLocalPath)
  
  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar ");
  }

   const user = await User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        avatar:avatar.url
      }
    },{
      new:true
    }.select("-password")
  )
  
  
  return res
 .status(200)
 .json( new ApiResponse(200,user,"Avatar updated Successfully"))


})


const updateUserCoverImage=asyncHandler(async(req,res)=>{

  const coverImageLocalPath=req.files?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400,"Cover Image file is missing");
  }
  
  const coverImage= await uploadOnCloudinary(coverImageLocalPath)
  
  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on cover Image ");
  }

   const user = await User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        coverImage:coverImage.url
      }
    },{
      new:true
    }.select("-password")
  )

  
  return res
 .status(200)
 .json( new ApiResponse(200,user,"cover Image updated Successfully"))



})


export {registerUser,loginUser,logoutUser,RefreshAccessToken,
  changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}









