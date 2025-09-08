import { diskStorage } from 'multer';
import * as fs from 'fs';
import { Request } from 'express';

const imageUploadPath = './uploads/images';
const docsUploadPath = './uploads/docs';

export const getMulterConfig = () => ({
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(docsUploadPath)) {
        fs.mkdirSync(docsUploadPath, { recursive: true });
      }
      cb(null, docsUploadPath);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      cb(null, `${timestamp}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = /\.(pdf|doc|docx)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(
        new Error('Seuls les fichiers PDF, DOC, DOCX sont autorisés'),
        false,
      );
    }
    cb(null, true);
  },
});

export const getImageMulterConfig = () => ({
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(imageUploadPath)) {
        fs.mkdirSync(imageUploadPath, { recursive: true });
      }
      cb(null, imageUploadPath);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      cb(null, `${timestamp}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(
        new Error(
          'Seuls les fichiers JPG, JPEG, PNG, GIF, WEBP sont autorisés',
        ),
        false,
      );
    }
    cb(null, true);
  },
});
