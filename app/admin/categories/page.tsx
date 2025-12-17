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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
    fetchCategories();
  }, []);

  // Set form values when modal opens (add mode only)
  useEffect(() => {
    if (editVisible && !editingCategory) {
      // Add mode - set default values after Form is mounted
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({
          active: true,
          order: categories.length,
        });
      }, 0);
    }
  }, [editVisible, editingCategory, categories.length]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      message.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
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
        form.setFieldsValue({ image: result.data.url });
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
    setEditingCategory(null);
    setEditVisible(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`);
      const result = await response.json();

      if (result.data) {
        const category = result.data;
        setEditingCategory(category);
        setEditVisible(true);
        // Set form values after Form is mounted
        setTimeout(() => {
          form.setFieldsValue({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            image: category.image || '',
            parentId: category.parentId || null,
            order: category.order || 0,
            active: category.active !== undefined ? category.active : true,
          });
        }, 0);
      } else {
        message.error('Category not found');
      }
    } catch (error) {
      message.error('Failed to load category for editing');
      console.error('Error fetching category:', error);
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields(['name', 'slug']);
      setSaving(true);

      const values = form.getFieldsValue();
      
      // Generate slug from name if not provided
      const slug = values.slug || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const categoryData = {
        name: values.name,
        slug: slug,
        description: values.description || null,
        image: values.image || null,
        parentId: values.parentId || null,
        order: values.order || 0,
        active: values.active !== undefined ? values.active : true,
      };

      if (editingCategory) {
        // Update
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });

        if (response.ok) {
          message.success('Category updated successfully');
          setEditVisible(false);
          setEditingCategory(null);
          fetchCategories();
        } else {
          const error = await response.json();
          message.error(error.error || 'Failed to update category');
        }
      } else {
        // Create
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });

        if (response.ok) {
          message.success('Category created successfully');
          setEditVisible(false);
          setEditingCategory(null);
          fetchCategories();
        } else {
          const error = await response.json();
          message.error(error.error || 'Failed to create category');
        }
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fix the form errors');
      } else {
        message.error('Failed to save category');
        console.error('Error saving category:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('Category deleted successfully');
        fetchCategories();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to delete category');
      }
    } catch (error) {
      message.error('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return;

    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const currentCategory = categories[categoryIndex];
    const targetCategory = categories[newIndex];

    try {
      // Update both categories' order
      await Promise.all([
        fetch(`/api/categories/${currentCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: targetCategory.order }),
        }),
        fetch(`/api/categories/${targetCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentCategory.order }),
        }),
      ]);

      message.success('Order updated successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to update order');
      console.error('Error updating order:', error);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, record: Category) => (
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
            disabled={record.order === categories.length - 1}
            onClick={() => handleMoveOrder(record.id, 'down')}
            title="Move down"
          />
        </Space>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 120,
      render: (image: string | null) => (
        <AntImage
          src={image || '/images/placeholder.jpg'}
          alt="Category"
          width={100}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="/images/placeholder.jpg"
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Parent',
      dataIndex: 'parentId',
      key: 'parent',
      width: 150,
      render: (parentId: string | null) => getParentName(parentId),
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
      render: (_: any, record: Category) => (
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
              title="Delete category"
              description="Are you sure you want to delete this category?"
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
              Add Category
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Edit/Create Modal */}
      <Modal
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add Category'}
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingCategory(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditVisible(false);
              setEditingCategory(null);
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
            {editingCategory ? 'Update' : 'Create'}
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            active: true,
            order: 0,
          }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
            tooltip="URL-friendly version of the name (auto-generated if left empty)"
          >
            <Input placeholder="category-slug" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea
              rows={4}
              placeholder="Optional description"
            />
          </Form.Item>

          <Form.Item
            label="Image"
            name="image"
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
                            form.setFieldsValue({ image: result.data.url });
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
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.image !== currentValues.image}>
                {({ getFieldValue }) => {
                  const image = getFieldValue('image');
                  return image ? (
                    <AntImage
                      src={image}
                      alt="Category preview"
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Parent Category"
                name="parentId"
                tooltip="Optional: Select a parent category to create a subcategory"
              >
                <Select
                  placeholder="Select parent category (optional)"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(category => (
                      <Select.Option key={category.id} value={category.id}>
                        {category.name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Order"
                name="order"
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Active"
                name="active"
                valuePropName="checked"
              >
                <Switch />
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
                      form.setFieldsValue({ image: file.url });
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
