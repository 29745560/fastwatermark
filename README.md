# fastwatermark
一键批量添加图片水印

`photos` 是图片输入文件夹，可在app.js中修改
`output` 是图片输出文件夹，可在app.js中修改

> run

`node app.js`

> 更换水印图片

文件夹根目录下 `water.png` 替换即可

> 已知问题

EXIF图片信息错误可能会导致图片错误的旋转，目前使用 `jpeg-autorotate` 来临时修正这个问题