"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Upload,
  message,
  Space,
  Slider,
  Card,
  Image as AntImage,
} from 'antd';
import {
  UploadOutlined,
  FolderOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import type { UploadFile } from 'antd/es/upload/interface';

interface MediaFile {
  id: number;
  filename: string;
  url: string;
  url_large: string | null;
  url_medium: string | null;
  url_thumb: string | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
}

interface MediaPickerProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (mediaId: number) => void;
  title?: string;
}

export default function MediaPicker({
  open,
  onCancel,
  onSelect,
  title = 'Select Media',
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState('library');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Crop state
  const [cropVisible, setCropVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && activeTab === 'library') {
      fetchMediaFiles();
    }
  }, [open, activeTab]);

  const fetchMediaFiles = async () => {
    setLoadingMedia(true);
    try {
      const response = await fetch('/api/media?pageSize=100');
      const result = await response.json();
      if (result.data) {
        // Filter only images
        const imageFiles = result.data.filter((file: any) =>
          file.mime_type?.startsWith('image/')
        );
        setMediaFiles(imageFiles);
      }
    } catch (error) {
      message.error('Failed to load media library');
      console.error('Error fetching media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
      setOriginalFile(file);
      setCropVisible(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels || !originalFile) {
      message.error('Missing crop data');
      return;
    }

    setUploading(true);
    try {
      message.loading({ content: 'Uploading cropped image...', key: 'upload' });
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type,
      });

      const formData = new FormData();
      formData.append('file', croppedFile);

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.data && result.data.id) {
        message.success({ content: 'Image uploaded successfully', key: 'upload' });
        setCropVisible(false);
        setImageToCrop(null);
        setOriginalFile(null);
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        // Refresh media library and select the new image
        await fetchMediaFiles();
        onSelect(result.data.id);
        onCancel();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      message.error({ content: error.message || 'Failed to upload image', key: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFromLibrary = (mediaId: number) => {
    onSelect(mediaId);
    onCancel();
  };

  const tabItems = [
    {
      key: 'library',
      label: 'Select from Library',
      children: (
        <div>
          {loadingMedia ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              Loading media library...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 16,
                maxHeight: 500,
                overflowY: 'auto',
              }}
            >
              {mediaFiles.length > 0 ? (
                mediaFiles.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: 8,
                      padding: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleSelectFromLibrary(file.id)}
                  >
                    <AntImage
                      src={file.url_thumb || file.url_medium || file.url}
                      alt={file.filename}
                      width={100}
                      height={100}
                      style={{
                        objectFit: 'cover',
                        borderRadius: 4,
                        display: 'block',
                        width: '100%',
                        height: 100,
                      }}
                      fallback="/images/placeholder.jpg"
                    />
                    <div
                      style={{
                        fontSize: 11,
                        color: '#666',
                        marginTop: 8,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.filename}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#999' }}>
                  No media files found. Upload images first.
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'upload',
      label: 'Upload New',
      children: (
        <div>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card>
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  size="large"
                  type="primary"
                >
                  Choose Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                />
                <div style={{ fontSize: 12, color: '#999' }}>
                  Select an image file to upload and crop
                </div>
              </Space>
            </Card>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={title}
        open={open}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Modal>

      {/* Crop Modal */}
      <Modal
        title="Crop Image"
        open={cropVisible}
        onCancel={() => {
          setCropVisible(false);
          setImageToCrop(null);
          setOriginalFile(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCropVisible(false);
            setImageToCrop(null);
            setOriginalFile(null);
          }}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploading}
            onClick={handleCropAndUpload}
          >
            Upload Cropped Image
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        {imageToCrop && (
          <div style={{ position: 'relative', height: 400, background: '#000' }}>
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Space orientation="vertical" style={{ width: '100%' }} size="small">
            <div>
              <span>Zoom: </span>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={setZoom}
                style={{ width: 200, display: 'inline-block', marginLeft: 16 }}
              />
            </div>
          </Space>
        </div>
      </Modal>
    </>
  );
}

