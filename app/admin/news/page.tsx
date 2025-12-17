"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Image as AntImage,
  Tag,
  Modal,
  Popconfirm,
  message,
  Input,
  Card,
  Row,
  Col,
  Form,
  Switch,
  Select,
  Slider,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UploadOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

const { TextArea } = Input;

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  featuredImage: string;
  excerpt: string | null;
  content: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  order: number;
  active: boolean;
  publishStatus: string;
  publishDate: string | null;
  author: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  
  // Crop state
  const [cropVisible, setCropVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [enableCrop, setEnableCrop] = useState(true);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  // Set form values when modal opens (add mode only)
  useEffect(() => {
    if (editVisible && !editingArticle) {
      // Add mode - set default values after Form is mounted
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({
          active: true,
          order: articles.length,
          publishStatus: 'draft',
        });
      }, 0);
    }
  }, [editVisible, editingArticle, articles.length]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/news?pageSize=100');
      const result = await response.json();
      console.log('📰 News API response:', result);
      if (result.data && Array.isArray(result.data)) {
        console.log('📰 Setting articles:', result.data.length);
        setArticles(result.data);
      } else {
        console.warn('📰 No data or invalid format:', result);
        setArticles([]);
      }
    } catch (error) {
      message.error('Failed to fetch news articles');
      console.error('Error fetching news articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Crop helper functions
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
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

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels || !originalFile) {
      message.error('Missing crop data');
      return;
    }

    setUploadingImage(true);
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

      if (result.data && result.data.url) {
        form.setFieldsValue({ featuredImage: result.data.url });
        message.success({ content: 'Image cropped and uploaded successfully', key: 'upload' });
        setCropVisible(false);
        setImageToCrop(null);
        setOriginalFile(null);
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      message.error({ content: error.message || 'Failed to upload cropped image', key: 'upload' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = () => {
    setEditingArticle(null);
    setEditVisible(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/news/${id}`);
      const result = await response.json();

      if (result.data) {
        const article = result.data;
        setEditingArticle(article);
        setEditVisible(true);
        // Set form values after Form is mounted
        setTimeout(() => {
          form.setFieldsValue({
            title: article.title || '',
            slug: article.slug || '',
            subtitle: article.subtitle || '',
            featuredImage: article.featuredImage || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            ctaText: article.ctaText || '',
            ctaLink: article.ctaLink || '',
            order: article.order || 0,
            active: article.active !== undefined ? article.active : true,
            publishStatus: article.publishStatus || 'draft',
            author: article.author || '',
          });
        }, 0);
      } else {
        message.error('News article not found');
      }
    } catch (error) {
      message.error('Failed to load news article for editing');
      console.error('Error fetching news article:', error);
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields(['title', 'slug', 'featuredImage']);
      setSaving(true);

      const values = form.getFieldsValue();
      
      // Generate slug from title if not provided
      const slug = values.slug || values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const articleData = {
        title: values.title,
        slug: slug,
        subtitle: values.subtitle || null,
        featuredImage: values.featuredImage,
        excerpt: values.excerpt || null,
        content: values.content || null,
        ctaText: values.ctaText || null,
        ctaLink: values.ctaLink || null,
        order: values.order || 0,
        active: values.active !== undefined ? values.active : true,
        publishStatus: values.publishStatus || 'draft',
        author: values.author || null,
      };

      if (editingArticle) {
        // Update
        const response = await fetch(`/api/news/${editingArticle.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        });

        if (response.ok) {
          message.success('News article updated successfully');
          setEditVisible(false);
          setEditingArticle(null);
          fetchArticles();
        } else {
          const error = await response.json();
          message.error(error.error || 'Failed to update news article');
        }
      } else {
        // Create
        const response = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        });

        if (response.ok) {
          message.success('News article created successfully');
          setEditVisible(false);
          setEditingArticle(null);
          fetchArticles();
        } else {
          const error = await response.json();
          message.error(error.error || 'Failed to create news article');
        }
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fix the form errors');
      } else {
        message.error('Failed to save news article');
        console.error('Error saving news article:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('News article deleted successfully');
        fetchArticles();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to delete news article');
      }
    } catch (error) {
      message.error('Failed to delete news article');
      console.error('Error deleting news article:', error);
    }
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    const articleIndex = articles.findIndex(a => a.id === id);
    if (articleIndex === -1) return;

    const newIndex = direction === 'up' ? articleIndex - 1 : articleIndex + 1;
    if (newIndex < 0 || newIndex >= articles.length) return;

    const currentArticle = articles[articleIndex];
    const targetArticle = articles[newIndex];

    try {
      // Update both articles' order
      await Promise.all([
        fetch(`/api/news/${currentArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: targetArticle.order }),
        }),
        fetch(`/api/news/${targetArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentArticle.order }),
        }),
      ]);

      message.success('Order updated successfully');
      fetchArticles();
    } catch (error) {
      message.error('Failed to update order');
      console.error('Error updating order:', error);
    }
  };

  const columns: ColumnsType<NewsArticle> = [
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, record: NewsArticle) => (
        <Space>
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            size="small"
            disabled={record.order === 0}
            onClick={() => handleMoveOrder(record.id, 'up')}
            title="Move up"
          />
          <span>{order}</span>
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            size="small"
            disabled={record.order === articles.length - 1}
            onClick={() => handleMoveOrder(record.id, 'down')}
            title="Move down"
          />
        </Space>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'featuredImage',
      key: 'image',
      width: 120,
      render: (image: string) => (
        <AntImage
          src={image || '/images/placeholder.jpg'}
          alt="News article"
          width={100}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="/images/placeholder.jpg"
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Subtitle',
      dataIndex: 'subtitle',
      key: 'subtitle',
      ellipsis: true,
      width: 200,
      render: (text: string | null) => text || '-',
    },
    {
      title: 'CTA',
      key: 'cta',
      width: 150,
      render: (_: any, record: NewsArticle) => (
        <div>
          {record.ctaText && (
            <div>
              <Tag color="blue">{record.ctaText}</Tag>
            </div>
          )}
          {record.ctaLink && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {record.ctaLink}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: NewsArticle) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
            size="small"
            title="Edit"
          />
          {!record.active && (
            <Popconfirm
              title="Delete news article"
              description="Are you sure you want to delete this news article?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
              okType="danger"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                title="Delete"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add News Article
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Edit/Create Modal */}
      <Modal
        title={editingArticle ? `Edit News Article: ${editingArticle.title}` : 'Add News Article'}
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingArticle(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditVisible(false);
              setEditingArticle(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            onClick={handleSave}
          >
            {editingArticle ? 'Update' : 'Create'}
          </Button>,
        ]}
        width={900}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            active: true,
            order: 0,
            publishStatus: 'draft',
          }}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="News article title" />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
            tooltip="URL-friendly version of the title (auto-generated if left empty)"
          >
            <Input placeholder="news-article-slug" />
          </Form.Item>

          <Form.Item
            label="Subtitle"
            name="subtitle"
          >
            <Input placeholder="Optional subtitle" />
          </Form.Item>

          <Form.Item
            label="Featured Image"
            name="featuredImage"
            rules={[{ required: true, message: 'Please upload an image' }]}
          >
            <div>
              <Space style={{ marginBottom: 16 }}>
                <Switch
                  checked={enableCrop}
                  onChange={setEnableCrop}
                  checkedChildren="Crop"
                  unCheckedChildren="No Crop"
                />
                {enableCrop && (
                  <Select
                    value={aspectRatio}
                    onChange={(value) => setAspectRatio(value)}
                    placeholder="Aspect Ratio (Free if empty)"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Select.Option value={1}>1:1 (Square)</Select.Option>
                    <Select.Option value={4/3}>4:3</Select.Option>
                    <Select.Option value={16/9}>16:9</Select.Option>
                    <Select.Option value={3/4}>3:4 (Portrait)</Select.Option>
                    <Select.Option value={9/16}>9:16 (Vertical)</Select.Option>
                  </Select>
                )}
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        if (enableCrop) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImageToCrop(reader.result as string);
                            setOriginalFile(file);
                            setCropVisible(true);
                          };
                          reader.readAsDataURL(file);
                          return;
                        }

                        // Upload directly
                        try {
                          message.loading({ content: 'Uploading image...', key: 'upload' });
                          const formData = new FormData();
                          formData.append('file', file);
                          const response = await fetch('/api/media', {
                            method: 'POST',
                            body: formData,
                          });
                          const result = await response.json();
                          if (result.data && result.data.url) {
                            form.setFieldsValue({ featuredImage: result.data.url });
                            message.success({ content: 'Image uploaded successfully', key: 'upload' });
                          } else {
                            message.error({ content: result.error || 'Failed to upload image', key: 'upload' });
                          }
                        } catch (error) {
                          message.error({ content: 'Failed to upload image', key: 'upload' });
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  Upload
                </Button>
                <Button
                  icon={<FolderOutlined />}
                  onClick={async () => {
                    setMediaLibraryVisible(true);
                    setLoadingMedia(true);
                    try {
                      const response = await fetch('/api/media?pageSize=100');
                      const result = await response.json();
                      if (result.data) {
                        setMediaFiles(result.data);
                      }
                    } catch (error) {
                      message.error('Failed to load media library');
                    } finally {
                      setLoadingMedia(false);
                    }
                  }}
                >
                  Load from Media
                </Button>
              </Space>
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.featuredImage !== currentValues.featuredImage}>
                {({ getFieldValue }) => {
                  const featuredImage = getFieldValue('featuredImage');
                  return featuredImage ? (
                    <AntImage
                      src={featuredImage}
                      alt="Featured preview"
                      width={300}
                      height={200}
                      style={{ objectFit: 'cover', borderRadius: 4, marginTop: 8 }}
                      fallback="/images/placeholder.jpg"
                    />
                  ) : null;
                }}
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item
            label="Excerpt"
            name="excerpt"
            tooltip="Short summary (shown in listings)"
          >
            <TextArea
              rows={3}
              placeholder="Brief summary of the article"
            />
          </Form.Item>

          <Form.Item
            label="Content"
            name="content"
            tooltip="Full article content (for detail page)"
          >
            <TextArea
              rows={8}
              placeholder="Full article content..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="CTA Text"
                name="ctaText"
                tooltip="Button text (optional - if not set, will link to detail page)"
              >
                <Input placeholder="Button text (e.g., Read More)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="CTA Link"
                name="ctaLink"
                tooltip="Custom link (optional - if not set, will link to detail page)"
              >
                <Input placeholder="/blog/article-slug or https://example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Order"
                name="order"
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Active"
                name="active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Author"
                name="author"
              >
                <Input placeholder="Author name" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Crop Modal */}
      <Modal
        title="Crop Image"
        open={cropVisible}
        onCancel={() => {
          setCropVisible(false);
          setImageToCrop(null);
          setOriginalFile(null);
          setCroppedAreaPixels(null);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCropVisible(false);
              setImageToCrop(null);
              setOriginalFile(null);
              setCroppedAreaPixels(null);
              setCrop({ x: 0, y: 0 });
              setZoom(1);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploadingImage}
            onClick={handleCropAndUpload}
            disabled={!croppedAreaPixels}
          >
            Upload Cropped Image
          </Button>,
        ]}
        width={800}
      >
        {imageToCrop && (
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 400,
                background: '#f0f0f0',
                marginBottom: 16,
              }}
            >
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio || undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                  },
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Zoom:</label>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={setZoom}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Media Library Modal */}
      <Modal
        title="Media Library"
        open={mediaLibraryVisible}
        onCancel={() => setMediaLibraryVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMediaLibraryVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
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
              mediaFiles
                .filter((file: any) => file.mime_type?.startsWith('image/'))
                .map((file: any) => (
                  <div
                    key={file.id}
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: 8,
                      padding: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      form.setFieldsValue({ featuredImage: file.url });
                      message.success('Image selected');
                      setMediaLibraryVisible(false);
                    }}
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
      </Modal>
    </div>
  );
}
