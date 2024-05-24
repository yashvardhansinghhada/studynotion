const nodemailer=require("nodemailer");
require("dotenv").config();
const mailSender=async(email,title,body)=>{
    try {
        let transporter= nodemailer.createTransport({
            host:process.env.MAIl_HOST,
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASSWORD,
            },
        })

        let info=transporter.sendMail({
            from:"Banna-Yashvardhan",
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`
        })
        console.log("Info",info);
        return info;
    } catch (error) {
        console.error(error);
    }
}

module.exports=mailSender;