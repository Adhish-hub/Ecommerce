const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (filePath) => {
    try{
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "ecommerce-products",
        });

        return{
            url: result.secure_url,
            public_id: result.public_id,
        };
    }catch(error){
        throw error;
    }
};

module.exports = uploadToCloudinary;