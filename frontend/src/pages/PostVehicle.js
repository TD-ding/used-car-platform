import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function PostVehicle() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    brand: '', model: '', year: '', mileage: '', price: '',
    description: '', condition_type: 'good', fuel_type: 'gasoline',
    transmission: 'automatic', location: ''
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 8) return alert('最多上传8张图片');
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      images.forEach(img => formData.append('images', img));
      await api.post('/vehicles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/my-vehicles');
    } catch (err) {
      setError(err.response?.data?.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>📝 发布车辆</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="form-group">
            <label>品牌 *</label>
            <input name="brand" className="form-control" placeholder="如：丰田" value={form.brand} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>型号 *</label>
            <input name="model" className="form-control" placeholder="如：凯美瑞" value={form.model} onChange={handleChange} required />
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>年份 *</label>
            <input name="year" type="number" className="form-control" placeholder="2023" value={form.year} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>价格（元）*</label>
            <input name="price" type="number" className="form-control" placeholder="150000" value={form.price} onChange={handleChange} required />
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>里程（km）</label>
            <input name="mileage" type="number" className="form-control" placeholder="50000" value={form.mileage} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>地点</label>
            <input name="location" className="form-control" placeholder="北京" value={form.location} onChange={handleChange} />
          </div>
        </div>
        <div className="grid grid-3">
          <div className="form-group">
            <label>车况</label>
            <select name="condition_type" className="form-control" value={form.condition_type} onChange={handleChange}>
              <option value="excellent">极好</option>
              <option value="good">良好</option>
              <option value="fair">一般</option>
              <option value="poor">较差</option>
            </select>
          </div>
          <div className="form-group">
            <label>燃料类型</label>
            <select name="fuel_type" className="form-control" value={form.fuel_type} onChange={handleChange}>
              <option value="gasoline">汽油</option>
              <option value="diesel">柴油</option>
              <option value="electric">电动</option>
              <option value="hybrid">混动</option>
            </select>
          </div>
          <div className="form-group">
            <label>变速箱</label>
            <select name="transmission" className="form-control" value={form.transmission} onChange={handleChange}>
              <option value="automatic">自动挡</option>
              <option value="manual">手动挡</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>描述</label>
          <textarea name="description" className="form-control" rows={4} placeholder="详细描述车辆情况..."
            value={form.description} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>图片（最多8张）</label>
          <input type="file" className="form-control" multiple accept="image/*" onChange={handleImageChange} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? '发布中...' : '发布车辆'}
        </button>
      </form>
    </div>
  );
}
