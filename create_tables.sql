-- Drop tables if they exist to allow for clean creation
DROP TABLE IF EXISTS combo_detail;
DROP TABLE IF EXISTS combo_category_detail;
DROP TABLE IF EXISTS vaccine_combo;
DROP TABLE IF EXISTS combo_category;

-- Create combo_category table
CREATE TABLE combo_category (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    status BIT DEFAULT 1
);

-- Create vaccine_combo table
CREATE TABLE vaccine_combo (
    combo_id INT IDENTITY(1,1) PRIMARY KEY,
    combo_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10, 2),
    sale_off DECIMAL(5, 2) DEFAULT 0,
    min_age INT,
    max_age INT,
    status BIT DEFAULT 1,
    category_id INT
);

-- Create combo_detail (junction table for vaccine_combo and vaccine)
CREATE TABLE combo_detail (
    combo_id INT NOT NULL,
    vaccine_id INT NOT NULL,
    dose INT,
    age_group VARCHAR(50),
    sale_off DECIMAL(5, 2) DEFAULT 0,
    PRIMARY KEY (combo_id, vaccine_id),
    FOREIGN KEY (combo_id) REFERENCES vaccine_combo(combo_id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES vaccine(id) ON DELETE CASCADE
);

-- Create combo_category_detail (junction table for vaccine_combo and combo_category)
CREATE TABLE combo_category_detail (
    combo_id INT NOT NULL,
    category_id INT NOT NULL,
    description VARCHAR(500),
    is_primary BIT DEFAULT 0,
    PRIMARY KEY (combo_id, category_id),
    FOREIGN KEY (combo_id) REFERENCES vaccine_combo(combo_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES combo_category(category_id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_combo_detail_vaccine_id ON combo_detail(vaccine_id);
CREATE INDEX idx_combo_category_detail_category_id ON combo_category_detail(category_id); 