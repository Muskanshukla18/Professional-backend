
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessandRefreshToken = async(userId)=>{
try {
  const user = User.findById(userId);
  const AccessToken = user.generateAccessToken();
  const RefreshToken = user.generateRefreshToken();

   user.RefreshToken =  RefreshToken;
   await user.save({validateBeforeSave:false})
   
   return(AccessToken,RefreshToken)

} catch (error) {
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

  const{AccessToken,RefreshToken}=generateAccessandRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id)
  select("-password -RefreshToken")

  const Options={
    httpOnly:true,
    secure:true
  }

 return res
 .status(200)
 .cookie("AccessToken",AccessToken,Options)
 .cookie("refreshToken",RefreshToken,Options)
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

export {registerUser,loginUser,logoutUser}









