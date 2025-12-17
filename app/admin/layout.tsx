"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Layout, Menu, theme, Button } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  PictureOutlined,
  FileTextOutlined,
  SettingOutlined,
  FolderOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Sider, Header, Content } = Layout;

const menuItems = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: <Link href="/admin">Dashboard</Link>,
  },
  {
    key: '/admin/products',
    icon: <ShoppingOutlined />,
    label: <Link href="/admin/products">Products</Link>,
  },
  {
    key: '/admin/categories',
    icon: <AppstoreOutlined />,
    label: <Link href="/admin/categories">Categories</Link>,
  },
  {
    key: '/admin/hero-slides',
    icon: <PictureOutlined />,
    label: <Link href="/admin/hero-slides">Hero Slides</Link>,
  },
  {
    key: '/admin/news',
    icon: <FileTextOutlined />,
    label: <Link href="/admin/news">News</Link>,
  },
  {
    key: '/admin/pages',
    icon: <FolderOutlined />,
    label: <Link href="/admin/pages">Pages</Link>,
  },
  {
    key: '/admin/media',
    icon: <PictureOutlined />,
    label: <Link href="/admin/media">Media Pool</Link>,
  },
  // {
  //   key: '/admin/team',
  //   icon: <TeamOutlined />,
  //   label: <Link href="/admin/team">Team Members</Link>,
  // },
  {
    key: '/admin/orders',
    icon: <ShoppingCartOutlined />,
    label: <Link href="/admin/orders">Orders</Link>,
  },
  {
    key: '/admin/users',
    icon: <UserOutlined />,
    label: <Link href="/admin/users">Users</Link>,
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: <Link href="/admin/settings">Settings</Link>,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible={!isMobile}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={200}
        collapsedWidth={isMobile ? 0 : 64}
        breakpoint="lg"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          background: '#f5f5f5',
          borderRight: '1px solid #e8e8e8',
        }}
        trigger={null}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#595959',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #e8e8e8',
          }}
        >
          {collapsed ? 'B' : 'Bridge Admin'}
        </div>
            <Menu
              theme="light"
              mode="inline"
              selectedKeys={mounted ? [pathname] : []}
              items={menuItems}
              style={{ 
                borderRight: 0,
                background: 'transparent',
              }}
            />
      </Sider>
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
          }}
          onClick={() => setCollapsed(true)}
        />
      )}
      <Layout 
        style={{ 
          marginLeft: isMobile ? 0 : (collapsed ? 64 : 200),
          transition: 'margin-left 0.2s',
          width: '100%',
        }}
      >
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{
                fontSize: 16,
                width: 40,
                height: 40,
              }}
            />
            <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 600 }}>
              Admin Panel
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ color: '#1890ff', fontSize: isMobile ? 14 : 16 }}>
              View Site
            </Link>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? '16px 8px' : '24px 16px',
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

