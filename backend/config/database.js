const mongoose=require("mongoose");
require("dotenv").config();
exports.connectToDb=()=>{
     mongoose.connect(process.env.MONGODB_URL)
     .then(()=>{console.log("DB connection successful")})
     .catch((error)=>{console.error(error);
        console.log("DB connection failed");
        process.exit(1);
    })
}