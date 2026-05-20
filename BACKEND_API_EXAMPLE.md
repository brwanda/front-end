# Simple Dashboard Backend API Example

## 🎯 **Main Endpoint for Dashboard**

### **GET /api/dashboard/performance/simple**

This is the main endpoint that returns all the data needed for the simple performance dashboard.

**Response Structure:**
```json
{
  "countries": [
    {
      "name": "Kenya",
      "reports": 45,
      "assignedResolutions": 38,
      "approvalRate": 89,
      "trend": "up"
    },
    {
      "name": "Uganda", 
      "reports": 32,
      "assignedResolutions": 28,
      "approvalRate": 78,
      "trend": "stable"
    }
  ],
  "monthlyOverview": {
    "approvalRate": 89,
    "totalReviews": 9
  }
}
```

## 🗄️ **Database Queries Needed**

### **1. Get Countries with Reports Count**
```sql
SELECT 
    c.name,
    COUNT(r.id) as reports
FROM countries c
LEFT JOIN reports r ON c.id = r.country_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### **2. Get Countries with Assigned Resolutions Count**
```sql
SELECT 
    c.name,
    COUNT(ar.id) as assignedResolutions
FROM countries c
LEFT JOIN assigned_resolutions ar ON c.id = ar.country_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### **3. Get Approval Rate by Country**
```sql
SELECT 
    c.name,
    ROUND(
        (COUNT(CASE WHEN r.status = 'APPROVED' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(r.id), 0), 2
    ) as approvalRate
FROM countries c
LEFT JOIN reports r ON c.id = r.country_id
WHERE r.id IS NOT NULL
GROUP BY c.id, c.name
ORDER BY c.name;
```

### **4. Get Monthly Overview**
```sql
SELECT 
    ROUND(
        (COUNT(CASE WHEN r.status = 'APPROVED' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(r.id), 0), 2
    ) as approvalRate,
    COUNT(CASE WHEN r.status IN ('UNDER_REVIEW', 'APPROVED', 'REJECTED') THEN 1 END) as totalReviews
FROM reports r
WHERE MONTH(r.submitted_at) = MONTH(CURRENT_DATE())
AND YEAR(r.submitted_at) = YEAR(CURRENT_DATE());
```

## 🔧 **Simple Backend Implementation (Node.js/Express Example)**

```javascript
// app.js or dashboard.js
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

// Main dashboard endpoint
router.get('/dashboard/performance/simple', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get all the data
    const [countries] = await connection.execute(`
      SELECT 
        c.name,
        COALESCE(r.reports, 0) as reports,
        COALESCE(ar.resolutions, 0) as assignedResolutions,
        COALESCE(r.approvalRate, 0) as approvalRate,
        'stable' as trend
      FROM countries c
      LEFT JOIN (
        SELECT 
          country_id,
          COUNT(*) as reports,
          ROUND(
            (COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0) / 
            COUNT(*), 2
          ) as approvalRate
        FROM reports 
        GROUP BY country_id
      ) r ON c.id = r.country_id
      LEFT JOIN (
        SELECT 
          country_id,
          COUNT(*) as resolutions
        FROM assigned_resolutions 
        GROUP BY country_id
      ) ar ON c.id = ar.country_id
      ORDER BY c.name
    `);
    
    // Get monthly overview
    const [monthlyData] = await connection.execute(`
      SELECT 
        ROUND(
          (COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0) / 
          NULLIF(COUNT(*), 0), 2
        ) as approvalRate,
        COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'APPROVED', 'REJECTED') THEN 1 END) as totalReviews
      FROM reports 
      WHERE MONTH(submitted_at) = MONTH(CURRENT_DATE())
      AND YEAR(submitted_at) = YEAR(CURRENT_DATE())
    `);
    
    connection.release();
    
    // Add simple trend logic (you can make this more sophisticated)
    const countriesWithTrends = countries.map(country => ({
      ...country,
      trend: country.approvalRate > 80 ? 'up' : 
             country.approvalRate < 70 ? 'down' : 'stable'
    }));
    
    res.json({
      countries: countriesWithTrends,
      monthlyOverview: {
        approvalRate: monthlyData[0]?.approvalRate || 0,
        totalReviews: monthlyData[0]?.totalReviews || 0
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## 📊 **Data Structure Explanation**

### **Countries Array**
Each country object contains:
- **name**: Country name
- **reports**: Total number of reports from that country
- **assignedResolutions**: Total number of assigned resolutions for that country
- **approvalRate**: Percentage of approved reports (0-100)
- **trend**: Performance trend ('up', 'down', 'stable')

### **Monthly Overview**
- **approvalRate**: Overall approval rate for current month
- **totalReviews**: Total number of reviews in current month

## 🚀 **How to Implement**

1. **Create the database tables** (see SIMPLE_DASHBOARD_README.md)
2. **Implement the backend endpoint** using the example above
3. **Test the API** with a tool like Postman
4. **The frontend will automatically fetch and display the data**

## ✅ **What You Get**

- **Simple comparative diagrams** for countries
- **Database-driven data** (no hardcoding)
- **Clean, focused dashboard** like your image
- **Easy to maintain and extend**

The dashboard will show real data from your database once you implement this API endpoint! 🎉
