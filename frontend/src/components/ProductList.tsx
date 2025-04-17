import React, { useState, useEffect } from 'react';
import Table from 'antd/lib/table';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import Modal from 'antd/lib/modal';
import message from 'antd/lib/message';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types/product';
import { deleteProduct } from '../services/api';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ProductForm from './ProductForm';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching products from /api/products');
      const response = await api.get('/api/products');
      console.log('Products fetched:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalVisible(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await api.delete(`/api/products/${product.id}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Failed to delete product');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="product-list">
      <div className="product-list-header">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProduct(null);
            setIsModalVisible(true);
          }}
          style={{ marginBottom: 16 }}
        >
          Add Product
        </Button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingProduct ? "编辑产品" : "新建产品"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <ProductForm
          visible={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setIsModalVisible(false);
            setEditingProduct(null);
            fetchProducts();
          }}
          initialValues={editingProduct}
        />
      </Modal>
    </div>
  );
};

export default ProductList; 