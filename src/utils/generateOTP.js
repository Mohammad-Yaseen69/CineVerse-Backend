export const generateOTP = () => {
    let otp = Math.floor(1000 + Math.random() * 9000);
    return otp;
}