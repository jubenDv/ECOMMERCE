import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminCarousel = () => {
  const [carouselImages, setCarouselImages] = useState([]);
  const [newCarouselImage, setNewCarouselImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const checkToken = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
    return !!token;
  }, [navigate]);

  useEffect(() => {
    if (!checkToken()) return;
    setLoading(true);
    fetch('http://localhost:5000/api/carousel', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    })
      .then((res) => res.ok ? res.json() : (() => { throw new Error('Failed to fetch carousel images'); })())
      .then((data) => { setCarouselImages(data); setLoading(false); })
      .catch(() => { setErrorMessage('Failed to fetch carousel images. Please try again.'); setLoading(false); });
  }, [checkToken]);

  const handleUploadCarouselImage = () => {
    if (!checkToken() || !newCarouselImage) return setErrorMessage('Please select an image');
    const formData = new FormData();
    formData.append('image', newCarouselImage);
    fetch('http://localhost:5000/api/carousel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData,
    })
      .then((res) => res.ok ? res.json() : (() => { throw new Error('Failed to upload carousel image'); })())
      .then((data) => {
        setCarouselImages([...carouselImages, data]);
        setNewCarouselImage(null);
        setPreviewImage(null);
        setErrorMessage('');
        setSuccessMessage('Image uploaded successfully!');
        document.getElementById('fileInput').value = '';
      })
      .catch(() => setErrorMessage('Failed to upload carousel image. Please try again.'));
  };

  const handleDeleteCarouselImage = (id) => {
    if (!checkToken()) return;
    fetch(`http://localhost:5000/api/carousel/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    })
      .then((res) => res.ok ? res.json() : (() => { throw new Error('Failed to delete carousel image'); })())
      .then((data) => {
        if (!data.error) {
          setCarouselImages(carouselImages.filter((image) => image.id !== id));
          setSuccessMessage('Image deleted successfully!');
        }
      })
      .catch(() => setErrorMessage('Failed to delete carousel image. Please try again.'));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewCarouselImage(file);
    setPreviewImage(file ? URL.createObjectURL(file) : null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h3>Manage Homepage Carousel</h3>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} />
      {previewImage && <img src={previewImage} alt="Preview" width="150" />}
      <button onClick={handleUploadCarouselImage}>Upload</button>
      <div className="carousel-preview">
        {carouselImages.length > 0 ? carouselImages.map((image) => (
          <div key={image.id} className="carousel-item">
            <img src={`http://localhost:5000${image.image_path}`} alt="Carousel" width="150" />
            <button onClick={() => handleDeleteCarouselImage(image.id)}>Delete</button>
          </div>
        )) : <p>No carousel images found.</p>}
      </div>
    </div>
  );
};

export default AdminCarousel;