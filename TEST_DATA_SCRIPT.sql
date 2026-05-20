-- Test Data Script for Simple Performance Dashboard
-- Run this after creating the tables to populate with sample data

-- Insert sample countries
INSERT INTO countries (name, code) VALUES 
('Kenya', 'KEN'),
('Uganda', 'UGA'),
('Tanzania', 'TZA'),
('Rwanda', 'RWA'),
('Burundi', 'BDI'),
('Ethiopia', 'ETH'),
('Somalia', 'SOM'),
('South Sudan', 'SSD');

-- Insert sample reports for 2024
INSERT INTO reports (country_id, title, status, submitted_at, approved_at) VALUES
-- Kenya 2024
(1, 'Q1 Economic Report 2024', 'APPROVED', '2024-01-15 10:00:00', '2024-02-01 14:30:00'),
(1, 'Q2 Economic Report 2024', 'APPROVED', '2024-04-15 10:00:00', '2024-05-01 14:30:00'),
(1, 'Q3 Economic Report 2024', 'UNDER_REVIEW', '2024-07-15 10:00:00', NULL),
(1, 'Q4 Economic Report 2024', 'SUBMITTED', '2024-10-15 10:00:00', NULL),

-- Uganda 2024
(2, 'Annual Budget Report 2024', 'APPROVED', '2024-01-20 10:00:00', '2024-02-15 14:30:00'),
(2, 'Infrastructure Development 2024', 'APPROVED', '2024-03-20 10:00:00', '2024-04-15 14:30:00'),
(2, 'Education Sector Report 2024', 'REJECTED', '2024-05-20 10:00:00', '2024-06-15 14:30:00'),
(2, 'Healthcare Report 2024', 'UNDER_REVIEW', '2024-07-20 10:00:00', NULL),

-- Tanzania 2024
(3, 'Tourism Report 2024', 'APPROVED', '2024-01-25 10:00:00', '2024-02-20 14:30:00'),
(3, 'Mining Sector Report 2024', 'APPROVED', '2024-03-25 10:00:00', '2024-04-20 14:30:00'),
(3, 'Agriculture Report 2024', 'APPROVED', '2024-05-25 10:00:00', '2024-06-20 14:30:00'),
(3, 'Energy Report 2024', 'UNDER_REVIEW', '2024-07-25 10:00:00', NULL),

-- Rwanda 2024
(4, 'Technology Report 2024', 'APPROVED', '2024-01-30 10:00:00', '2024-02-25 14:30:00'),
(4, 'Innovation Report 2024', 'APPROVED', '2024-03-30 10:00:00', '2024-04-25 14:30:00'),
(4, 'Digital Economy 2024', 'REJECTED', '2024-05-30 10:00:00', '2024-06-25 14:30:00'),
(4, 'Smart City Report 2024', 'UNDER_REVIEW', '2024-07-30 10:00:00', NULL),

-- Burundi 2024
(5, 'Peace Report 2024', 'APPROVED', '2024-02-05 10:00:00', '2024-03-01 14:30:00'),
(5, 'Reconstruction Report 2024', 'APPROVED', '2024-04-05 10:00:00', '2024-05-01 14:30:00'),
(5, 'Development Report 2024', 'UNDER_REVIEW', '2024-06-05 10:00:00', NULL),

-- Ethiopia 2024
(6, 'Industrial Report 2024', 'APPROVED', '2024-02-10 10:00:00', '2024-03-05 14:30:00'),
(6, 'Manufacturing Report 2024', 'APPROVED', '2024-04-10 10:00:00', '2024-05-05 14:30:00'),
(6, 'Export Report 2024', 'UNDER_REVIEW', '2024-06-10 10:00:00', NULL),

-- Somalia 2024
(7, 'Security Report 2024', 'APPROVED', '2024-02-15 10:00:00', '2024-03-10 14:30:00'),
(7, 'Humanitarian Report 2024', 'UNDER_REVIEW', '2024-04-15 10:00:00', NULL),

-- South Sudan 2024
(8, 'Oil Report 2024', 'APPROVED', '2024-02-20 10:00:00', '2024-03-15 14:30:00'),
(8, 'Peace Process 2024', 'UNDER_REVIEW', '2024-04-20 10:00:00', NULL);

-- Insert sample reports for 2023
INSERT INTO reports (country_id, title, status, submitted_at, approved_at) VALUES
-- Kenya 2023
(1, 'Q1 Economic Report 2023', 'APPROVED', '2023-01-15 10:00:00', '2023-02-01 14:30:00'),
(1, 'Q2 Economic Report 2023', 'APPROVED', '2023-04-15 10:00:00', '2023-05-01 14:30:00'),
(1, 'Q3 Economic Report 2023', 'APPROVED', '2023-07-15 10:00:00', '2023-08-01 14:30:00'),
(1, 'Q4 Economic Report 2023', 'APPROVED', '2023-10-15 10:00:00', '2023-11-01 14:30:00'),

-- Uganda 2023
(2, 'Annual Budget Report 2023', 'APPROVED', '2023-01-20 10:00:00', '2023-02-15 14:30:00'),
(2, 'Infrastructure Development 2023', 'APPROVED', '2023-03-20 10:00:00', '2023-04-15 14:30:00'),
(2, 'Education Sector Report 2023', 'APPROVED', '2023-05-20 10:00:00', '2023-06-15 14:30:00'),

