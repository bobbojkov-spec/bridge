"use client";

import { useState, useEffect } from 'react';
import { Button, Modal, Input } from 'antd';
import { BugOutlined, CopyOutlined } from '@ant-design/icons';

interface DebugWindowProps {
  error?: any;
  data?: any;
  title?: string;
}

export default function DebugWindow({ error, data, title = "Debug Information" }: DebugWindowProps) {
  const [visible, setVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // Always set debug info, even if no error or data
    try {
      const info = {
        timestamp: new Date().toISOString(),
        error: error ? {
          message: error?.message || error?.error || String(error),
          details: error?.details || error?.response?.data?.details,
          stack: error?.stack,
          response: error?.response?.data,
          fullError: error ? (typeof error === 'object' ? Object.fromEntries(Object.entries(error).filter(([_, v]) => v !== undefined)) : error) : null,
        } : null,
        data: data || null,
      };
      setDebugInfo(JSON.stringify(info, null, 2));
    } catch (e) {
      setDebugInfo(`Error creating debug info: ${String(e)}\n\nOriginal error: ${String(error)}`);
    }
  }, [error, data]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(debugInfo);
      // Success - could show a message
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Always show for testing
  // Always show the button for testing
  // if (!error && !data) return null;

  return (
    <>
      <Button
        type="primary"
        danger
        icon={<BugOutlined />}
        onClick={() => setVisible(true)}
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
      >
        Debug
      </Button>
      <Modal
        title={title}
        open={visible}
        onCancel={() => setVisible(false)}
        width={800}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyToClipboard}>
            Copy to Clipboard
          </Button>,
          <Button key="close" onClick={() => setVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Input.TextArea
          value={debugInfo}
          readOnly
          rows={20}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>
    </>
  );
}

