import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, type UploadProps } from 'antd';
import { RcFile } from 'antd/es/upload';
import {
  beforeUpload,
  calculateMd5,
  merge,
  sliceFile,
  uploadFiles,
} from './utils';

function App() {
  const props: UploadProps = {
    name: 'file',
    multiple: true,
    // 覆盖默认上传行为
    customRequest: () => {
      return false;
    },
    // 上传前
    beforeUpload: beforeUpload,
    async onChange({ file }) {
      const chunks = [];
      chunks.push({
        slice: sliceFile(file.originFileObj as RcFile),
        name: file.name,
      });

      // 计算md5
      const fileMd5: string = await calculateMd5(file.originFileObj as RcFile);
      // 上传切片
      uploadFiles({ chunks, fileMd5 });
      merge(file, fileMd5);
    },
  };
  return (
    <>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Click to Upload</Button>
      </Upload>
    </>
  );
}

export default App;
