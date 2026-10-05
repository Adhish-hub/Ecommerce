const multer = require("multer");

const path = require("path");

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/");
    },

    filename: function(req, file, cb){
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(
            null,
            uniqueName + path.extname(file.originalname)
        );
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|webp/;

    const isValidExt = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    
    const isValidMime = allowedTypes.test(file.mimetype);

    if(isValidExt && isValidMime){
        cb(null, true);
    }else{
        cb(new Error("Only images files are allowed."))
    }
};


const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 2 * 1024 * 1024, //2mb
    },
});

module.exports = upload;
