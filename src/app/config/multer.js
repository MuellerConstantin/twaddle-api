import path from "path";
import multer from "multer";
import env from "./env";

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.resolve(env.uploads.path));
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.uploads.limits.fileSize,
  },
});

export default upload;
