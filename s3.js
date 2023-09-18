const AWS = require('aws-sdk');
const sharp = require('sharp');
const s3 = new AWS.S3();
const bucketName = 'your-bucket-name';

async function compressAndUploadImage(key) {
    try {
        const params = { Bucket: bucketName, Key: key };
        const response = await s3.getObject(params).promise();
        const imageBuffer = response.Body;
        const format = key.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';

        const compressedImageBuffer = await sharp(imageBuffer)
            .toFormat(format, { quality: 30 })
            .toBuffer();

        await s3.putObject({
            Bucket: bucketName,
            Key: key,
            Body: compressedImageBuffer,
            ContentType: 'image/jpeg',
        }).promise();

        console.log(`Compressed and uploaded ${key}`);
    } catch (error) {
        console.log('error here')
        console.log(error);
        console.error(`Error processing ${key}: ${error.message}`);
    }
}

async function listAllObjects() {
    let continuationToken = null;

    do {
        try {
            const params = {
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            };

            const response = await s3.listObjectsV2(params).promise();
            const objectList = response.Contents;
            let progress = 0;
            for (const obj of objectList) {
                const key = obj.Key;

                console.log(progress, key, progress, 'of', objectList.length)
                if (key.toLowerCase().endsWith('.jpg') || key.toLowerCase().endsWith('.jpeg') || key.toLowerCase().endsWith('.png')) {
                    await compressAndUploadImage(key);
                }
                progress++;
            }
            continuationToken = response.NextContinuationToken;
        } catch (error) {
            console.error(`Error listing objects: ${error.message}`);
            break;
        }
    } while (continuationToken);
}

async function main() {
    try {
        await listAllObjects();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
