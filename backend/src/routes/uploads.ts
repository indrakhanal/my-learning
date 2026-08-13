import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/.test(file.mimetype))
});

function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  const isPdf = file.mimetype === "application/pdf";
  const resourceType = isPdf ? "raw" : "image";
  
  return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder,
      public_id: isPdf ? `${randomUUID()}.pdf` : randomUUID(),
      resource_type: resourceType as "image" | "raw",
      use_filename: false,
      unique_filename: true,
      overwrite: false
    }, (error: unknown, result?: { secure_url: string; public_id: string }) => {
      if (error || !result) return reject(error instanceof Error ? error : new Error("Cloudinary upload returned no result"));
      resolve({ secureUrl: result.secure_url, publicId: result.public_id });
    });
    stream.end(file.buffer);
  });
}

export const uploadsRouter = Router();

// Note uploads
uploadsRouter.post("/:noteId", requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_URL) return res.status(503).json({ error: "Cloudinary storage is not configured" });
    if (!req.file) return res.status(400).json({ error: "A supported image or PDF is required" });
    const note = await prisma.note.findUnique({ where: { id: String(req.params.noteId) } });
    if (!note) return res.status(404).json({ error: "Note not found" });
    const asset = await uploadToCloudinary(req.file, `learning-notes/${note.id}`);
    res.status(201).json(await prisma.attachment.create({
      data: {
        noteId: note.id,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        key: asset.publicId,
        url: asset.secureUrl,
        kind: req.file.mimetype.startsWith("image/") ? "IMAGE" : "FILE"
      }
    }));
  } catch (error) { next(error); }
});

// Chapter uploads
uploadsRouter.post("/chapter/:chapterId", requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_URL) return res.status(503).json({ error: "Cloudinary storage is not configured" });
    if (!req.file) return res.status(400).json({ error: "A supported image or PDF is required" });
    const chapter = await prisma.chapter.findUnique({ where: { id: String(req.params.chapterId) } });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    const asset = await uploadToCloudinary(req.file, `learning-notes/chapters/${chapter.id}`);
    res.status(201).json(await prisma.chapterAttachment.create({
      data: {
        chapterId: chapter.id,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        key: asset.publicId,
        url: asset.secureUrl,
        kind: req.file.mimetype.startsWith("image/") ? "IMAGE" : "FILE"
      }
    }));
  } catch (error) { next(error); }
});
