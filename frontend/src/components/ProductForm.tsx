import React from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Select from 'antd/lib/select';
import Button from 'antd/lib/button';
import { api } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface ProductFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: {
    id?: number;
    name?: string;
    description?: string;
    price?: number;
    category?: string;
  } | null;
}

interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  category: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm<ProductFormValues>();

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      if (initialValues?.id) {
        await api.put(`/products/${initialValues.id}`, values);
      } else {
        await api.post('/products', values);
      }
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues || {}}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please input the product name!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please input the product description!' }]}
      >
        <TextArea rows={4} />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price"
        rules={[{ required: true, message: 'Please input the product price!' }]}
      >
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          prefix="$"
        />
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: 'Please select the product category!' }]}
      >
        <Select>
          <Option value="electronics">Electronics</Option>
          <Option value="clothing">Clothing</Option>
          <Option value="books">Books</Option>
          <Option value="home">Home</Option>
          <Option value="other">Other</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          {initialValues?.id ? 'Update' : 'Create'}
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={onCancel}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm; 