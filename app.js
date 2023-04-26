// 图片列表
let fs = require('fs'); //引用文件系统模块
let Path = require('path');
let Jimp = require('jimp');
let jo = require('jpeg-autorotate');

const INPUT_PATH = './photos/';
const OUTPUT_PATH = './output/';

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// 获取文件夹下的所有文件
function readFileList(path, fileList) {
    let files = fs.readdirSync(path);
    files.forEach(function (name, index) {
        let stat = fs.statSync(path + name);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + name + '/', fileList);
        } else {
            if (name !== '.DS_Store' && name !== 'README.md') {
                let obj = {}; //定义一个对象存放文件的路径和名字
                obj.path = path; //路径
                obj.filename = name; //名字
                fileList.push(obj);
            }
        }
    });
}
function getFileList(p) {
    let fileList = [];
    readFileList(p, fileList);
    return fileList;
}
let photos = getFileList(INPUT_PATH);
console.log('图片列表===', photos);
console.log('图片数量===', photos.length);

// true=按照比例来,false=按照尺寸来
const LOGO_RATIO = true;
const LOGO_RATIO_VALUE = 1 / 8;
async function run(index) {
    console.log('> 开始处理图片:', index);
    const picData = photos[index];
    const dirPath = picData.path;
    const fileName = picData.filename;
    const oldFilePath = Path.resolve(__dirname, dirPath, fileName);
    // 读取图片
    let image = await Jimp.read(oldFilePath);
    if (
        image._exif &&
        image._exif.tags &&
        image._exif.tags.Orientation &&
        image._exif.tags.ExifImageWidth !== image.bitmap.width &&
        image._exif.tags.ExifImageHeight !== image.bitmap.height
    ) {
        // 修正图片exif数据错误问题
        const oldFile = fs.readFileSync(oldFilePath);
        let { buffer } = await jo.rotate(oldFile, {}); //{ quality: 10 }
        image = await Jimp.read(buffer);
    }

    // 读取水印
    let logo = await Jimp.read('./water.png');
    if (LOGO_RATIO) {
        // 水印适配处理
        const logoWidth = image.bitmap.width * LOGO_RATIO_VALUE;
        logo = logo.resize(logoWidth, Jimp.AUTO);
    }
    let X = image.bitmap.width - logo.bitmap.width - 60;
    let Y = image.bitmap.height - logo.bitmap.height - 60;

    // 新保存的文件夹地址
    const saveDirPath = Path.resolve(__dirname, OUTPUT_PATH, dirPath.replace('./', ''));
    // 判断是否存在，若不存在则创建
    try {
        fs.statSync(saveDirPath);
    } catch (error) {
        fs.mkdirSync(saveDirPath, { recursive: true });
    }
    const newFilePath = saveDirPath + '/' + fileName;
    image
        .composite(
            logo,
            X,
            Y,
            [
                {
                    mode: Jimp.BLEND_SOURCE_OVER,
                    opacitySource: 1,
                    opacityDest: 1,
                },
            ],
            function () {
                console.log('图片合成Success');
            }
        )
        .write(newFilePath, err => {
            if (err) console.error(err);
            else console.log('@_水印添加成功! 编号:%s, 地址:%s\n', index, newFilePath);
        });
}

(async function () {
    for (let i = 0, len = photos.length; i < len; i++) {
        await run(i);
        await sleep(200);
    }
})();
