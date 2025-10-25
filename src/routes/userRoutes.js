
import { Router } from "express";
import {getCurrentUser,changeCurrentPassword, RefreshAccessToken, registerUser,updateAccountDetails ,updateUserAvatar,
     updateUserCoverImage,getUserChannelProfile,getWatchHistory} 
   from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlware.js"; 
import { loginUser } from "../controllers/user.controller.js";
import {logoutUser} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/Auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
           name:"avatar",
           maxCount:1 
        },
        {
           name:"coverImage",
           maxCount:1 
        },

    ])
    ,registerUser)


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJwt,logoutUser)

router.route("/refresh-token").post(RefreshAccessToken)

router.route("/change-password").post(verifyJwt,changeCurrentPassword)

router.route("/current-user").get(verifyJwt,getCurrentUser)

router.route("/update-account").patch(verifyJwt,updateAccountDetails)

router.route("/avatar").patch(verifyJwt,upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:userName").get(verifyJwt,getUserChannelProfile)

router.route("/history").get(verifyJwt,getWatchHistory)


export default router












