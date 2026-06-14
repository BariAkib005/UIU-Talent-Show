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
    bio TEXT NULL,
    profile_pic VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Submissions / Performances Table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type ENUM('video', 'audio', 'blog') NOT NULL,
    category VARCHAR(100) NULL,
    tags VARCHAR(255) NULL,
    file_path VARCHAR(255) NULL,           -- Path to video/audio file or blog text file
    blog_content TEXT NULL,                -- For text blogs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Likes Table
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    submission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_like (user_id, submission_id) -- Prevent double liking
);

-- 4. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    submission_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- 5. Weekly Poll Votes Table
CREATE TABLE IF NOT EXISTS weekly_poll_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    candidate_id INT NOT NULL,
    week_start DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_weekly_vote (voter_id, week_start)
);

