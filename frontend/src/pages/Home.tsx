import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Home.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  createdAt: string;
}

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取产品列表失败');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-brand">产品管理系统</div>
        <div className="nav-user">
          <span>欢迎, {user?.name}</span>
          <button onClick={handleLogout} className="logout-button">
            退出登录
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="header">
          <h1>产品列表</h1>
          <button className="add-button" onClick={() => navigate('/products/new')}>
            添加产品
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <h3>{product.name}</h3>
              <p className="description">{product.description}</p>
              <p className="price">¥{product.price}</p>
              <p className="category">{product.category}</p>
              <div className="card-actions">
                <button
                  onClick={() => navigate(`/products/${product._id}/edit`)}
                  className="edit-button"
                >
                  编辑
                </button>
                <button
                  onClick={() => navigate(`/products/${product._id}`)}
                  className="view-button"
                >
                  查看
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home; 