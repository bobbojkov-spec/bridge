"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
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
  Tabs,
  Progress,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteFilled,
  FolderOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  MenuOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { calculateSEOScore } from '@/lib/seo/calculate-seo-score';
import { Image as AntImage } from 'antd';
import MediaPicker from '@/components/MediaPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { TextArea } = Input;

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageBlock {
  id: string;
  pageId: string;
  type: string;
  position: number;
  data: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

const BLOCK_TYPES = [
  { value: 'title', label: 'Title' },
  { value: 'text', label: 'Text' },
  { value: 'image-text', label: 'Image + Text' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'featured-images', label: 'Featured Images (3 items)' },
  { value: 'gallery', label: 'Gallery' },
];

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [editingBlockType, setEditingBlockType] = useState<string | null>(null);
  const [mediaSelectionCallback, setMediaSelectionCallback] = useState<((mediaId: number) => void) | null>(null);
  const [mediaCache, setMediaCache] = useState<Map<number, any>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPages();
  }, []);

  // Set form values when modal opens (add mode only)
  useEffect(() => {
    if (editVisible && !editingPage) {
      // Add mode - set default values after Form is mounted
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({
          status: 'draft',
        });
      }, 0);
    }
  }, [editVisible, editingPage]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pages');
      const result = await response.json();
      if (result.data) {
        setPages(result.data);
      }
    } catch (error) {
      message.error('Failed to fetch pages');
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async (pageId: string) => {
    setLoadingBlocks(true);
    try {
      const response = await fetch(`/api/pages/${pageId}/blocks`);
      const result = await response.json();
      if (result.data) {
        setBlocks(result.data);
      }
    } catch (error) {
      message.error('Failed to fetch blocks');
      console.error('Error fetching blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleAdd = () => {
    setEditingPage(null);
    setBlocks([]);
    setEditVisible(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/pages/${id}`);
      const result = await response.json();

      if (result.data) {
        const page = result.data;
        setEditingPage(page);
        setEditVisible(true);
        // Fetch blocks for this page
        fetchBlocks(id);
        // Set form values after Form is mounted
        setTimeout(() => {
          form.setFieldsValue({
            title: page.title || '',
            slug: page.slug || '',
            status: page.status || 'draft',
            seoTitle: page.seoTitle || '',
            seoDescription: page.seoDescription || '',
          });
        }, 0);
      } else {
        message.error('Page not found');
      }
    } catch (error) {
      message.error('Failed to load page for editing');
      console.error('Error fetching page:', error);
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields(['title', 'slug']);
      setSaving(true);

      const values = form.getFieldsValue();
      
      // Generate slug from title if not provided
      const slug = values.slug || values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const pageData = {
        title: values.title,
        slug: slug,
        status: values.status || 'draft',
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
      };

      let response: Response;
      let isUpdate = false;

      try {
        if (editingPage) {
          // Update
          isUpdate = true;
          response = await fetch(`/api/pages/${editingPage.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pageData),
          });
        } else {
          // Create
          response = await fetch('/api/pages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pageData),
          });
        }

        if (response.ok) {
          const result = await response.json();
          if (isUpdate) {
            message.success('Page updated successfully');
            fetchPages();
          } else {
            message.success('Page created successfully');
            setEditingPage(result.data);
            fetchPages();
          }
        } else {
          // Handle error response
          let errorMessage = isUpdate ? 'Failed to update page' : 'Failed to create page';
          let errorDetails = '';
          let errorCode = '';
          let rawErrorText = '';
          
          try {
            // Always read as text first
            rawErrorText = await response.text();
            
            if (rawErrorText) {
              try {
                const errorData = JSON.parse(rawErrorText);
                if (errorData && typeof errorData === 'object') {
                  errorMessage = errorData.error || errorMessage;
                  errorDetails = errorData.details || '';
                  errorCode = errorData.code || '';
                  
                  if (errorCode === 'MIGRATION_REQUIRED') {
                    message.error({
                      content: `${errorMessage} ${errorDetails}`,
                      duration: 10,
                    });
                    return;
                  }
                  
                  if (errorCode === 'DUPLICATE_SLUG') {
                    message.error(errorMessage);
                  }
                } else {
                  // Not a valid JSON object
                  errorDetails = rawErrorText;
                }
              } catch (parseError) {
                // If JSON parsing fails, use the raw text
                errorDetails = rawErrorText;
                console.error('Failed to parse error JSON:', parseError, 'Raw text:', rawErrorText);
              }
            } else {
              // Empty response body
              errorDetails = `HTTP ${response.status} ${response.statusText}`;
            }
          } catch (textError: any) {
            // If reading response fails completely
            console.error('Failed to read error response:', textError);
            errorDetails = `Failed to read error response: ${textError?.message || String(textError)}`;
          }
          
          const fullErrorMessage = errorDetails 
            ? `${errorMessage}: ${errorDetails}` 
            : errorMessage;
          
          message.error(fullErrorMessage);
          
          // Detailed error logging
          console.error(`Error ${isUpdate ? 'updating' : 'creating'} page:`, {
            status: response.status,
            statusText: response.statusText,
            statusCode: response.status,
            errorMessage,
            errorDetails,
            errorCode,
            rawErrorText: rawErrorText || '(empty)',
            url: response.url,
            headers: Object.fromEntries(response.headers.entries()),
          });
        }
      } catch (fetchError: any) {
        // Network or fetch errors
        const errorMsg = isUpdate ? 'Failed to update page' : 'Failed to create page';
        message.error(`${errorMsg}: ${fetchError?.message || 'Network error'}`);
        console.error(`Error ${isUpdate ? 'updating' : 'creating'} page (fetch error):`, {
          error: fetchError,
          message: fetchError?.message,
          stack: fetchError?.stack,
        });
      }
    } catch (error: any) {
      // Form validation or other errors
      if (error.errorFields) {
        message.error('Please fix the form errors');
      } else {
        message.error('Failed to save page');
        console.error('Error saving page:', {
          error,
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('Page deleted successfully');
        fetchPages();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to delete page');
      }
    } catch (error) {
      message.error('Failed to delete page');
      console.error('Error deleting page:', error);
    }
  };

  const handleAddBlock = async (type: string, position?: number) => {
    if (!editingPage) {
      message.warning('Please save the page first before adding blocks');
      return;
    }

    try {
      const defaultData: Record<string, any> = {};
      
      // Set default data based on block type
      switch (type) {
        case 'title':
          defaultData.text = '';
          defaultData.level = 'h1';
          break;
        case 'text':
          defaultData.content = '';
          break;
        case 'image-text':
          defaultData.mediaId = null;
          defaultData.text = '';
          defaultData.alignment = 'left';
          break;
        case 'youtube':
          defaultData.videoId = '';
          defaultData.title = '';
          break;
        case 'featured-images':
          defaultData.mediaIds = [null, null, null];
          defaultData.titles = ['', '', ''];
          defaultData.links = ['', '', ''];
          break;
        case 'gallery':
          defaultData.mediaIds = [];
          break;
      }

      // Calculate position if not provided
      let blockPosition = position;
      if (blockPosition === undefined) {
        blockPosition = blocks.length > 0 
          ? Math.max(...blocks.map(b => b.position)) + 1 
          : 0;
      }

      const response = await fetch(`/api/pages/${editingPage.id}/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data: defaultData,
          enabled: true,
          position: blockPosition,
        }),
      });

      if (response.ok) {
        message.success('Block added successfully');
        fetchBlocks(editingPage.id);
        setEditingBlockType(null);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to add block');
      }
    } catch (error) {
      message.error('Failed to add block');
      console.error('Error adding block:', error);
    }
  };

  const handleUpdateBlock = async (blockId: string, updates: Partial<PageBlock>) => {
    if (!editingPage) return;

    try {
      const response = await fetch(`/api/pages/${editingPage.id}/blocks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks: [{
            id: blockId,
            ...updates,
          }],
        }),
      });

      if (response.ok) {
        message.success('Block updated successfully');
        fetchBlocks(editingPage.id);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to update block');
      }
    } catch (error) {
      message.error('Failed to update block');
      console.error('Error updating block:', error);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!editingPage) return;

    try {
      const response = await fetch(`/api/pages/${editingPage.id}/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Block deleted successfully');
        fetchBlocks(editingPage.id);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to delete block');
      }
    } catch (error) {
      message.error('Failed to delete block');
      console.error('Error deleting block:', error);
    }
  };

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    if (!editingPage) return;

    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    // Reorder blocks optimistically
    const reordered = arrayMove(blocks, blockIndex, newIndex);
    setBlocks(reordered);
    setHasUnsavedChanges(true);

    // Persist to API
    try {
      const response = await fetch(`/api/pages/${editingPage.id}/blocks/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockIds: reordered.map(b => b.id),
        }),
      });

      if (response.ok) {
        message.success('Order saved', 2);
        setHasUnsavedChanges(false);
        fetchBlocks(editingPage.id);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to save order');
        // Rollback
        fetchBlocks(editingPage.id);
      }
    } catch (error) {
      message.error('Failed to save order');
      console.error('Error reordering blocks:', error);
      // Rollback
      fetchBlocks(editingPage.id);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !editingPage) {
      return;
    }

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);
    setHasUnsavedChanges(true);

    // Persist to API
    try {
      const response = await fetch(`/api/pages/${editingPage.id}/blocks/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockIds: reordered.map(b => b.id),
        }),
      });

      if (response.ok) {
        message.success('Order saved', 2);
        setHasUnsavedChanges(false);
        fetchBlocks(editingPage.id);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to save order');
        // Rollback
        fetchBlocks(editingPage.id);
      }
    } catch (error) {
      message.error('Failed to save order');
      console.error('Error reordering blocks:', error);
      // Rollback
      fetchBlocks(editingPage.id);
    }
  };

  // Helper function to generate block summary
  const getBlockSummary = (block: PageBlock): string => {
    const data = block.data || {};
    switch (block.type) {
      case 'title':
        return data.text ? `"${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"` : 'Empty title';
      case 'text':
        const content = data.content || '';
        const charCount = content.length;
        return charCount > 0 ? `~${charCount} chars` : 'Empty text';
      case 'image-text':
        const hasImage = data.mediaId;
        const hasText = data.text && data.text.trim().length > 0;
        if (hasImage && hasText) return 'Image + Text';
        if (hasImage) return 'Image only';
        if (hasText) return `Text only (~${data.text.length} chars)`;
        return 'Empty';
      case 'youtube':
        return data.videoId ? `Video: ${data.videoId}` : 'No video ID';
      case 'featured-images':
        const mediaIds = data.mediaIds || [];
        const count = mediaIds.filter((id: any) => id !== null).length;
        return `${count}/3 images`;
      case 'gallery':
        const galleryIds = data.mediaIds || [];
        return `${galleryIds.length} image${galleryIds.length !== 1 ? 's' : ''}`;
      default:
        return block.type;
    }
  };

  const handleToggleBlock = async (blockId: string, enabled: boolean) => {
    await handleUpdateBlock(blockId, { enabled });
  };

  // Helper function to fetch media by ID
  const fetchMediaById = async (mediaId: number): Promise<any> => {
    if (mediaCache.has(mediaId)) {
      return mediaCache.get(mediaId);
    }

    try {
      const response = await fetch(`/api/media?pageSize=1000`);
      const result = await response.json();
      if (result.data) {
        const media = result.data.find((m: any) => m.id === mediaId);
        if (media) {
          mediaCache.set(mediaId, media);
          return media;
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'green';
      case 'draft':
        return 'orange';
      case 'archived':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Page> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: Page) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
            size="small"
            title="Edit"
          />
          <Popconfirm
            title="Delete page"
            description="Are you sure you want to delete this page?"
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
              Add Page
            </Button>
          </Col>
          <Col>
            <Button
              onClick={async () => {
                try {
                  message.loading({ content: 'Running migration...', key: 'migration' });
                  const response = await fetch('/api/pages/migrate-schema');
                  const result = await response.json();
                  if (result.success) {
                    message.success({ 
                      content: `Migration completed: ${result.results.join(', ')}`, 
                      key: 'migration',
                      duration: 5,
                    });
                  } else {
                    message.error({ 
                      content: result.error || 'Migration failed', 
                      key: 'migration',
                      duration: 10,
                    });
                  }
                } catch (error) {
                  message.error({ 
                    content: 'Failed to run migration', 
                    key: 'migration',
                    duration: 10,
                  });
                  console.error('Migration error:', error);
                }
              }}
            >
              Run Migration
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Edit/Create Modal */}
      <Modal
        title={editingPage ? `Edit Page: ${editingPage.title}` : 'Add Page'}
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingPage(null);
          setBlocks([]);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditVisible(false);
              setEditingPage(null);
              setBlocks([]);
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
            {editingPage ? 'Update' : 'Create'}
          </Button>,
        ]}
        width={1200}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'draft',
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
                    <Form.Item
                      label="Title"
                      name="title"
                      rules={[{ required: true, message: 'Please enter title' }]}
                    >
                      <Input placeholder="Page title" />
                    </Form.Item>

                    <Form.Item
                      label="Slug"
                      name="slug"
                      rules={[{ required: true, message: 'Please enter slug' }]}
                      tooltip="URL-friendly version of the title (auto-generated if left empty)"
                    >
                      <Input placeholder="page-slug" />
                    </Form.Item>

                    <Form.Item
                      label="Status"
                      name="status"
                    >
                      <Select>
                        <Select.Option value="draft">Draft</Select.Option>
                        <Select.Option value="published">Published</Select.Option>
                        <Select.Option value="archived">Archived</Select.Option>
                      </Select>
                    </Form.Item>
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
                        onClick={async () => {
                          try {
                            const values = form.getFieldsValue();
                            const title = values.title || '';
                            const description = values.seoDescription || '';

                            // Simple SEO generation based on title
                            const generatedTitle = title ? `${title} | Bridge` : 'Page | Bridge';
                            const generatedDescription = description || (title ? `Learn more about ${title}` : 'Page description');

                            form.setFieldsValue({
                              seoTitle: generatedTitle,
                              seoDescription: generatedDescription,
                            });
                            message.success('SEO data generated successfully');
                          } catch (error) {
                            message.error('Failed to generate SEO data');
                            console.error('Error generating SEO:', error);
                          }
                        }}
                      >
                        Generate SEO Data
                      </Button>
                    </Space>

                    <Form.Item
                      label="SEO Title"
                      name="seoTitle"
                    >
                      <Input placeholder="SEO title" />
                    </Form.Item>

                    <Form.Item
                      label="SEO Description"
                      name="seoDescription"
                    >
                      <TextArea rows={3} placeholder="SEO description" />
                    </Form.Item>

                    <Form.Item
                      label="SEO Score"
                      shouldUpdate={(prevValues, currentValues) => {
                        return prevValues.seoTitle !== currentValues.seoTitle ||
                               prevValues.seoDescription !== currentValues.seoDescription;
                      }}
                    >
                      {() => {
                        const values = form.getFieldsValue();
                        const scoreResult = calculateSEOScore({
                          metaTitle: values.seoTitle,
                          metaDescription: values.seoDescription,
                        });

                        const getScoreColor = (score: number) => {
                          if (score >= 80) return '#52c41a';
                          if (score >= 60) return '#faad14';
                          return '#ff4d4f';
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
              {
                key: 'blocks',
                label: 'Blocks',
                children: editingPage ? (
                  <div>
                    <Space style={{ marginBottom: 16 }}>
                      <Select
                        placeholder="Select block type"
                        style={{ width: 200 }}
                        value={editingBlockType}
                        onChange={setEditingBlockType}
                      >
                        {BLOCK_TYPES.map(type => (
                          <Select.Option key={type.value} value={type.value}>
                            {type.label}
                          </Select.Option>
                        ))}
                      </Select>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => editingBlockType && handleAddBlock(editingBlockType)}
                        disabled={!editingBlockType}
                      >
                        Add Block
                      </Button>
                    </Space>

                    {loadingBlocks ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        Loading blocks...
                      </div>
                    ) : blocks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                        No blocks yet. Add a block to get started.
                      </div>
                    ) : (
                      <div>
                        {hasUnsavedChanges && (
                          <div style={{ 
                            marginBottom: 16, 
                            padding: 12, 
                            background: '#fff7e6', 
                            border: '1px solid #ffd591',
                            borderRadius: 4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ color: '#ad6800' }}>Unsaved changes</span>
                            <Button size="small" type="primary" onClick={() => fetchBlocks(editingPage.id)}>
                              Discard Changes
                            </Button>
                          </div>
                        )}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={blocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {blocks.map((block, index) => (
                                <div key={block.id}>
                                  <SortableBlockItem
                                    block={block}
                                    index={index}
                                    totalBlocks={blocks.length}
                                    summary={getBlockSummary(block)}
                                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                                    onDelete={() => handleDeleteBlock(block.id)}
                                    onMoveUp={index > 0 ? () => handleMoveBlock(block.id, 'up') : undefined}
                                    onMoveDown={index < blocks.length - 1 ? () => handleMoveBlock(block.id, 'down') : undefined}
                                    onToggle={(enabled) => handleToggleBlock(block.id, enabled)}
                                    onOpenMediaPicker={(callback) => {
                                      setMediaSelectionCallback(() => callback);
                                      setMediaPickerVisible(true);
                                    }}
                                    fetchMediaById={fetchMediaById}
                                    isDragging={activeId === block.id}
                                  />
                                  {index < blocks.length - 1 && (
                                  <AddBlockAffordance
                                    position={index + 1}
                                    onAdd={(type) => {
                                      // Insert at position (after current block)
                                      const insertPosition = blocks[index].position + 1;
                                      handleAddBlock(type, insertPosition);
                                    }}
                                    blockTypes={BLOCK_TYPES}
                                  />
                                  )}
                                </div>
                              ))}
                            </div>
                          </SortableContext>
                          <DragOverlay>
                            {activeId ? (
                              <div style={{
                                opacity: 0.8,
                                transform: 'rotate(5deg)',
                                background: '#fff',
                                border: '2px solid #1890ff',
                                borderRadius: 8,
                                padding: 16,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              }}>
                                {(() => {
                                  const block = blocks.find(b => b.id === activeId);
                                  return block ? (
                                    <div>
                                      <div style={{ fontWeight: 500 }}>
                                        {BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type}
                                      </div>
                                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                        {getBlockSummary(block)}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            ) : null}
                          </DragOverlay>
                        </DndContext>
                        {/* Add block at the end */}
                        <AddBlockAffordance
                          position={blocks.length}
                          onAdd={(type) => {
                            handleAddBlock(type);
                          }}
                          blockTypes={BLOCK_TYPES}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    Please save the page first before adding blocks.
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* Media Picker */}
      <MediaPicker
        open={mediaPickerVisible}
        onCancel={() => {
          setMediaPickerVisible(false);
          setMediaSelectionCallback(null);
        }}
        onSelect={(mediaId) => {
          if (mediaSelectionCallback) {
            mediaSelectionCallback(mediaId);
            setMediaSelectionCallback(null);
            setMediaPickerVisible(false);
          }
        }}
        title="Select Media"
      />
    </div>
  );
}

// Sortable Block Item Component
interface SortableBlockItemProps {
  block: PageBlock;
  index: number;
  totalBlocks: number;
  summary: string;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggle: (enabled: boolean) => void;
  onOpenMediaPicker: (callback: (mediaId: number) => void) => void;
  fetchMediaById: (mediaId: number) => Promise<any>;
  isDragging: boolean;
}

function SortableBlockItem({
  block,
  index,
  totalBlocks,
  summary,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggle,
  onOpenMediaPicker,
  fetchMediaById,
  isDragging,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BlockEditor
        block={block}
        index={index}
        totalBlocks={totalBlocks}
        summary={summary}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onToggle={onToggle}
        onOpenMediaPicker={onOpenMediaPicker}
        fetchMediaById={fetchMediaById}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

// Add Block Affordance Component
interface AddBlockAffordanceProps {
  position: number;
  onAdd: (type: string) => void;
  blockTypes: typeof BLOCK_TYPES;
}

function AddBlockAffordance({ position, onAdd, blockTypes }: AddBlockAffordanceProps) {
  const [hovered, setHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        height: hovered ? 60 : 20,
        transition: 'height 0.2s',
        marginTop: -8,
        marginBottom: -8,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '2px dashed #1890ff',
              borderRadius: 8,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            onClick={() => setShowPicker(true)}
          >
            <PlusOutlined style={{ color: '#1890ff' }} />
            <span style={{ color: '#1890ff', fontSize: 14 }}>Add block here</span>
          </div>
        </div>
      )}
      {showPicker && (
        <Modal
          title="Select Block Type"
          open={showPicker}
          onCancel={() => setShowPicker(false)}
          footer={null}
          width={400}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {blockTypes.map((type) => (
              <Button
                key={type.value}
                block
                onClick={() => {
                  onAdd(type.value);
                  setShowPicker(false);
                }}
                style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{type.label}</div>
                </div>
              </Button>
            ))}
          </Space>
        </Modal>
      )}
    </div>
  );
}

// Block Editor Component
interface BlockEditorProps {
  block: PageBlock;
  index?: number;
  totalBlocks?: number;
  summary?: string;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggle: (enabled: boolean) => void;
  onOpenMediaPicker: (callback: (mediaId: number) => void) => void;
  fetchMediaById: (mediaId: number) => Promise<any>;
  dragHandleProps?: any;
  isDragging?: boolean;
}

function BlockEditor({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggle,
  onOpenMediaPicker,
  fetchMediaById,
}: BlockEditorProps) {
  const [localData, setLocalData] = useState(block.data);
  const [expanded, setExpanded] = useState(true);
  const [mediaPreviews, setMediaPreviews] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    setLocalData(block.data);
    // Load media previews for existing media IDs
    loadMediaPreviews();
  }, [block.data]);

  const loadMediaPreviews = async () => {
    const mediaIds: number[] = [];
    
    // Collect all media IDs from block data
    if (block.type === 'image-text' && localData.mediaId) {
      mediaIds.push(localData.mediaId);
    } else if (block.type === 'featured-images' && localData.mediaIds) {
      localData.mediaIds.forEach((id: number | null) => {
        if (id) mediaIds.push(id);
      });
    } else if (block.type === 'gallery' && localData.mediaIds) {
      localData.mediaIds.forEach((id: number | null) => {
        if (id) mediaIds.push(id);
      });
    }

    // Fetch media for IDs not yet in cache
    const newPreviews = new Map(mediaPreviews);
    for (const mediaId of mediaIds) {
      if (!newPreviews.has(mediaId)) {
        const media = await fetchMediaById(mediaId);
        if (media) {
          newPreviews.set(mediaId, media);
        }
      }
    }
    if (newPreviews.size !== mediaPreviews.size) {
      setMediaPreviews(newPreviews);
    }
  };

  const handleDataChange = (key: string, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onUpdate({ data: newData });
  };

  const handleArrayChange = (key: string, index: number, value: any) => {
    const newArray = [...(localData[key] || [])];
    newArray[index] = value;
    handleDataChange(key, newArray);
  };

  const handleAddArrayItem = (key: string, defaultValue: any) => {
    const newArray = [...(localData[key] || []), defaultValue];
    handleDataChange(key, newArray);
  };

  const handleRemoveArrayItem = (key: string, index: number) => {
    const newArray = [...(localData[key] || [])];
    newArray.splice(index, 1);
    handleDataChange(key, newArray);
  };

  const renderBlockEditor = () => {
    switch (block.type) {
      case 'title':
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Title text"
                value={localData.text || ''}
                onChange={(e) => handleDataChange('text', e.target.value)}
              />
            </Col>
            <Col span={12}>
              <Select
                value={localData.level || 'h1'}
                onChange={(value) => handleDataChange('level', value)}
                style={{ width: '100%' }}
              >
                <Select.Option value="h1">H1</Select.Option>
                <Select.Option value="h2">H2</Select.Option>
                <Select.Option value="h3">H3</Select.Option>
                <Select.Option value="h4">H4</Select.Option>
              </Select>
            </Col>
          </Row>
        );

      case 'text':
        return (
          <TextArea
            rows={6}
            placeholder="Text content"
            value={localData.content || ''}
            onChange={(e) => handleDataChange('content', e.target.value)}
          />
        );

      case 'image-text':
        const imageTextMedia = localData.mediaId ? mediaPreviews.get(localData.mediaId) : null;
        return (
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Space>
                <Button
                  icon={<FolderOutlined />}
                  onClick={() => {
                    onOpenMediaPicker((mediaId) => {
                      handleDataChange('mediaId', mediaId);
                      fetchMediaById(mediaId).then(media => {
                        if (media) {
                          setMediaPreviews(prev => new Map(prev).set(mediaId, media));
                        }
                      });
                    });
                  }}
                >
                  Select Image
                </Button>
                {localData.mediaId && (
                  <Button
                    danger
                    size="small"
                    onClick={() => handleDataChange('mediaId', null)}
                  >
                    Remove
                  </Button>
                )}
                {imageTextMedia && (
                  <AntImage
                    src={imageTextMedia.url_thumb || imageTextMedia.url_medium || imageTextMedia.url}
                    alt="Preview"
                    width={100}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="/images/placeholder.jpg"
                  />
                )}
              </Space>
            </div>
            <Select
              value={localData.alignment || 'left'}
              onChange={(value) => handleDataChange('alignment', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="left">Image Left</Select.Option>
              <Select.Option value="right">Image Right</Select.Option>
              <Select.Option value="top">Image Top</Select.Option>
            </Select>
            <TextArea
              rows={4}
              placeholder="Text content"
              value={localData.text || ''}
              onChange={(e) => handleDataChange('text', e.target.value)}
            />
          </Space>
        );

      case 'youtube':
        return (
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Input
              placeholder="YouTube Video ID"
              value={localData.videoId || ''}
              onChange={(e) => handleDataChange('videoId', e.target.value)}
            />
            <Input
              placeholder="Video Title (optional)"
              value={localData.title || ''}
              onChange={(e) => handleDataChange('title', e.target.value)}
            />
          </Space>
        );

      case 'featured-images':
        const mediaIds = localData.mediaIds || [null, null, null];
        return (
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            {[0, 1, 2].map((index) => {
              const mediaId = mediaIds[index];
              const media = mediaId ? mediaPreviews.get(mediaId) : null;
              return (
                <Card key={index} size="small" style={{ background: '#fafafa' }}>
                  <Space orientation="vertical" style={{ width: '100%' }} size="small">
                    <Space>
                      <Button
                        icon={<FolderOutlined />}
                        onClick={() => {
                          onOpenMediaPicker((selectedMediaId) => {
                            const newMediaIds = [...mediaIds];
                            newMediaIds[index] = selectedMediaId;
                            handleDataChange('mediaIds', newMediaIds);
                            fetchMediaById(selectedMediaId).then(m => {
                              if (m) {
                                setMediaPreviews(prev => new Map(prev).set(selectedMediaId, m));
                              }
                            });
                          });
                        }}
                        size="small"
                      >
                        Select Image {index + 1}
                      </Button>
                      {mediaId && (
                        <Button
                          danger
                          size="small"
                          onClick={() => {
                            const newMediaIds = [...mediaIds];
                            newMediaIds[index] = null;
                            handleDataChange('mediaIds', newMediaIds);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </Space>
                    {media && (
                      <AntImage
                        src={media.url_thumb || media.url_medium || media.url}
                        alt={`Featured ${index + 1}`}
                        width={150}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="/images/placeholder.jpg"
                      />
                    )}
                  <Input
                    placeholder={`Title ${index + 1}`}
                    value={(localData.titles || [])[index] || ''}
                    onChange={(e) => handleArrayChange('titles', index, e.target.value)}
                    size="small"
                  />
                    <Input
                      placeholder={`Link ${index + 1} (optional)`}
                      value={(localData.links || [])[index] || ''}
                      onChange={(e) => handleArrayChange('links', index, e.target.value)}
                      size="small"
                    />
                  </Space>
                </Card>
              );
            })}
          </Space>
        );

      case 'gallery':
        const galleryMediaIds = localData.mediaIds || [];
        return (
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleAddArrayItem('mediaIds', null)}
            >
              Add Image
            </Button>
            {galleryMediaIds.map((mediaId: number | null, index: number) => {
              const media = mediaId ? mediaPreviews.get(mediaId) : null;
              return (
                <Card key={index} size="small" style={{ background: '#fafafa' }}>
                  <Space>
                    <Button
                      icon={<FolderOutlined />}
                      onClick={() => {
                        onOpenMediaPicker((selectedMediaId) => {
                          const newMediaIds = [...galleryMediaIds];
                          newMediaIds[index] = selectedMediaId;
                          handleDataChange('mediaIds', newMediaIds);
                          fetchMediaById(selectedMediaId).then(m => {
                            if (m) {
                              setMediaPreviews(prev => new Map(prev).set(selectedMediaId, m));
                            }
                          });
                        });
                      }}
                      size="small"
                    >
                      Select
                    </Button>
                    {media && (
                      <AntImage
                        src={media.url_thumb || media.url_medium || media.url}
                        alt={`Gallery ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="/images/placeholder.jpg"
                      />
                    )}
                    <Button
                      danger
                      icon={<DeleteFilled />}
                      onClick={() => handleRemoveArrayItem('mediaIds', index)}
                      size="small"
                    />
                    {index > 0 && (
                      <Button
                        icon={<ArrowUpOutlined />}
                        onClick={() => {
                          const newMediaIds = [...galleryMediaIds];
                          [newMediaIds[index - 1], newMediaIds[index]] = [newMediaIds[index], newMediaIds[index - 1]];
                          handleDataChange('mediaIds', newMediaIds);
                        }}
                        size="small"
                      />
                    )}
                    {index < galleryMediaIds.length - 1 && (
                      <Button
                        icon={<ArrowDownOutlined />}
                        onClick={() => {
                          const newMediaIds = [...galleryMediaIds];
                          [newMediaIds[index], newMediaIds[index + 1]] = [newMediaIds[index + 1], newMediaIds[index]];
                          handleDataChange('mediaIds', newMediaIds);
                        }}
                        size="small"
                      />
                    )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        );

      default:
        return <div>Unknown block type: {block.type}</div>;
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        border: block.enabled ? '1px solid #d9d9d9' : '1px dashed #d9d9d9',
        opacity: block.enabled ? 1 : 0.6,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space style={{ flex: 1, minWidth: 0 }}>
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                style={{
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  marginLeft: -8,
                  marginRight: 8,
                  borderRadius: 4,
                  color: '#999',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <MenuOutlined style={{ fontSize: 16 }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>
                  {BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type}
                </span>
                <Tag color={block.enabled ? 'green' : 'default'} style={{ margin: 0 }}>
                  {block.enabled ? 'Enabled' : 'Hidden'}
                </Tag>
              </div>
              {summary && (
                <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {summary}
                </div>
              )}
            </div>
          </Space>
          <Space>
            <Switch
              checked={block.enabled}
              onChange={onToggle}
              size="small"
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
            />
            {onMoveUp && (
              <Tooltip title="Move up">
                <Button
                  type="text"
                  icon={<UpOutlined />}
                  onClick={onMoveUp}
                  size="small"
                />
              </Tooltip>
            )}
            {onMoveDown && (
              <Tooltip title="Move down">
                <Button
                  type="text"
                  icon={<DownOutlined />}
                  onClick={onMoveDown}
                  size="small"
                />
              </Tooltip>
            )}
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <Button
                type="text"
                size="small"
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setExpanded(!expanded)}
              />
            </Tooltip>
            <Popconfirm
              title="Delete block"
              description="Are you sure you want to delete this block?"
              onConfirm={onDelete}
              okText="Yes"
              cancelText="No"
              okType="danger"
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      }
    >
      {expanded && (
        <div style={{ paddingTop: 16 }}>
          {renderBlockEditor()}
        </div>
      )}
    </Card>
  );
}
