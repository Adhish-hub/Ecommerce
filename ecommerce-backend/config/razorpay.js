const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
module.exports = razorpay;

// https://claude.ai/share/ef19221c-b96d-4a45-8148-7ed77067bcf3