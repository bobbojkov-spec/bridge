"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  message,
  Space,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { SaveOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  active: boolean;
  image?: string;
}

export default function SettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<{
    position1: string | null;
    position2: string | null;
    position3: string | null;
    position4: string | null;
    position5: string | null;
    position6: string | null;
  }>({
    position1: null,
    position2: null,
    position3: null,
    position4: null,
    position5: null,
    position6: null,
  });

  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?pageSize=1000&active=true');
      const result = await response.json();
      if (result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/settings/featured-products');
      const result = await response.json();
      if (result.data) {
        setFeaturedProducts({
          position1: result.data.position1?.id || null,
          position2: result.data.position2?.id || null,
          position3: result.data.position3?.id || null,
          position4: result.data.position4?.id || null,
          position5: result.data.position5?.id || null,
          position6: result.data.position6?.id || null,
        });
      }
    } catch (error) {
      message.error('Failed to fetch featured products');
      console.error('Error fetching featured products:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving featured products:', featuredProducts);
      const response = await fetch('/api/settings/featured-products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(featuredProducts),
      });

      const result = await response.json();
      console.log('💾 Response:', result);

      if (response.ok) {
        message.success('Featured products saved successfully');
      } else {
        console.error('💾 Error response:', result);
        message.error(result.error || result.details || 'Failed to save featured products');
      }
    } catch (error) {
      console.error('💾 Error saving featured products:', error);
      message.error('Failed to save featured products');
    } finally {
      setSaving(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const response = await fetch('/api/settings/migrate-featured-products');
      const result = await response.json();
      
      if (response.ok) {
        message.success(result.message || 'Migration completed successfully');
      } else {
        message.error(result.error || 'Migration failed');
      }
    } catch (error) {
      message.error('Failed to run migration');
      console.error('Error running migration:', error);
    } finally {
      setMigrating(false);
    }
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return null;
    const product = products.find(p => p.id === productId);
    return product ? product.name : null;
  };

  const positionLabels = [
    { key: 'position1', label: 'First Position' },
    { key: 'position2', label: 'Second Position' },
    { key: 'position3', label: 'Third Position' },
    { key: 'position4', label: 'Fourth Position' },
    { key: 'position5', label: 'Fifth Position' },
    { key: 'position6', label: 'Sixth Position' },
  ];

  return (
    <div>
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>Front Page Featured Products</Title>
            <Text type="secondary">
              Select which products appear in each of the 6 featured positions on the front page.
            </Text>
          </div>

          <Alert
            title="Database Setup Required"
            description="If you see errors, you may need to run the database migration first to add the featured product columns."
            type="info"
            showIcon
            action={
              <Button
                size="small"
                icon={<DatabaseOutlined />}
                onClick={handleMigrate}
                loading={migrating}
              >
                Run Migration
              </Button>
            }
            style={{ marginBottom: 24 }}
          />

          <Divider />

          <Row gutter={[16, 24]}>
            {positionLabels.map(({ key, label }) => (
              <Col xs={24} sm={12} lg={8} key={key}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {label}
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Select a product"
                    value={featuredProducts[key as keyof typeof featuredProducts]}
                    onChange={(value) => {
                      setFeaturedProducts({
                        ...featuredProducts,
                        [key]: value,
                      });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    loading={loading}
                  >
                    {products.map((product) => (
                      <Select.Option
                        key={product.id}
                        value={product.id}
                        label={product.name}
                        disabled={
                          Object.values(featuredProducts).includes(product.id) &&
                          featuredProducts[key as keyof typeof featuredProducts] !== product.id
                        }
                      >
                        {product.name} {product.active ? '' : '(Inactive)'}
                      </Select.Option>
                    ))}
                  </Select>
                  {featuredProducts[key as keyof typeof featuredProducts] && (
                    <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                      Selected: {getProductName(featuredProducts[key as keyof typeof featuredProducts])}
                    </Text>
                  )}
                </div>
              </Col>
            ))}
          </Row>

          <Divider />

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            size="large"
          >
            Save Featured Products
          </Button>
        </Space>
      </Card>
    </div>
  );
}