-- Tanzania 2023
(3, 'Tourism Report 2023', 'APPROVED', '2023-01-25 10:00:00', '2023-02-20 14:30:00'),
(3, 'Mining Sector Report 2023', 'APPROVED', '2023-03-25 10:00:00', '2023-04-20 14:30:00'),

-- Rwanda 2023
(4, 'Technology Report 2023', 'APPROVED', '2023-01-30 10:00:00', '2023-02-25 14:30:00'),
(4, 'Innovation Report 2023', 'APPROVED', '2023-03-30 10:00:00', '2023-04-25 14:30:00');

-- Insert sample assigned resolutions for 2024
INSERT INTO assigned_resolutions (country_id, title, status, assigned_at, completed_at, due_date) VALUES
-- Kenya 2024
(1, 'Implement Economic Reforms', 'IN_PROGRESS', '2024-01-20 10:00:00', NULL, '2024-12-31'),
(1, 'Digital Transformation', 'COMPLETED', '2024-02-01 10:00:00', '2024-06-30 14:30:00', '2024-06-30'),
(1, 'Infrastructure Upgrade', 'PENDING', '2024-03-01 10:00:00', NULL, '2024-12-31'),
(1, 'Education Reform', 'IN_PROGRESS', '2024-04-01 10:00:00', NULL, '2024-12-31'),

-- Uganda 2024
(2, 'Budget Implementation', 'COMPLETED', '2024-01-25 10:00:00', '2024-05-30 14:30:00', '2024-05-30'),
(2, 'Road Construction', 'IN_PROGRESS', '2024-02-01 10:00:00', NULL, '2024-12-31'),
(2, 'Healthcare Improvement', 'PENDING', '2024-03-01 10:00:00', NULL, '2024-12-31'),

-- Tanzania 2024
(3, 'Tourism Promotion', 'COMPLETED', '2024-01-30 10:00:00', '2024-04-30 14:30:00', '2024-04-30'),
(3, 'Mining Regulations', 'IN_PROGRESS', '2024-02-01 10:00:00', NULL, '2024-12-31'),
(3, 'Agricultural Support', 'COMPLETED', '2024-03-01 10:00:00', '2024-07-30 14:30:00'),

-- Rwanda 2024
(4, 'Tech Hub Development', 'COMPLETED', '2024-01-15 10:00:00', '2024-05-30 14:30:00', '2024-05-30'),
(4, 'Innovation Center', 'IN_PROGRESS', '2024-02-01 10:00:00', NULL, '2024-12-31'),
(4, 'Digital Infrastructure', 'PENDING', '2024-03-01 10:00:00', NULL, '2024-12-31'),

-- Burundi 2024
(5, 'Peace Building', 'COMPLETED', '2024-01-20 10:00:00', '2024-04-30 14:30:00', '2024-04-30'),
(5, 'Reconstruction Projects', 'IN_PROGRESS', '2024-02-01 10:00:00', NULL, '2024-12-31'),

-- Ethiopia 2024
(6, 'Industrial Development', 'COMPLETED', '2024-01-25 10:00:00', '2024-05-30 14:30:00', '2024-05-30'),
(6, 'Manufacturing Support', 'IN_PROGRESS', '2024-02-01 10:00:00', NULL, '2024-12-31'),

-- Somalia 2024
(7, 'Security Enhancement', 'IN_PROGRESS', '2024-01-30 10:00:00', NULL, '2024-12-31'),

-- South Sudan 2024
(8, 'Oil Sector Development', 'COMPLETED', '2024-01-15 10:00:00', '2024-04-30 14:30:00', '2024-04-30'),
(8, 'Peace Process Support', 'IN_PROGRESS', '2024-02-01 10:00:00', NULL, '2024-12-31');

-- Insert sample assigned resolutions for 2023
INSERT INTO assigned_resolutions (country_id, title, status, assigned_at, completed_at, due_date) VALUES
-- Kenya 2023
(1, 'Economic Policy Review', 'COMPLETED', '2023-01-20 10:00:00', '2023-06-30 14:30:00', '2023-06-30'),
(1, 'Infrastructure Planning', 'COMPLETED', '2023-02-01 10:00:00', '2023-08-30 14:30:00', '2023-08-30'),

-- Uganda 2023
(2, 'Budget Planning', 'COMPLETED', '2023-01-25 10:00:00', '2023-05-30 14:30:00', '2023-05-30'),
(2, 'Education Reform', 'COMPLETED', '2023-02-01 10:00:00', '2023-07-30 14:30:00', '2023-07-30'),

-- Tanzania 2023
(3, 'Tourism Strategy', 'COMPLETED', '2023-01-30 10:00:00', '2023-05-30 14:30:00', '2023-05-30'),

-- Rwanda 2023
(4, 'Technology Strategy', 'COMPLETED', '2023-01-15 10:00:00', '2023-06-30 14:30:00', '2023-06-30');

-- Verify the data
SELECT 
    'Reports Count' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN YEAR(submitted_at) = 2024 THEN 1 END) as year_2024,
    COUNT(CASE WHEN YEAR(submitted_at) = 2023 THEN 1 END) as year_2023
FROM reports;

SELECT 
    'Resolutions Count' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN YEAR(assigned_at) = 2024 THEN 1 END) as year_2024,
    COUNT(CASE WHEN YEAR(assigned_at) = 2023 THEN 1 END) as year_2023
FROM assigned_resolutions;

SELECT 
    'Countries Count' as info,
    COUNT(*) as total
FROM countries;
