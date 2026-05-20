# Database API Endpoints for 100% Database-Driven Dashboard

## 🎯 **IMPORTANT: NO HARDCODED DATA**

This dashboard is **100% database-driven**. All data comes from your database through these API endpoints.

## 🔌 **Required API Endpoints**

### **1. GET /api/dashboard/available-years**
Returns all available years from your database.

**Response:**
```json
[2020, 2021, 2022, 2023, 2024, 2025]
```

**SQL Query:**
```sql
SELECT DISTINCT YEAR(submitted_at) as year 
FROM reports 
WHERE submitted_at IS NOT NULL
UNION
SELECT DISTINCT YEAR(assigned_at) as year 
FROM assigned_resolutions 
WHERE assigned_at IS NOT NULL
ORDER BY year DESC;
```

---

### **2. GET /api/dashboard/performance/simple?year={YEAR}**
Returns complete dashboard data for a specific year.

**Response Structure:**
```json
{
  "countries": [
    {
      "name": "Kenya",
      "reports": 45,
      "assignedResolutions": 38,
      "approvalRate": 89.5,
      "trend": "up"
    },
    {
      "name": "Uganda",
      "reports": 32,
      "assignedResolutions": 28,
      "approvalRate": 78.2,
      "trend": "stable"
    }
  ],
  "monthlyOverview": {
    "approvalRate": 89.5,
    "totalReviews": 9,
    "totalReports": 165,
    "totalResolutions": 140
  }
}
```

---

## 🗄️ **Database Tables Required**

### **1. Countries Table**
```sql
CREATE TABLE countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Reports Table**
```sql
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    country_id INT,
    title VARCHAR(255) NOT NULL,
    status ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'SUBMITTED',
    submitted_by INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

### **3. Assigned Resolutions Table**
```sql
CREATE TABLE assigned_resolutions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    country_id INT,
    title VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE') DEFAULT 'PENDING',
    assigned_to INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    due_date DATE,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

---

## 📊 **Complete SQL Queries for Dashboard Data**

### **Get Available Years**
```sql
SELECT DISTINCT YEAR(submitted_at) as year 
FROM reports 
WHERE submitted_at IS NOT NULL
UNION
SELECT DISTINCT YEAR(assigned_at) as year 
FROM assigned_resolutions 
WHERE assigned_at IS NOT NULL
ORDER BY year DESC;
```

### **Get Country Performance Data for Specific Year**
```sql
SELECT 
    c.name,
    COALESCE(r.reports, 0) as reports,
    COALESCE(ar.resolutions, 0) as assignedResolutions,
    COALESCE(r.approvalRate, 0) as approvalRate,
    CASE 
        WHEN COALESCE(r.approvalRate, 0) > 80 THEN 'up'
        WHEN COALESCE(r.approvalRate, 0) < 70 THEN 'down'
        ELSE 'stable'
    END as trend
FROM countries c
LEFT JOIN (
    SELECT 
        country_id,
        COUNT(*) as reports,
        ROUND(
            (COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(*), 0), 2
        ) as approvalRate
    FROM reports 
    WHERE YEAR(submitted_at) = ?
    GROUP BY country_id
) r ON c.id = r.country_id
LEFT JOIN (
    SELECT 
        country_id,
        COUNT(*) as resolutions
    FROM assigned_resolutions 
    WHERE YEAR(assigned_at) = ?
    GROUP BY country_id
) ar ON c.id = ar.country_id
ORDER BY c.name;
```

### **Get Monthly Overview for Specific Year**
```sql
SELECT 
    ROUND(
        (COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 2
    ) as approvalRate,
    COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'APPROVED', 'REJECTED') THEN 1 END) as totalReviews,
    COUNT(*) as totalReports,
    (
        SELECT COUNT(*) 
        FROM assigned_resolutions 
        WHERE YEAR(assigned_at) = ?
    ) as totalResolutions
