
// can be done using two menthods 
//1) Wrapper function (HIGH-ORDER FXN)         2) Promise return type 

//1) Wrapper:-

// const asyncHandler=(fxn)= async()=>{
//  try {
//     await fxn(res,req,next);
//  } catch (error) {
//     res.status(error.code||500).json({
//         success:false,
//         message:error.message
//     })
//  }
// }



const asyncHandler = (requestHandler) =>{ return (res,req,next)=>{
 Promise.resolve(requestHandler(res,req,next)).reject((error)=>next(error))
}
}
export {asyncHandler}














