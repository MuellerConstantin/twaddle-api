import path from "path";
import multer from 'multer';
import multerS3 from 'multer-s3';
import env from '../config/env';
import s3 from '../config/s3';

export const imageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: env.s3.bucket,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname, contenType: file.mimetype});
    },
    key: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }

    cb(null, true);
  },
})
