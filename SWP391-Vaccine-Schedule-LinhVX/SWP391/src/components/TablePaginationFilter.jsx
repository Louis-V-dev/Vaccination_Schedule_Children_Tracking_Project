import React from 'react';
import { Row, Col, Form, InputGroup, Pagination, Button, Dropdown } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const TablePaginationFilter = ({
    page,
    totalPages,
    pageSize,
    totalElements,
    sortField,
    sortDirection,
    filterText,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFilterChange,
    sortOptions = [],
    pageSizeOptions = [10, 25, 50, 100]
}) => {
    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            onPageChange(newPage);
        }
    };

    const handleSortChange = (field) => {
        const newDirection = field === sortField 
            ? (sortDirection === 'asc' ? 'desc' : 'asc')
            : 'asc';
        onSortChange(field, newDirection);
    };

    const getSortIcon = (field) => {
        if (field !== sortField) return <FaSort />;
        return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    return (
        <Row className="align-items-center mb-3">
            <Col md={4}>
                <InputGroup>
                    <InputGroup.Text>
                        <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="Search..."
                        value={filterText}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                </InputGroup>
            </Col>
            
            <Col md={4} className="d-flex align-items-center">
                <span className="me-2">Sort by:</span>
                <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary">
                        {sortOptions.find(opt => opt.value === sortField)?.label || 'Select field'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {sortOptions.map(option => (
                            <Dropdown.Item 
                                key={option.value}
                                onClick={() => handleSortChange(option.value)}
                            >
                                {option.label} {getSortIcon(option.value)}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </Col>

            <Col md={4} className="d-flex justify-content-end align-items-center">
                <Form.Select
                    className="w-auto me-2"
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    {pageSizeOptions.map(size => (
                        <option key={size} value={size}>
                            {size} per page
                        </option>
                    ))}
                </Form.Select>

                <Pagination className="mb-0">
                    <Pagination.First
                        onClick={() => handlePageChange(0)}
                        disabled={page === 0}
                    />
                    <Pagination.Prev
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0}
                    />

                    {[...Array(totalPages)].map((_, idx) => {
                        if (
                            idx === 0 ||
                            idx === totalPages - 1 ||
                            (idx >= page - 1 && idx <= page + 1)
                        ) {
                            return (
                                <Pagination.Item
                                    key={idx}
                                    active={idx === page}
                                    onClick={() => handlePageChange(idx)}
                                >
                                    {idx + 1}
                                </Pagination.Item>
                            );
                        } else if (idx === page - 2 || idx === page + 2) {
                            return <Pagination.Ellipsis key={idx} />;
                        }
                        return null;
                    })}

                    <Pagination.Next
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages - 1}
                    />
                    <Pagination.Last
                        onClick={() => handlePageChange(totalPages - 1)}
                        disabled={page === totalPages - 1}
                    />
                </Pagination>

                <span className="ms-3">
                    {totalElements} total items
                </span>
            </Col>
        </Row>
    );
};

export default TablePaginationFilter; 