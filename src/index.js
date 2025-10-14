
// require('dotenv').config({path:'./env'}) 

// import mongoose from "mongoose";

// import { DB_name } from "./constants.js";

import dotenv from"dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB();








