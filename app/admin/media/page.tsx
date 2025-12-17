"use client";

import { useState, useEffect } from 'react';
import { Card, Image as AntImage, Button, Space, message, Modal } from 'antd';

interface MediaFile {
  id: number;
  filename: string;
  url: string;
  url_large: string | null;
  url_medium: string | null;
  url_thumb: string | null;
  width: number | null;
  height: number | null;
}

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<MediaFile | null>(null);

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media?pageSize=1000');
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        // Filter only images and exclude those under 500 pixels
        const imageFiles = result.data.filter((file: any) => {
          const isImage = file.mime_type?.startsWith('image/');
          const hasValidSize = file.width && file.height && file.width >= 500 && file.height >= 500;
          return isImage && hasValidSize;
        });
        setMediaFiles(imageFiles);
      } else {
        setMediaFiles([]);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      setMediaFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDimensions = (width: number | null, height: number | null): string => {
    if (!width || !height) return 'Unknown';
    return `${width} × ${height}px`;
  };

  const calculateMediumDimensions = (originalWidth: number | null, originalHeight: number | null): string => {
    if (!originalWidth || !originalHeight) return 'Unknown';
    
    const shortSide = Math.min(originalWidth, originalHeight);
    let mediumWidth = originalWidth;
    let mediumHeight = originalHeight;
    
    if (shortSide > 500) {
      // Calculate dimensions to make short side 500px
      const ratio = 500 / shortSide;
      mediumWidth = Math.round(originalWidth * ratio);
      mediumHeight = Math.round(originalHeight * ratio);
    }
    // If short side is <= 500, medium = original (no enlargement)
    
    return `${mediumWidth} × ${mediumHeight}px`;
  };

  const handleFixDimensions = async () => {
    try {
      message.loading({ content: 'Fixing missing dimensions...', key: 'fix', duration: 0 });
      const response = await fetch('/api/media/fix-dimensions', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        message.success({ 
          content: `Fixed ${result.fixed} images${result.failed > 0 ? `, ${result.failed} failed` : ''}`, 
          key: 'fix',
          duration: 5,
        });
        fetchMediaFiles(); // Refresh
      } else {
        message.error({ content: result.error || 'Failed to fix dimensions', key: 'fix' });
      }
    } catch (error) {
      message.error({ content: 'Failed to fix dimensions', key: 'fix' });
      console.error('Error fixing dimensions:', error);
    }
  };

  const handleCleanupBroken = async () => {
    try {
      message.loading({ content: 'Cleaning up broken images...', key: 'cleanup', duration: 0 });
      const response = await fetch('/api/media/cleanup-broken', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        message.success({ 
          content: `Removed ${result.removed} broken images and ${result.productReferencesRemoved} product references`, 
          key: 'cleanup',
          duration: 5,
        });
        fetchMediaFiles(); // Refresh
      } else {
        message.error({ content: result.error || 'Failed to cleanup', key: 'cleanup' });
      }
    } catch (error) {
      message.error({ content: 'Failed to cleanup broken images', key: 'cleanup' });
      console.error('Error cleaning up:', error);
    }
  };

  const handleReprocessAll = async () => {
    try {
      message.loading({ content: 'Reprocessing all images with new sizing rules...', key: 'reprocess', duration: 0 });
      const response = await fetch('/api/media/reprocess-all', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        message.success({ 
          content: `Reprocessed ${result.processed} images${result.failed > 0 ? `, ${result.failed} failed` : ''}`, 
          key: 'reprocess',
          duration: 5,
        });
        fetchMediaFiles(); // Refresh
      } else {
        message.error({ content: result.error || 'Failed to reprocess images', key: 'reprocess' });
      }
    } catch (error) {
      message.error({ content: 'Failed to reprocess images', key: 'reprocess' });
      console.error('Error reprocessing:', error);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Media Pool</h1>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={handleFixDimensions}>
            Fix Missing Dimensions
          </Button>
          <Button onClick={handleCleanupBroken} danger>
            Cleanup Broken Images
          </Button>
          <Button onClick={handleReprocessAll} type="primary">
            Reprocess All Images
          </Button>
        </Space>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            Loading images...
          </div>
        ) : mediaFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            No images found
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}
          >
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: 8,
                  background: '#fff',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setPreviewImage(file);
                  setPreviewVisible(true);
                }}
              >
                <AntImage
                  src={file.url_thumb || file.url}
                  alt={file.filename}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 4,
                  }}
                  fallback="/images/placeholder.jpg"
                  preview={false}
                />
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#666',
                    marginTop: 8,
                    fontWeight: 500,
                  }}
                >
                  {formatDimensions(file.width, file.height)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Image Preview"
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setPreviewImage(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setPreviewVisible(false);
            setPreviewImage(null);
          }}>
            Close
          </Button>,
        ]}
        width={900}
        centered
      >
        {previewImage && (
          <div style={{ textAlign: 'center' }}>
            <AntImage
              src={previewImage.url_medium || previewImage.url}
              alt={previewImage.filename}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 4,
              }}
              fallback="/images/placeholder.jpg"
            />
            <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
              <div><strong>Original Dimensions:</strong> {formatDimensions(previewImage.width, previewImage.height)}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                <strong>Medium Size:</strong> {calculateMediumDimensions(previewImage.width, previewImage.height)}
              </div>
              <div style={{ marginTop: 8 }}><strong>Filename:</strong> {previewImage.filename}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
