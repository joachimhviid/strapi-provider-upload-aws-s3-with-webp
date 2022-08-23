"use strict";

/**
 * Module dependencies
 */

const AWS = require("aws-sdk");
const sharp = require("sharp");

module.exports = {
  init(config) {
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...config,
    });

    const upload = async (file, customParams = {}) => {
      /* Convert to webp */
      const webP = await sharp(file.stream.path)
        .webp({ lossless: true })
        .toBuffer()

      return new Promise((resolve, reject) => {
        // upload file on S3 bucket
        const path = file.path ? `${file.path}/` : ''
        S3.upload(
          {
            Key: `${path}${file.hash}${file.ext}`,
            Body: file.stream || Buffer.from(file.buffer, 'binary'),
            ACL: 'public-read',
            ContentType: file.mime,
            ...customParams
          },
          (err, data) => {
            if (err) {
              return reject(err)
            }

            // set the bucket file url
            file.url = data.Location

            resolve()
          }
        )

        S3.upload(
          {
            Key: `${path}${file.hash}.webp`,
            Body: Buffer.from(webP.buffer, "binary"),
            ACL: 'public-read',
            ContentType: file.mime,
            ...customParams
          },
          (err, data) => {
            if (err) {
              return reject(err)
            }

            // set the bucket file url
            file.url = data.Location

            resolve()
          }
        )
      })
    }

    return {
      uploadStream(file, customParams = {}) {
        return upload(file, customParams);
      },
      upload(file, customParams = {}) {
        return upload(file, customParams);
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = file.path ? `${file.path}/` : '';
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
          S3.deleteObject(
            {
              Key: `${path}${file.hash}.webp`,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};
