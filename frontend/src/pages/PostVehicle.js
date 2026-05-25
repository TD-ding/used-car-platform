import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const POPULAR_BRANDS = ['丰田', '本田', '大众', '宝马', '奔驰', '奥迪', '比亚迪', '特斯拉', '日产', '别克', '福特', '现代'];

export default function PostVehicle() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    brand: '', model: '', year: '', mileage: '', price: '',
    description: '', condition_type: 'good', fuel_type: 'gasoline',
    transmission: 'automatic', location: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) return setError('最多上传8张图片');
    setImages(prev => [...prev, ...files].slice(0, 8));

    // 生成预览
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target.result].slice(0, 8));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!form.brand.trim()) return '请填写品牌';
    if (!form.model.trim()) return '请填写型号';
    if (!form.year || form.year < 1990 || form.year > new Date().getFullYear() + 1) return '请填写合理的年份';
    if (!form.price || parseFloat(form.price) <= 0) return '请填写有效的价格';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

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
      <h1 style={{ marginBottom: '24px' }}>发布车辆</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="form-group">
            <label>品牌 *</label>
            <input name="brand" className="form-control" placeholder="如：丰田"
              value={form.brand} onChange={handleChange} required list="brand-list" />
            <datalist id="brand-list">
              {POPULAR_BRANDS.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label>型号 *</label>
            <input name="model" className="form-control" placeholder="如：凯美瑞"
              value={form.model} onChange={handleChange} required />
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>年份 * ({new Date().getFullYear()})</label>
            <input name="year" type="number" className="form-control" placeholder="2023"
              min="1990" max={new Date().getFullYear() + 1}
              value={form.year} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>价格（元）*</label>
            <input name="price" type="number" className="form-control" placeholder="150000"
              min="1" step="100"
              value={form.price} onChange={handleChange} required />
            {form.price && <span style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
              约 {(parseFloat(form.price) / 10000).toFixed(2)} 万元
            </span>}
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>里程（km）</label>
            <input name="mileage" type="number" className="form-control" placeholder="50000"
              min="0" value={form.mileage} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>地点</label>
            <input name="location" className="form-control" placeholder="北京"
              value={form.location} onChange={handleChange} />
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
          <textarea name="description" className="form-control" rows={4} placeholder="详细描述车辆情况，如：有无事故、保养记录等..."
            value={form.description} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>图片（最多8张，支持 JPG/PNG/WebP）</label>
          <input type="file" className="form-control" multiple accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange} />
          {imagePreviews.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {imagePreviews.map((preview, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={preview} alt={`预览${i + 1}`}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  <button type="button" onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                      borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none',
                      fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? '发布中...' : '发布车辆'}
        </button>
      </form>
    </div>
  );
}
