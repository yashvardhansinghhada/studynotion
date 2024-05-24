const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");
const Profile=require("../models/Profile");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");

const {passwordUpdated}=require("../mail/tempalates/passwordUpdate");
const mailSender = require("../utils/mailSender");
require("dotenv").config();


exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const isUserExist =await User.findOne({ email });
        if (isUserExist) {
            return res.status(401).json({
                success: false,
                message: "User already existed"
            });
        }
        //otp generate
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        //check unique otp
        const result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }

        //db entry

        const otpPayload = { email, otp };

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        res.status(200).json({
            success: true,
            message: "Otp sent successfully",
            otp
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "something went wrong",

        })
    };
}


//signup

exports.signUp = async (req, res) => {
    try {
        //data fetch from request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        //validata data
        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !otp
        ) {
            return res.status(403).json({
                success: false,
                message: 'All Fields are required',
            });
        }
        //check if Password and confirm password matches or not?
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and Confirm Password do not match. Please try again',
            });
        }

        //check if user already exist or not 
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists. Please Sign in to continue.',
            });
        }

        //find most recent otp stored for user

        const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1);

        if (recentOtp.length === 0) {
            //OTP not found
            return res.status(400).json({
                success: false,
                message: 'The OTP is not valid',
            })
        }
      //comparing otp with recent otp
        else if( recentOtp.otp!==otp){
            return res.status(400).json({
                success: false,
                message: 'otp does not match',
            });
        }

        //hash using bcrypt
        const hashedPassword=await bcrypt.hash(password,10);

        //db entry //profile model mai bhi karana padegi

           //create the additional profile for user
        const profileDetails = await  Profile.create({
            gender : null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });


        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        //return response
        return res.status(200).json({
            success: true,
            user,
            message: 'User Registered Successfully',
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User Cannot be Registered, Please Try Again.'
        })
    }
};


//login

exports.login = async (req, res) => {
    try {
        //get data from req body
        const {email, password} = req.body;
        //validation of data
        if(!email || !password) {
            //Return 400 Bad Request status code with error message
            return res.status(400).json({
                success: false,
                message: `Please Fill up All the Required Fields`,
            });
        }
        //check user exists or not
        const user = await User.findOne({email}).populate('additionalDetails');
        if(!user) {
            return res.status(401).json({
                //Return 401 unauthorized status code with error message
                success: false,
                message: `User is not registered with Us, Please signup to Continue`,
            });
        }
        //Generate JWT, after password match
        if(await bcrypt.compare(password, user.password)) {
            const payLoad = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
                expiresIn: '2h',
            });

            //save token to user document in database
            user.token = token;
            user.password = undefined;
        
            //create cookie and send response
            const options = {
                expiresIn: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie('token', token, options).status(200).json({
                success: true,
                token,
                user,
                message: `User Login Success`,
            });
            
        } else {
            return res.status(401).json({
                success: false,
                message: `Password Is Incorrect`,
            });
        }


    } catch (error) {
        console.log(error);
        //Return 500 Internal Server Error status code with error message
        return res.status(500).json({
            success: false,
            message: `Login Failure Please Try Again`,
        });
    }
};


// change password

exports.changePassword=async(req,res)=>{
    try {
         //find user
         const userDetails=await User.findById(req.user.id);

         //new and old password
         const {oldPassword,newPassword}=req.body;

         //if old password user entered not match to its original value
         const isPasswordMatch= await bcrypt.compare(oldPassword,userDetails.password);

         if(!isPasswordMatch){
            return res
            .status(401)
            .json({
            success: false,
            message: 'The Password is Incorrect',
        })
         }

         //now password is matched, bcrypt new password

         const encryptedPassword =await bcrypt.hash(newPassword,10);

         const updatedUserDetails=await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
         );


         //send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                `Password Updated Successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`,
                passwordUpdated(
                    updatedUserDetails.email,
                    updatedUserDetails.firstName,
                )
            )
            console.log('Email sent successfully................', emailResponse);
        } catch (error) {
            //if there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.log('Error Occurred While Sending Email: ', error);
            return res.status(500).json({
                success: false,
                message: 'Error Occurred While Sending Email',
                error: error.message,
            });
        }
           //Return success response
        return res
        .status(200)
        .json({ success: true, message: 'Password Updated Successfully' });


    } catch (error) {
           //if there's an error updating the password, log the error and return 500 (Internal Server Error) error
           console.error('Error Occurred While Updating Password', error);
           return res.status(500).json({
               success: false,
               message: 'Error Occurred While Updating Password',
               error: error.message,
           });
    }
}