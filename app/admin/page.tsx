import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons';

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={13}
              prefix={<ShoppingOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Categories"
              value={8}
              prefix={<AppstoreOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="News Articles"
              value={0}
              prefix={<FileTextOutlined />}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Users"
              value={0}
              prefix={<UserOutlined />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Quick Actions" style={{ marginTop: 24 }}>
        <p>Welcome to the Bridge Admin Panel. Use the navigation menu to manage your content.</p>
      </Card>
    </div>
  );
}

