"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Image as AntImage,
  Tag,
  Modal,
  Descriptions,
  Popconfirm,
  message,
  Input,
  Select,
  Card,
  Row,
  Col,
  Form,
  InputNumber,
  Switch,
  Tabs,
  Upload,
  Checkbox,
  Slider,
  Progress,
  Tooltip,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteFilled,
  UploadOutlined,
  FolderOutlined,
  DragOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { calculateSEOScore } from '@/lib/seo/calculate-seo-score';

const { Search, TextArea } = Input;
const { Option } = Select;

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  stockQuantity: number;
  active: boolean;
  images: string[];
  categoryIds: number[];
  tags: string[];
  additionalInfo: {
    weight: string;
    dimensions: string;
    material: string;
    careInstructions: string;
  } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  seoKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [editImagesVisible, setEditImagesVisible] = useState(false);
  const [editingImagesProduct, setEditingImagesProduct] = useState<Product | null>(null);
  const [imagesForm] = Form.useForm();
  const [savingImages, setSavingImages] = useState(false);
  
  // Crop state for product images
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
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };
    
    updateScreenWidth();
    window.addEventListener('resize', updateScreenWidth);
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  const isMobile = screenWidth > 0 && screenWidth < 768;
  const isTablet = screenWidth > 0 && screenWidth < 1024;

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
        const currentImages = imagesForm.getFieldValue('images') || [];
        const newImages = [...currentImages, result.data.url];
        imagesForm.setFieldsValue({ images: newImages });
        message.success({ content: 'Image cropped and uploaded successfully', key: 'upload' });
        setCropVisible(false);
        setImageToCrop(null);
        setOriginalFile(null);
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        // Force form update to show the new image
        setTimeout(() => {
          imagesForm.setFieldsValue({ images: newImages });
        }, 100);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      message.error({ content: error.message || 'Failed to upload cropped image', key: 'upload' });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchText) {
        params.append('search', searchText);
      }

      if (activeFilter !== 'all') {
        params.append('active', activeFilter === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json();

      if (result.data) {
        setProducts(result.data);
        setTotal(result.total || 0);
      }
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, searchText, activeFilter]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Product deleted successfully');
        fetchProducts();
      } else {
        message.error('Failed to delete product');
      }
    } catch (error) {
      message.error('Error deleting product');
      console.error('Error deleting product:', error);
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const result = await response.json();

      if (result.data) {
        setPreviewProduct(result.data);
        setPreviewVisible(true);
      }
    } catch (error) {
      message.error('Failed to load product details');
      console.error('Error fetching product:', error);
    }
  };

  const handleEditImages = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const result = await response.json();

      if (result.data) {
        const product = result.data;
        setEditingImagesProduct(product);
        setEditImagesVisible(true);
        // Set form values after modal is visible
        setTimeout(() => {
          const imagesArray = Array.isArray(product.images) ? product.images : [];
          imagesForm.setFieldsValue({ images: imagesArray });
        }, 100);
      }
    } catch (error) {
      message.error('Failed to load product images');
      console.error('Error fetching product:', error);
    }
  };

  const handleSaveImages = async () => {
    try {
      const values = await imagesForm.validateFields();
      setSavingImages(true);

      const imagesArray = Array.isArray(values.images) ? values.images : [];

      console.log('💾 Saving images:', {
        productId: editingImagesProduct?.id,
        imagesCount: imagesArray.length,
        images: imagesArray,
      });

      const response = await fetch(`/api/products/${editingImagesProduct?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imagesArray,
        }),
      });

      if (response.ok) {
        message.success('Images updated successfully');
        setEditImagesVisible(false);
        setEditingImagesProduct(null);
        imagesForm.resetFields();
        fetchProducts(); // Refresh the product list
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to update images');
      }
    } catch (error: any) {
      message.error('Failed to save images');
      console.error('Error saving images:', error);
    } finally {
      setSavingImages(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      setEditVisible(true);
      const response = await fetch(`/api/products/${id}`);
      const result = await response.json();

      if (result.data) {
        const product = result.data;
        setEditingProduct(product);
        
        // Fetch categories first
        await fetchCategories();
        
        // Set form values after a brief delay to ensure form is mounted
        setTimeout(() => {
          // Convert categoryIds to numbers if they're strings
          const categoryIds = Array.isArray(product.categoryIds)
            ? product.categoryIds.map((id: any) => typeof id === 'string' ? parseInt(id) : id)
            : [];
          
          form.setFieldsValue({
            name: product.name || '',
            slug: product.slug || '',
            sku: product.sku || '',
            description: product.description || '',
            price: product.price || 0,
            stockQuantity: product.stockQuantity || 0,
            active: product.active !== undefined ? product.active : true,
            categoryIds: categoryIds,
            tags: Array.isArray(product.tags) ? product.tags.map((tag: string) => tag.toUpperCase()) : [],
            weight: product.additionalInfo?.weight || '',
            dimensions: product.additionalInfo?.dimensions || '',
            material: product.additionalInfo?.material || '',
            careInstructions: product.additionalInfo?.careInstructions || '',
            metaTitle: product.metaTitle || '',
            metaDescription: product.metaDescription || '',
            seoKeywords: product.metaKeywords || product.seoKeywords || '',
            ogTitle: product.ogTitle || '',
            ogDescription: product.ogDescription || '',
            canonicalUrl: product.canonicalUrl || '',
          });
        }, 100);
      } else {
        message.error('Product not found');
        setEditVisible(false);
      }
    } catch (error) {
      message.error('Failed to load product for editing');
      console.error('Error fetching product:', error);
      setEditVisible(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields first
      await form.validateFields(['name', 'slug', 'sku', 'price']);
      
      // Get ALL form values (from all tabs) - not just validated ones
      const allValues = form.getFieldsValue();
      setSaving(true);

      // Get current product data to preserve what's not being changed
      const currentTags = editingProduct?.tags || [];
      const currentCategoryIds = editingProduct?.categoryIds || [];
      const currentAdditionalInfo = editingProduct?.additionalInfo || null;
      const currentMetaTitle = editingProduct?.metaTitle || null;
      const currentMetaDescription = editingProduct?.metaDescription || null;
      const currentSeoKeywords = editingProduct?.seoKeywords || null;
      const currentOgTitle = editingProduct?.ogTitle || null;
      const currentOgDescription = editingProduct?.ogDescription || null;
      const currentCanonicalUrl = editingProduct?.canonicalUrl || null;

      // Process tags - use form value if it exists (even if empty array), otherwise keep current
      const tagsArray = allValues.tags !== undefined
        ? (Array.isArray(allValues.tags) 
            ? allValues.tags.map((tag: string) => String(tag).toUpperCase().trim()).filter((tag: string) => tag.length > 0)
            : [])
        : currentTags.map((tag: string) => String(tag).toUpperCase());
      
      // Process categories - use form value if it exists (even if empty array), otherwise keep current
      const categoryIdsArray = allValues.categoryIds !== undefined
        ? (Array.isArray(allValues.categoryIds) ? allValues.categoryIds : [])
        : currentCategoryIds;

      // Process additional info - use form values if they exist, otherwise keep current
      const additionalInfoData = {
        weight: allValues.weight !== undefined ? (allValues.weight || null) : (currentAdditionalInfo?.weight || null),
        dimensions: allValues.dimensions !== undefined ? (allValues.dimensions || null) : (currentAdditionalInfo?.dimensions || null),
        material: allValues.material !== undefined ? (allValues.material || null) : (currentAdditionalInfo?.material || null),
        careInstructions: allValues.careInstructions !== undefined ? (allValues.careInstructions || null) : (currentAdditionalInfo?.careInstructions || null),
      };

      // Process SEO fields - use form values if they exist, otherwise keep current
      const metaTitle = allValues.metaTitle !== undefined ? (allValues.metaTitle || null) : currentMetaTitle;
      const metaDescription = allValues.metaDescription !== undefined ? (allValues.metaDescription || null) : currentMetaDescription;
      const seoKeywords = allValues.seoKeywords !== undefined ? (allValues.seoKeywords || null) : currentSeoKeywords;
      const ogTitle = allValues.ogTitle !== undefined ? (allValues.ogTitle || null) : currentOgTitle;
      const ogDescription = allValues.ogDescription !== undefined ? (allValues.ogDescription || null) : currentOgDescription;
      const canonicalUrl = allValues.canonicalUrl !== undefined ? (allValues.canonicalUrl || null) : currentCanonicalUrl;

      console.log('💾 Saving product with:', {
        tagsCount: tagsArray.length,
        categoriesCount: categoryIdsArray.length,
        hasMetaTitle: !!metaTitle,
        hasMetaDescription: !!metaDescription,
        hasSeoKeywords: !!seoKeywords,
        tags: tagsArray,
        categoryIds: categoryIdsArray,
      });

      const updateData = {
        name: allValues.name,
        slug: allValues.slug,
        sku: allValues.sku,
        description: allValues.description || '',
        price: allValues.price,
        currency: 'EUR', // Always EUR
        stockQuantity: allValues.stockQuantity || 0,
        active: allValues.active !== undefined ? allValues.active : true,
        categoryIds: categoryIdsArray,
        tags: tagsArray,
        additionalInfo: additionalInfoData,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        seoKeywords: seoKeywords,
        ogTitle: ogTitle,
        ogDescription: ogDescription,
        canonicalUrl: canonicalUrl,
      };

      const response = await fetch(`/api/products/${editingProduct?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        message.success('Product updated successfully');
        setEditVisible(false);
        setEditingProduct(null);
        form.resetFields();
        fetchProducts();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to update product');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fix the form errors');
      } else {
        message.error('Failed to update product');
        console.error('Error updating product:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'image',
      width: isMobile ? 60 : 100,
      render: (images: string[]) => (
        <AntImage
          src={images && images.length > 0 ? images[0] : '/images/placeholder.jpg'}
          alt="Product"
          width={isMobile ? 40 : 60}
          height={isMobile ? 40 : 60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="/images/placeholder.jpg"
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      ellipsis: true,
      width: isMobile ? 150 : undefined,
      render: (text: string, record: Product) => (
        <div
          style={{ cursor: 'pointer', color: '#1890ff' }}
          onClick={() => handleEdit(record.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      align: 'right',
      render: (price: number, record: Product) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {price.toFixed(2)} {record.currency}
        </Tag>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 70,
      align: 'center',
      render: (quantity: number) => (
        <Tag color={quantity > 0 ? 'green' : 'red'}>
          {quantity}
        </Tag>
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
    ...(isMobile ? [] : [
      {
        title: 'Categories',
        dataIndex: 'categoryIds',
        key: 'categories',
        width: 110,
        render: (categoryIds: number[]) => (
          <div>
            {categoryIds && categoryIds.length > 0 ? (
              <Tag>{categoryIds.length} categories</Tag>
            ) : (
              <Tag color="default">No categories</Tag>
            )}
          </div>
        ),
      } as ColumnsType<Product>[0],
      {
        title: 'Tags',
        dataIndex: 'tags',
        key: 'tags',
        width: 200,
        render: (tags: string[]) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags && tags.length > 0 ? (
              <>
                {tags.map((tag, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </>
            ) : (
              <span style={{ color: '#999' }}>No tags</span>
            )}
          </div>
        ),
      } as ColumnsType<Product>[0],
    ]),
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
          render: (_: any, record: Product) => (
            <Space size="small">
              <Button
                type="text"
                icon={<PictureOutlined />}
                onClick={() => handleEditImages(record.id)}
                size="small"
                title="Edit Images"
              />
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record.id)}
                size="small"
                title="Edit"
              />
              {!record.active && (
                <Popconfirm
                  title="Delete product"
                  description="Are you sure you want to delete this product?"
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
          <Col flex="auto">
            <Search
              placeholder="Search products by name, SKU, or description"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={(value) => {
                setSearchText(value);
                setCurrentPage(1);
              }}
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Select
              value={activeFilter}
              onChange={setActiveFilter}
              style={{ width: 150 }}
              size="middle"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="middle"
              onClick={() => {
                // TODO: Implement create product
                message.info('Create product functionality will be added');
              }}
            >
              Add Product
            </Button>
          </Col>
          <Col>
            <Button
              icon={<DeleteOutlined />}
              size="middle"
              danger
              onClick={async () => {
                try {
                  message.loading({ content: 'Cleaning up old product images...', key: 'cleanup', duration: 0 });
                  const response = await fetch('/api/products/cleanup-old-images', {
                    method: 'POST',
                  });
                  const result = await response.json();
                  
                  if (result.success) {
                    message.success({ 
                      content: `Deleted ${result.deleted} old images${result.failed > 0 ? `, ${result.failed} failed` : ''}`, 
                      key: 'cleanup',
                      duration: 8,
                    });
                    if (result.errors && result.errors.length > 0) {
                      console.error('Cleanup errors:', result.errors);
                    }
                  } else {
                    message.error({ content: result.error || 'Failed to cleanup old images', key: 'cleanup' });
                  }
                } catch (error) {
                  message.error({ content: 'Failed to cleanup old images', key: 'cleanup' });
                  console.error('Error cleaning up:', error);
                }
              }}
            >
              Delete Old Images
            </Button>
          </Col>
        </Row>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: !isMobile,
              showTotal: (total) => `Total ${total} products`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              simple: isMobile,
            }}
            scroll={{ 
              x: isMobile ? 600 : (isTablet ? 900 : 1200),
              y: isMobile ? 400 : undefined,
            }}
            size={isMobile ? 'small' : 'middle'}
          />
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Product Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              if (previewProduct) {
                setPreviewVisible(false);
                handleEdit(previewProduct.id);
              }
            }}
          >
            Edit
          </Button>,
        ]}
        width={800}
      >
        {previewProduct && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="ID" span={1}>
                {previewProduct.id}
              </Descriptions.Item>
              <Descriptions.Item label="SKU" span={1}>
                {previewProduct.sku}
              </Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {previewProduct.name}
              </Descriptions.Item>
              <Descriptions.Item label="Slug" span={2}>
                {previewProduct.slug}
              </Descriptions.Item>
              <Descriptions.Item label="Price" span={1}>
                {previewProduct.price.toFixed(2)} {previewProduct.currency}
              </Descriptions.Item>
              <Descriptions.Item label="Stock Quantity" span={1}>
                <Tag color={previewProduct.stockQuantity > 0 ? 'green' : 'red'}>
                  {previewProduct.stockQuantity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={1}>
                <Tag color={previewProduct.active ? 'green' : 'red'}>
                  {previewProduct.active ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {previewProduct.description || 'No description'}
              </Descriptions.Item>
              <Descriptions.Item label="Images" span={2}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {previewProduct.images && previewProduct.images.length > 0 ? (
                    previewProduct.images.map((img, index) => (
                      <AntImage
                        key={index}
                        src={img}
                        alt={`Product image ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))
                  ) : (
                    <span style={{ color: '#999' }}>No images</span>
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Categories" span={1}>
                {previewProduct.categoryIds && previewProduct.categoryIds.length > 0
                  ? `${previewProduct.categoryIds.length} categories`
                  : 'No categories'}
              </Descriptions.Item>
              <Descriptions.Item label="Tags" span={1}>
                {previewProduct.tags && previewProduct.tags.length > 0 ? (
                  <div>
                    {previewProduct.tags.map((tag, index) => (
                      <Tag key={index} style={{ marginBottom: 4 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  'No tags'
                )}
              </Descriptions.Item>
              {previewProduct.additionalInfo && (
                <>
                  <Descriptions.Item label="Weight" span={1}>
                    {previewProduct.additionalInfo.weight || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dimensions" span={1}>
                    {previewProduct.additionalInfo.dimensions || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Material" span={1}>
                    {previewProduct.additionalInfo.material || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Care Instructions" span={1}>
                    {previewProduct.additionalInfo.careInstructions || 'N/A'}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Meta Title" span={1}>
                {previewProduct.metaTitle || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Meta Description" span={1}>
                {previewProduct.metaDescription || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At" span={1}>
                {new Date(previewProduct.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At" span={1}>
                {new Date(previewProduct.updated_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={`Edit Product: ${editingProduct?.name || ''}`}
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditVisible(false);
              setEditingProduct(null);
              form.resetFields();
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
            Save Changes
          </Button>,
        ]}
        width={900}
        destroyOnHidden
      >
        {editingProduct && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              currency: 'EUR',
              active: true,
              stockQuantity: 0,
            }}
          >
            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: 'Basic Information',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Product Name"
                            name="name"
                            rules={[{ required: true, message: 'Please enter product name' }]}
                          >
                            <Input placeholder="Product name" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Slug"
                            name="slug"
                            rules={[{ required: true, message: 'Please enter slug' }]}
                          >
                            <Input placeholder="product-slug" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        label="SKU"
                        name="sku"
                        rules={[{ required: true, message: 'Please enter SKU' }]}
                      >
                        <Input placeholder="SKU" />
                      </Form.Item>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Price"
                            name="price"
                            rules={[{ required: true, message: 'Please enter price' }]}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Stock Quantity"
                            name="stockQuantity"
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              placeholder="0"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        label="Description"
                        name="description"
                      >
                        <TextArea
                          rows={6}
                          placeholder="Product description"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Active"
                        name="active"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'categories',
                  label: 'Categories & Tags',
                  children: (
                    <>
                      <Form.Item
                        label="Categories"
                        name="categoryIds"
                      >
                        <Checkbox.Group style={{ width: '100%' }}>
                          <Row gutter={[16, 8]}>
                            {categories.map((cat) => (
                              <Col span={8} key={cat.id}>
                                <Checkbox value={cat.id}>{cat.name}</Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Form.Item>
                      <Form.Item
                        label="Tags"
                        name="tags"
                        tooltip="Enter tags separated by commas (will be converted to uppercase)"
                      >
                        <Select
                          mode="tags"
                          placeholder="Enter tags"
                          style={{ width: '100%' }}
                          tokenSeparators={[',']}
                          onChange={(values) => {
                            // Convert all tags to uppercase
                            const upperTags = values.map((tag: string) => tag.toUpperCase());
                            form.setFieldsValue({ tags: upperTags });
                          }}
                        />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'additional',
                  label: 'Additional Info',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Weight"
                            name="weight"
                          >
                            <Input placeholder="0.5 kg" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Dimensions"
                            name="dimensions"
                          >
                            <Input placeholder="20 x 15 x 10 cm" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Material"
                            name="material"
                          >
                            <Input placeholder="Ceramic" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Care Instructions"
                            name="careInstructions"
                          >
                            <Input placeholder="Hand wash only" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'seo',
                  label: 'SEO',
                  children: (
                    <>
                      <Space style={{ marginBottom: 16 }}>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={async () => {
                            if (!editingProduct) return;
                            
                            try {
                              message.loading({ content: 'Generating SEO data...', key: 'seo-generate' });
                              const response = await fetch(`/api/products/${editingProduct.id}/seo/auto-generate`, {
                                method: 'POST',
                              });
                              
                              let result;
                              try {
                                const text = await response.text();
                                result = text ? JSON.parse(text) : {};
                              } catch (parseError) {
                                console.error('Failed to parse response:', parseError);
                                result = { error: 'Invalid response from server' };
                              }
                              
                              if (!response.ok) {
                                console.error('SEO generation error:', {
                                  status: response.status,
                                  statusText: response.statusText,
                                  result,
                                });
                                message.error({ 
                                  content: result.error || result.details || `Failed to generate SEO data (${response.status})`, 
                                  key: 'seo-generate',
                                  duration: 5,
                                });
                                return;
                              }
                              
                              if (result.success && result.data) {
                                // Populate form with generated SEO data
                                form.setFieldsValue({
                                  metaTitle: result.data.metaTitle,
                                  metaDescription: result.data.metaDescription,
                                  seoKeywords: result.data.seoKeywords,
                                  ogTitle: result.data.ogTitle,
                                  ogDescription: result.data.ogDescription,
                                  canonicalUrl: result.data.canonicalUrl,
                                });
                                message.success({ content: 'SEO data generated successfully!', key: 'seo-generate' });
                              } else {
                                message.error({ content: result.error || 'Failed to generate SEO data', key: 'seo-generate' });
                              }
                            } catch (error) {
                              console.error('Error generating SEO:', error);
                              message.error({ 
                                content: `Failed to generate SEO data: ${error instanceof Error ? error.message : String(error)}`, 
                                key: 'seo-generate',
                                duration: 5,
                              });
                            }
                          }}
                        >
                          Generate SEO Data
                        </Button>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          Auto-fill SEO fields based on product information
                        </span>
                      </Space>
                      <Form.Item
                        label="Meta Title"
                        name="metaTitle"
                      >
                        <Input placeholder="Meta title for SEO" />
                      </Form.Item>
                      <Form.Item
                        label="Meta Description"
                        name="metaDescription"
                      >
                        <TextArea
                          rows={3}
                          placeholder="Meta description for SEO"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Meta Keywords"
                        name="seoKeywords"
                      >
                        <Input placeholder="keyword1, keyword2, keyword3" />
                      </Form.Item>
                      <Form.Item
                        label="OG Title"
                        name="ogTitle"
                      >
                        <Input placeholder="Open Graph title" />
                      </Form.Item>
                      <Form.Item
                        label="OG Description"
                        name="ogDescription"
                      >
                        <TextArea
                          rows={3}
                          placeholder="Open Graph description"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Canonical URL"
                        name="canonicalUrl"
                      >
                        <Input placeholder="https://example.com/product" />
                      </Form.Item>
                      <Form.Item
                        label="SEO Score"
                        shouldUpdate={(prevValues, currentValues) => {
                          const fields = ['metaTitle', 'metaDescription', 'seoKeywords', 'ogTitle', 'ogDescription', 'canonicalUrl'];
                          return fields.some(field => prevValues[field] !== currentValues[field]);
                        }}
                      >
                        {() => {
                          const values = form.getFieldsValue();
                          const scoreResult = calculateSEOScore({
                            metaTitle: values.metaTitle,
                            metaDescription: values.metaDescription,
                            seoKeywords: values.seoKeywords,
                            ogTitle: values.ogTitle,
                            ogDescription: values.ogDescription,
                            canonicalUrl: values.canonicalUrl,
                          });

                          const getScoreColor = (score: number) => {
                            if (score >= 80) return '#52c41a'; // green
                            if (score >= 60) return '#faad14'; // orange
                            return '#ff4d4f'; // red
                          };

                          return (
                            <Card size="small" style={{ background: '#fafafa' }}>
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: 500 }}>Overall SEO Score</span>
                                  <span style={{ fontSize: 20, fontWeight: 'bold', color: getScoreColor(scoreResult.score) }}>
                                    {scoreResult.score}%
                                  </span>
                                </div>
                                <Progress
                                  percent={scoreResult.score}
                                  strokeColor={getScoreColor(scoreResult.score)}
                                  showInfo={false}
                                />
                              </div>
                              <div style={{ fontSize: 12 }}>
                                {Object.entries(scoreResult.checks).map(([key, check]) => (
                                  <div key={key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tooltip title={check.message}>
                                      <span style={{ 
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: check.passed ? '#52c41a' : '#ff4d4f',
                                      }} />
                                    </Tooltip>
                                    <span style={{ color: check.passed ? '#52c41a' : '#999' }}>
                                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          );
                        }}
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          </Form>
        )}
      </Modal>

      {/* Edit Images Modal */}
      {editImagesVisible && (
        <Modal
          title={`Edit Images: ${editingImagesProduct?.name || ''}`}
          open={editImagesVisible}
          onCancel={() => {
            setEditImagesVisible(false);
            setEditingImagesProduct(null);
            imagesForm.resetFields();
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setEditImagesVisible(false);
                setEditingImagesProduct(null);
                imagesForm.resetFields();
              }}
            >
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              loading={savingImages}
              onClick={handleSaveImages}
            >
              Save Images
            </Button>,
          ]}
          width={900}
          destroyOnHidden
        >
          <Form form={imagesForm} layout="vertical">
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
                    // If crop is enabled, show crop modal first
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

                    // Otherwise upload directly
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
                        const currentImages = imagesForm.getFieldValue('images') || [];
                        const newImages = [...currentImages, result.data.url];
                        imagesForm.setFieldsValue({ images: newImages });
                        message.success({ content: 'Image uploaded successfully', key: 'upload' });
                        // Force form update to show the new image
                        setTimeout(() => {
                          imagesForm.setFieldsValue({ images: newImages });
                        }, 100);
                      } else {
                        message.error({ content: result.error || 'Failed to upload image', key: 'upload' });
                      }
                    } catch (error) {
                      message.error({ content: 'Failed to upload image', key: 'upload' });
                      console.error('Upload error:', error);
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
              Load Image
            </Button>
          </Space>
          <Form.Item
            label="Product Images Gallery"
            tooltip="First image is the thumbnail (shown with border). Drag to reorder or use arrows."
            shouldUpdate={(prevValues, currentValues) => {
              const prevImages = Array.isArray(prevValues.images) ? prevValues.images : [];
              const currImages = Array.isArray(currentValues.images) ? currentValues.images : [];
              return prevImages.length !== currImages.length || 
                     prevImages.some((img, i) => img !== currImages[i]);
            }}
          >
            {() => {
              const images = Array.isArray(imagesForm.getFieldValue('images')) ? imagesForm.getFieldValue('images') : [];
              const onChange = (newImages: string[]) => {
                imagesForm.setFieldsValue({ images: newImages });
              };
              return (
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 16,
                    marginTop: 16,
                  }}
                >
                  {images.length > 0 ? (
                    images.map((img: string, index: number) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => setDraggedImageIndex(index)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '1';
                          if (draggedImageIndex !== null && draggedImageIndex !== index) {
                            const newImages = [...images];
                            const draggedImage = newImages[draggedImageIndex];
                            newImages.splice(draggedImageIndex, 1);
                            newImages.splice(index, 0, draggedImage);
                            onChange(newImages);
                          }
                          setDraggedImageIndex(null);
                        }}
                        style={{
                          position: 'relative',
                          border: index === 0 ? '3px solid #1890ff' : '1px solid #d9d9d9',
                          borderRadius: 8,
                          padding: 4,
                          background: index === 0 ? '#e6f7ff' : '#fff',
                          cursor: 'move',
                          transition: 'all 0.2s',
                        }}
                      >
                        {index === 0 && (
                          <Tag
                            color="blue"
                            style={{
                              position: 'absolute',
                              top: -10,
                              left: 8,
                              zIndex: 1,
                              fontSize: 11,
                            }}
                          >
                            Thumbnail
                          </Tag>
                        )}
                        <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}>
                          <Tag style={{ fontSize: 10, padding: '2px 6px' }}>
                            <DragOutlined /> {index + 1}
                          </Tag>
                        </div>
                        <AntImage
                          src={img}
                          alt={`Product image ${index + 1}`}
                          width={130}
                          height={130}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 4,
                            display: 'block',
                            width: '100%',
                            height: 130,
                          }}
                          fallback="/images/placeholder.jpg"
                        />
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 4,
                            marginTop: 8,
                          }}
                        >
                          <Button
                            type="text"
                            icon={<ArrowUpOutlined />}
                            size="small"
                            disabled={index === 0}
                            onClick={() => {
                              const newImages = [...images];
                              [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                              onChange(newImages);
                            }}
                            title="Move up"
                          />
                          <Button
                            type="text"
                            icon={<ArrowDownOutlined />}
                            size="small"
                            disabled={index === images.length - 1}
                            onClick={() => {
                              const newImages = [...images];
                              [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                              onChange(newImages);
                            }}
                            title="Move down"
                          />
                          <Button
                            type="text"
                            icon={<DeleteFilled />}
                            size="small"
                            danger
                            onClick={() => {
                              const newImages = images.filter((_: string, i: number) => i !== index);
                              onChange(newImages);
                            }}
                            title="Remove"
                          />
                        </div>
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: 11,
                            color: '#999',
                            marginTop: 4,
                            maxWidth: 130,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {img.split('/').pop()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      color: '#999', 
                      padding: 40, 
                      textAlign: 'center', 
                      gridColumn: '1 / -1',
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8,
                    }}>
                      No images. Click "Upload" or "Load Image" to add images.
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>
          <Form.Item name="images" hidden>
            <Input />
          </Form.Item>
        </Form>
        </Modal>
      )}

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
                      const currentImages = imagesForm.getFieldValue('images') || [];
                      imagesForm.setFieldsValue({ images: [...currentImages, file.url] });
                      message.success('Image added to product');
                      setMediaLibraryVisible(false);
                    }}
                  >
                    <AntImage
                      src={file.url}
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

      {/* Crop Modal for Product Images */}
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
            {aspectRatio && (
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">
                  Aspect Ratio: {
                    aspectRatio === 1 ? '1:1' :
                    aspectRatio === 4/3 ? '4:3' :
                    aspectRatio === 16/9 ? '16:9' :
                    aspectRatio === 3/4 ? '3:4' :
                    aspectRatio === 9/16 ? '9:16' :
                    String(aspectRatio)
                  }
                </Tag>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
