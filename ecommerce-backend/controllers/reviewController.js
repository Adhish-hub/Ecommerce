const Product = require("../models/Product");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");

const addProductReview = asyncHandler(async (req, res) => {
    
        const { rating, comment } = req.body;

        const product = await Product.findById(req.params.id)

        if(!product){
            throw new ApiError(
                404, 
                "Product not found."
            );
        }

        const alreadyReviewed = product.reviews.find(
            (review) => review.user.toString() === req.user._id.toString()
        );

        if(alreadyReviewed){
            throw new ApiError(
                400, 
                "You have already reviewed this product."
            );
        }

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment,
        };

        product.reviews.push(review);

        product.numReviews = product.reviews.length;

        const totalRating = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        );

        product.averageRating = totalRating / product.reviews.length;

        await product.save();

        sendResponse(
            res, 
            201, 
            "Review added successfully.", 
            product
        );
  
});


const getProductReviews = asyncHandler(async (req, res) => {
    
        const product = await Product.findById(req.params.id).select("name reviews numReviews averageRating");

        if(!product){
            throw new ApiError(
                404, 
                "Product not found."
            );
        }

         sendResponse(res, 200, "Product reviews retrieved successfully.", {
           reviews: product.reviews,
           numReviews: product.numReviews,
           averageRating: product.averageRating,
         });
  
});



const updateProductReview = asyncHandler(async (req, res) => {
   
        const { rating, comment } = req.body;

        const product = await Product.findById(req.params.id);

        if(!product){
           throw new ApiError(
            404, 
            "Product not found."
        );
        }

        const review = product.reviews.id(req.params.reviewId);

        if(!review){
            throw new ApiError(
                404, 
                "Review not found."
            );
        }

        if(
            review.user.toString() !== req.user._id.toString()
        ){
            throw new ApiError(
              403,
              "You are not allowed to update this review.",
            );
        }

        if(rating !== undefined){
            review.rating = Number(rating);
        }

        if(comment !== undefined){
            review.comment = comment;
        }

        const totalRating = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        );

        product.numReviews = product.reviews.length;

        product.averageRating = product.numReviews > 0 ? totalRating / product.numReviews : 0;

        await product.save();

        sendResponse(
            res, 
            200, 
            "Product review updated successfully.", 
            product
        );
  
});


const deleteProductReview = asyncHandler(async (req, res) => {
   
        const product = await Product.findById(req.params.id);

        if(!product){
            throw new ApiError(
                404, 
                "Product not found."
            );
        }

        const review = product.reviews.id(req.params.reviewId);
        
        if(!review){
            throw new ApiError(
                404, 
                "Review not found."
            );
        }

        if(
            review.user.toString() !==
            req.user._id.toString() &&
            req.user.role !== "admin"
        ){
            throw new ApiError(
              403,
              "You are not allowed to delete this review.",
            );
        }

        product.reviews.pull(req.params.reviewId);

        product.numReviews = product.reviews.length;

        const totalRating = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        );

        product.averageRating = product.numReviews > 0 ? totalRating / product.numReviews : 0;

        await product.save();

        sendResponse(
            res, 
            200, 
            "Review deleted successfully.", 
            product
        );
});


module.exports = { addProductReview, getProductReviews, updateProductReview, deleteProductReview };