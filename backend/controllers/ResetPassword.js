const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

//resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
    try {
        const { email } = req.body;
        //check user for thsi email, email validation
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: `This Email: ${email} is not registered with us, Please enter a valid Email`
            });
        }

        //generate token
        const token = crypto.randomUUID();

        //update user by adding token and expiration time //here we required token and expirationTime in model of user
        const updatedDetails = await User.findOneAndUpdate({ email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000,
            },
            { new: true },
        );

        console.log('DETAILS: ', updatedDetails);

        //frontend ka url 

        const url = `http://localhost:3000/update-password/${token}`;

        //send mail

        await mailSender(email,
            "Password Reset Link",
            `Your link for email verification is ${url}. Please click this url to reset your password.`)

            return res.json({
                success: true,
                message: 'Email sent successfully, Please Check Your Email To Continue Further',
            });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something Went Wrong While Sending Reset Mail'
        })
    }
}

exports.resetPassword=async(req,res)=>{
    try {
        const {password,confirmPassword,token}=req.body;
        //validation
        if(password!==confirmPassword){
            return res.json({
                success: false,
                message: 'Password And Confirm Password Does Not Match',
            });
        }

        //get user details from db using token

        const userDetails=await User.findOne({token:token});
        //if no user //if entry not found - invalid token
        if(!userDetails){
            return res.json({
                success: false,
                message: 'Invalid Token',
            });
        }

        //token time check
        if(userDetails.resetPasswordExpires<Date.now()){
            return res.json({
                success: false,
                message: 'Token is expired, Please Regenerate Your Token',
            });
        };
        //hash password
        const encryptedPassword = await bcrypt.hash(password, 10);
        //update password
        await User.findOneAndUpdate(
            {token: token},
            {password: encryptedPassword},
            {new: true},
        );
        //return response
        return res.json({
            success: true, 
            message: `Password Updated Successfully`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something Went Wrong While Sending Reset Mail'
        })
    }
    }
