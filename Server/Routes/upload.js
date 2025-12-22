import express from "express";
import  cloudinary from  "cloudinary";
import dotenv from  "dotenv";

const router = express.Router();
dotenv.config()

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.options(/.*/, (req, res) => res.sendStatus(200));

router.post("/",async(req,res)=>{
    
})