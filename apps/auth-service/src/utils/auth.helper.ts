import crypto from 'crypto';
import { ValidationError } from '@packages/error-handler';
import redis from '@packages/libs/redis';
import { sendEmail } from './sendMail';
import { NextFunction, Request, Response } from 'express';
import prisma from '@packages/libs/prisma';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validationRegistrationData = (data: any, userType: "user" | "seller") => {
    const { name, email, password, phone_number, country } = data;

    if (
        !name ||
        !email ||
        !password ||
        (userType === "seller" && (!phone_number || !country))
    ) {
        throw new ValidationError(`Missing required fields`);
    }

    if (!emailRegex.test(email)) {
        throw new ValidationError(`Invalid email format`);
    }
}

export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
    if (await redis.get(`otp_lock:${email}`)) {
        // 30 min locked
        throw new ValidationError("Account Locked due to multiple failed attempts, try again after 30 min later!");
    }

    if (await redis.get(`otp_spam_lock:${email}`)) {
        // 1 hr locked
        throw new ValidationError("Too many OTP request!, Please wait 1 hr before request again");
    }

    if (await redis.get(`otp_cooldown:${email}`)) {
        // 1 min cooldown
        throw new ValidationError("Please wait 1 min before request again");
    }
}

export const trackOtpRequest = async (email: string, next: NextFunction) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

    if (otpRequests >= 2) {
        await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
        throw new ValidationError("Too many OTP request!, Please wait 1 hr before request again");
    }

    await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600); //Tracking a request for 1 hr
}

export const sendOtp = async (name: string, email: string, template: string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    await sendEmail(email, "Verify Your Email", template, { name, otp });
    await redis.set(`otp:${email}`, otp, "EX", 300);
    await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
}

export const verifyOtp = async (email: string, otp: string, next: NextFunction) => {
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp) {
        throw new ValidationError("Invalid or expired OTP");
    }

    const failedAttemptsKey = `otp_attempts:${email}`;
    const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0");

    if (storedOtp !== otp) {
        if (failedAttempts >= 2) {
            await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); // 30 min lock
            await redis.del(`otp:${email}`, failedAttemptsKey);
            throw new ValidationError("Account Locked due to multiple failed attempts, try again later!");
        }
        await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300); // 5 min lock
        throw new ValidationError(`Invalid OTP. ${2 - failedAttempts} attempts left`);
    }
    await redis.del(`otp:${email}`, failedAttemptsKey);
}

export const handleForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
    userType: "user" | "seller"
) => {
    try {
        const { email } = req.body;
        if (!email) throw new ValidationError("Email is required");

        //  Find user/seller
        const user = userType === "user" 
        ? await prisma.users.findUnique({ where: { email } }) 
        : await prisma.sellers.findUnique({ where: { email }});

        if (!user) throw new ValidationError(`${userType} not found!`);

        // Check otp restrictions
        await checkOtpRestrictions(email, next);
        await trackOtpRequest(email, next);

        // Generate OTP and send it
        await sendOtp(user.name, email, userType === "user" ? "user-forgot-password-mail" : "seller-forgot-password-mail");

        res.status(200).json({ message: "OTP sent successfully, Please verify your account." });
    } catch (error) {
        next(error);
    }
}

export const verifyForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) throw new ValidationError("Email and OTP are required");

        await verifyOtp(email, otp, next);
        res.status(200).json({ message: "OTP verified. you can now reset your password" });

    } catch (error) {
        next(error);
    }
}