import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { toast } from 'react-toastify';
import vaccineListService from '../services/vaccineListService';
import '../css/VaccineList.css';

const VaccineList = () => {
    const [vaccines, setVaccines] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const vaccinesPerPage = 10;

    useEffect(() => {
        fetchVaccines();
    }, [currentPage]);

    const fetchVaccines = async () => {
        try {
            setLoading(true);
            const result = await vaccineListService.getAllVaccines(currentPage - 1, vaccinesPerPage);
            console.log('Fetched vaccines:', result);
            setVaccines(result.vaccines || []);
            setTotalPages(result.totalPages || 1);
        } catch (error) {
            console.error('Error fetching vaccines:', error);
            toast.error('Failed to load vaccines');
            setVaccines([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, text.lastIndexOf(' ', maxLength)) + '...';
    };

    const handleVaccineClick = (vaccineId) => {
        navigate(`/vaccine/${vaccineId}`);
    };

    return (
        <div>
            <NavBar />
            <Container className="vaccine-list-container my-5">
                <h2 className="text-center mb-4">Available Vaccines</h2>
                {loading ? (
                    <div className="text-center">Loading vaccines...</div>
                ) : vaccines.length === 0 ? (
                    <div className="text-center">No vaccines available</div>
                ) : (
                    <>
                        <Row>
                            {vaccines.map((vaccine) => (
                                <Col md={6} className="mb-4" key={vaccine.id || vaccine.vaccineId}>
                                    <div 
                                        className="vaccine-card" 
                                        onClick={() => handleVaccineClick(vaccine.id || vaccine.vaccineId)}
                                    >
                                        <div className="vaccine-image-container">
                                            <img 
                                                src={vaccine.imagineUrl ? 
                                                    `http://localhost:8080/api/vaccines/images/${vaccine.imagineUrl}` : 
                                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}
                                                alt={vaccine.name}
                                                className="vaccine-image"
                                                onError={(e) => {
                                                    console.error('Image load error for:', vaccine.imagineUrl);
                                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                                }}
                                            />
                                        </div>
                                        <div className="vaccine-content">
                                            <h3 className="vaccine-name">{vaccine.name}</h3>
                                            <p className="vaccine-description">
                                                {truncateText(vaccine.description, 150)}
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.First 
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(1)}
                                    />
                                    <Pagination.Prev 
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                    />
                                    
                                    {[...Array(totalPages)].map((_, index) => (
                                        <Pagination.Item
                                            key={index + 1}
                                            active={currentPage === index + 1}
                                            onClick={() => handlePageChange(index + 1)}
                                        >
                                            {index + 1}
                                        </Pagination.Item>
                                    ))}
                                    
                                    <Pagination.Next 
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                    />
                                    <Pagination.Last 
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(totalPages)}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default VaccineList; 