
import multer from "multer";

// just copy and pasted from "multer" website

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Public/temp')     // public --> temp-->(path change krke , ye khud likh diya h humne)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)  // unique suffix ur wish , u can remove it too
  }
})

export const upload = multer({ storage })















