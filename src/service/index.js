
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import SparkMD5 from 'spark-md5'
// 1. 初始化multer,设置存储策略
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const catalogue = req.body.fileName.split('.')[0]
        // 判断目录是否存在
        if (!fs.existsSync(`uploads/${catalogue}`)) {
            // 不存在创建目录
            const filePath = path.join(process.cwd(), `uploads/${catalogue}`)
            fs.mkdirSync(filePath, { recursive: true })
        }
        // 写入分片
        cb(null, `uploads/${catalogue}`) // 指定文件路径
    },
    filename: (req, file, cb) => {
        cb(null, `${req.body.index}&${req.body.fileName}`) // 文件命名
    }
})
// 创建 multer实例
const upload = multer({ storage })
const app = express()
app.use(cors())
app.use(express.json())
const MD5 = new SparkMD5.ArrayBuffer();
// 使用 upload.single('file') 中间件来处理文件上传
app.post('/upload', upload.single('file'), (req, res) => {
    res.send({ msg: '文件上传成功', status: true })
    // res.send('文件上传成功')
})

// 合并
app.post('/merge', async (req, res) => {
    const parts = req.body.fileName.split('.')
    // 文件名
    const fileName = parts.slice(0, -1).join('.')
    // 后缀名
    const suffixName = parts.pop()
    // const catalogue = req.body.fileName.split('.')[0]
    // 1. 读取目录
    const uploadDir = path.join(process.cwd(), `uploads/${fileName}`)
    // 2. 读取目录下的文件切片
    const fileSlicing = fs.readdirSync(uploadDir)
    // 3. 排序
    fileSlicing.sort((a, b) => a.split('&')[0] - b.split('&')[0])
    // 4. 合并写入目录
    // 4.1 判断合并目录是否存在
    if (!fs.existsSync(`combinedCatalog/${fileName}`)) {
        // 4.2 不存在创建目录
        const filePath = path.join(process.cwd(), `combinedCatalog/${fileName}`)
        fs.mkdirSync(filePath, { recursive: true })
    }
    //合并文件目录
    const mergePath = path.join(process.cwd(), 'combinedCatalog', `${fileName}`)
    // 判断文件是否已经存在
    if (fs.existsSync(`${mergePath}` + `/${fileName}.${suffixName}`)) {
        // 删除分片目录
        fs.rm(uploadDir, { recursive: true, force: true }, (err) => {
            if (err) console.log(err);
        })
    } else {
        fileSlicing.forEach(item => {
            // 合并文件
            fs.appendFileSync(`${mergePath}` + `/${fileName}.${suffixName}`, fs.readFileSync(path.join(uploadDir, item)))
        });
        // 删除分片目录
        fs.rm(uploadDir, { recursive: true, force: true }, (err) => {
            if (err) console.log(err);
        })
        // 计算md5
        const fileMd5 = await calculateMd5(`${mergePath}` + `/${fileName}.${suffixName}`)
        console.log(fileMd5);
        if (fileMd5 === req.body.fileMd5) {
            res.status(200).send('文件合并成功')
        } else {
            res.status(500).send('文件合并失败')
        }
    }
})
// 计算md5
async function calculateMd5(file) {
    // return new Promise(async (resolve) => {
    //     const readStream = fs.createReadStream(file)
    //     for await (const chunk of readStream) {
    //         MD5.append(chunk);
    //     }
    //     const md5Hash = MD5.end()
    //     resolve(md5Hash)
    // })
    const readStream = fs.createReadStream(file)
    for await (const chunk of readStream) {
        MD5.append(chunk);
    }
    const md5Hash = MD5.end()
    // resolve(md5Hash)
    return md5Hash
}

app.listen(3000, () => {
    console.log('http://localhost:3000');
})