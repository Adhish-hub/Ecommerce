const User = require("../models/User");

const Product = require("../models/Product");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");



const addToWishlist = asyncHandler(async (req, res) => {
   
        const productId = req.params.productId;

        const product = await Product.findById(productId);

        if(!product){
           throw new ApiError(
            404, 
            "Product not found."
            );
        }

        const user = await User.findById(req.user._id);

         if (!user) {
           throw new ApiError(
            404, 
            "User not found."
            );
        }

        const alreadyInWishlist = user.wishlist.some(

            (id) => id.toString() === productId
        );

        if(alreadyInWishlist){
            throw new ApiError(400, "Product is already in the wishlist.");
        }

        user.wishlist.push(productId);

        await user.save();

        sendResponse(
            res, 
            200, 
            "Product added to the wishlist.", 
            user.wishlist
        );
   
});

const getWishlist = asyncHandler(async (req, res) => {
    
        const user = await User.findById(req.user._id)
        .populate("wishlist", "name price image category");

         if (!user) {
           throw new ApiError(404, "User not found.");
         }

         sendResponse(
           res,
           200,
           "Wishlist retrieved successfully.",
           user.wishlist,
         );
});


const removeFromWishlist = asyncHandler(async (req, res) => {
   
        const productId = req.params.productId;
        
        const user = await User.findById(req.user._id);

        if (!user) {
          throw new ApiError(404, "User not found.");
        }

        const productExists = user.wishlist.some(
            (id) => id.toString() === productId
        );

        if(!productExists){
            throw new ApiError(404, "Product is not in the wishlist.");
        }

        //the code below is to remove the product
        user.wishlist = user.wishlist.filter(
            (id) => id.toString() !== productId
        );

        await user.save()

         sendResponse(
           res,
           200,
           "Product removed from the wishlist.",
           user.wishlist,
         );
  
});

module.exports = { addToWishlist, getWishlist, removeFromWishlist };