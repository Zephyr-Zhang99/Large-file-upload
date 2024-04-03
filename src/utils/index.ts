import type { RcFile } from 'antd/es/upload';
import SparkMD5 from 'spark-md5';
// 计算md5值
export function calculateMd5(file: RcFile): Promise<string> {
  return new Promise((resolve) => {
    // 创建一个 FileReader 对象来读取文件
    const reader = new FileReader();
    // // 当文件读取操作完成时触发的事件处理器
    reader.onload = function (e) {
      // 使用 SparkMD5 库计算读取到的 ArrayBuffer 的 MD5 值
      // e.target.result 包含了文件的 ArrayBuffer 数据
      const md5 = SparkMD5.ArrayBuffer.hash(e.target?.result as ArrayBuffer);
      // 将计算得到的 MD5 值传递给 Promise 的 resolve 函数，表示异步操作成功完成
      resolve(md5);
    };
    // 以 ArrayBuffer 的形式读取文件内容 MD5 计算需要二进制数据
    reader.readAsArrayBuffer(file);
  });
}

// 切片
export function sliceFile(file: RcFile, size = 1024 * 1024 * 4) {
  if (file.size >= size) {
    const chunks = [];
    for (let i = 0; i < file.size; i += size) {
      chunks.push(file.slice(i, i + size));
    }
    return chunks;
  } else {
    return [file.slice(0, file.size)];
  }
}

// 上传前
export async function beforeUpload(file: RcFile) {
  const res = await calculateMd5(file);
  console.log(res);
}
type Item = {
  name: string;
  slice: Blob[];
};

// 上传切片
export function uploadFiles({
  chunks,
  fileMd5,
}: {
  chunks: Item[];
  fileMd5: string;
}) {
  chunks.forEach((item: Item) => {
    const list = [];
    for (let i = 0; i < item.slice.length; i++) {
      const formData = new FormData();
      formData.append('index', i);
      formData.append('fileName', item.name);
      formData.append('fileMd5', fileMd5);
      formData.append('file', item.slice[i]); // 写在最后面
      list.push(
        fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData,
        })
      );
      Promise.all(list).then(() => {});
    }
  });
}
// 请求合并
export function merge(file: RcFile, fileMd5: string) {
  // 1. 批量上传 Promise.all [请求,请求,请求]
  // 上传成功通知后端合并文件
  fetch('http://localhost:3000/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileMd5,
    }),
  }).then((res) => {
    console.log(res);
  });
}
