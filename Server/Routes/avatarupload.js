import express from "express";
import upload from "../middleware/upload.js";
import cloudinary from "../utils/cloudinary.js";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import { activeUsers } from "../Socket/state.js";

const router = express.Router();

router.options(/.*/, (req, res) => res.sendStatus(200));

router.post("/upload-avatar", authMiddleware, upload.single("avatar"), async (req, res) => {

    try {

        const userId = req.user.id;

        // 🚫 BLOCK IF USER IN ROOM
        if (activeUsers.has(userId)) {
            return res.status(403).json({
                message: "Cannot update avatar while in a room"
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🔥 Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: "whiteboard_avatars",
                        width: 300,
                        height: 300,
                        crop: "fill",
                        gravity: "face"
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                )
                .end(req.file.buffer);
        });

        // 🧹 Delete old avatar (optional)
        if (user.avatar) {
            const publicId = user.avatar.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(
                `whiteboard_avatars/${publicId}`
            );
        }

        user.avatar = uploadResult.secure_url;
        await user.save();

        res.status(200).json({
            message: "Avatar uploaded successfully",
            avatar: user.avatar
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Avatar upload failed" });
    }
}
);

router.get("/avatar", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user" });
    }
})
export default router;