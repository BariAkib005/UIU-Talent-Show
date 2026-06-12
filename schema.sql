CREATE DATABASE IF NOT EXISTS uiu_talent_show;
USE uiu_talent_show;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL, -- Format: "011 201 000"
    email VARCHAR(255) UNIQUE NOT NULL,    -- Format: "name@bscse.uiu.ac.bd"
    department VARCHAR(50) NOT NULL,       -- CSE, EEE, BBA, ENG etc.
    batch VARCHAR(50) NOT NULL,            -- Fall 2023, Spring 2024 etc.
    password VARCHAR(255) NOT NULL,        -- Hashed password (bcrypt)
    is_verified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(6) NULL,                   -- Temporary code for simulation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Submissions / Performances Table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type ENUM('video', 'audio', 'blog') NOT NULL,
    file_path VARCHAR(255) NULL,           -- Path to video/audio file or blog text file
    blog_content TEXT NULL,                -- For text blogs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Votes Table
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    submission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vote (user_id, submission_id) -- Prevent double voting
);
