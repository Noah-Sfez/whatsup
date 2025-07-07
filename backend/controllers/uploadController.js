const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const uploadController = {
    // Upload d'image
    uploadImage: async (req, res) => {
        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: "No image file provided" });
            }

            const originalPath = req.file.path;
            const optimizedPath = path.join(
                path.dirname(originalPath),
                "optimized-" + path.basename(originalPath)
            );

            // Optimiser l'image avec Sharp
            await sharp(originalPath)
                .resize(800, 600, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 80 })
                .toFile(optimizedPath);

            // Supprimer l'original
            fs.unlinkSync(originalPath);

            const imageUrl = `/uploads/images/optimized-${path.basename(
                originalPath,
                path.extname(originalPath)
            )}.jpg`;

            res.json({
                success: true,
                imageUrl: imageUrl,
                originalName: req.file.originalname,
                size: fs.statSync(optimizedPath).size,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = uploadController;
