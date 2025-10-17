
import express from "express"
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors";

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())




// import routes
import useRouter from "./routes/userRoutes.js"

//routes declaration 
app.use("/api/v1/users",useRouter)

// link => https://localhost:8000/api/v1/users/register   if router is register
// link => https://localhost:8000/api/v1/users/login   if router is login









export default app ;