FROM reports 
WHERE YEAR(submitted_at) = ?;
```

---

## 🔧 **Backend Implementation (Node.js/Express)**

```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
});

// Get available years
router.get('/dashboard/available-years', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [years] = await connection.execute(`
      SELECT DISTINCT YEAR(submitted_at) as year 
      FROM reports 
      WHERE submitted_at IS NOT NULL
      UNION
      SELECT DISTINCT YEAR(assigned_at) as year 
      FROM assigned_resolutions 
      WHERE assigned_at IS NOT NULL
      ORDER BY year DESC
    `);
    
    connection.release();
    
    const yearList = years.map(row => row.year);
    res.json(yearList);
    
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard performance data
router.get('/dashboard/performance/simple', async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ error: 'Year parameter is required' });
    }
    
    const connection = await pool.getConnection();
    
    // Get country performance data
    const [countries] = await connection.execute(`
      SELECT 
        c.name,
        COALESCE(r.reports, 0) as reports,
        COALESCE(ar.resolutions, 0) as assignedResolutions,
        COALESCE(r.approvalRate, 0) as approvalRate,
        CASE 
          WHEN COALESCE(r.approvalRate, 0) > 80 THEN 'up'
          WHEN COALESCE(r.approvalRate, 0) < 70 THEN 'down'
          ELSE 'stable'
        END as trend
      FROM countries c
      LEFT JOIN (
        SELECT 
          country_id,
          COUNT(*) as reports,
          ROUND(
            (COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(*), 0), 2
          ) as approvalRate
        FROM reports 
        WHERE YEAR(submitted_at) = ?
        GROUP BY country_id
      ) r ON c.id = r.country_id
      LEFT JOIN (
        SELECT 
          country_id,
          COUNT(*) as resolutions
        FROM assigned_resolutions 
        WHERE YEAR(assigned_at) = ?
        GROUP BY country_id
      ) ar ON c.id = ar.country_id
      ORDER BY c.name
    `, [year, year]);
    
    // Get monthly overview
    const [monthlyData] = await connection.execute(`
      SELECT 
        ROUND(
          (COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0) / 
          NULLIF(COUNT(*), 0), 2
        ) as approvalRate,
        COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'APPROVED', 'REJECTED') THEN 1 END) as totalReviews,
        COUNT(*) as totalReports,
        (
          SELECT COUNT(*) 
          FROM assigned_resolutions 
          WHERE YEAR(assigned_at) = ?
        ) as totalResolutions
      FROM reports 
      WHERE YEAR(submitted_at) = ?
    `, [year, year]);
    
    connection.release();
    
    res.json({
      countries: countries,
      monthlyOverview: {
        approvalRate: monthlyData[0]?.approvalRate || 0,
        totalReviews: monthlyData[0]?.totalReviews || 0,
        totalReports: monthlyData[0]?.totalReports || 0,
        totalResolutions: monthlyData[0]?.totalResolutions || 0
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

---

## 🚀 **How to Implement**

1. **Create the database tables** using the SQL above
2. **Implement the backend API** using the Node.js example
3. **Test the endpoints** with Postman or similar tool
4. **The frontend will automatically fetch and display real data**

---

## ✅ **What You Get**

- **100% Database-Driven** - No hardcoded data anywhere
- **Year-Based Filtering** - Data organized by years
- **Real-Time Data** - Always shows current database state
- **Simple Comparative Diagrams** - Clean charts and tables
- **Performance Metrics** - Reports, resolutions, approval rates
- **Trend Analysis** - Up/down/stable indicators

---

## 🚨 **Important Notes**

- **NO hardcoded data** in the frontend
- **ALL data comes from database** through API calls
- **Year parameter is required** for performance data
- **Error handling** for database connection issues
- **Loading states** while fetching data
- **Fallback handling** for missing data

The dashboard will show **real data from your database** organized by years, with **no hardcoded values** anywhere! 🎉
