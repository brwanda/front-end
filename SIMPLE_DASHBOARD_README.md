# Simple Performance Dashboard

## 🎯 **Overview**
A clean, simple performance dashboard with database-driven comparative diagrams for countries based on reports and assigned resolutions.

## 📊 **Features**
- **Monthly Overview Widget**: Shows approval rate and total reviews
- **Country Performance Table**: Comparative data for all countries
- **Simple Bar Chart**: Reports vs Assigned Resolutions comparison
- **Simple Pie Chart**: Approval rate distribution by country
- **Summary Stats**: Total reports, resolutions, and overall approval

## 🗄️ **Database Requirements**

### **Tables Needed:**

#### **1. Countries Table**
```sql
CREATE TABLE countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **2. Reports Table**
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

#### **3. Assigned Resolutions Table**
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

## 🔌 **API Endpoints Required**

### **GET /api/dashboard/performance/simple**
Returns the complete dashboard data structure:

```json
{
  "countries": [
    {
      "name": "Kenya",
      "reports": 45,
      "assignedResolutions": 38,
      "approvalRate": 89,
      "trend": "up"
    }
  ],
  "monthlyOverview": {
    "approvalRate": 89,
    "totalReviews": 9,
    "totalReports": 165,
    "totalResolutions": 140
  }
}
```

## 📈 **Data Calculation Logic**

### **Reports Count**
```sql
SELECT 
    c.name,
    COUNT(r.id) as reports
FROM countries c
LEFT JOIN reports r ON c.id = r.country_id
GROUP BY c.id, c.name
```

### **Assigned Resolutions Count**
```sql
SELECT 
    c.name,
    COUNT(ar.id) as assignedResolutions
FROM countries c
LEFT JOIN assigned_resolutions ar ON c.id = ar.country_id
GROUP BY c.id, c.name
```

### **Approval Rate**
```sql
SELECT 
    c.name,
    ROUND(
        (COUNT(CASE WHEN r.status = 'APPROVED' THEN 1 END) * 100.0) / 
        COUNT(r.id), 2
    ) as approvalRate
FROM countries c
LEFT JOIN reports r ON c.id = r.country_id
WHERE r.id IS NOT NULL
GROUP BY c.id, c.name
```

### **Trend Calculation**
```sql
-- Compare current month vs previous month
-- 'up' if approval rate increased
-- 'down' if approval rate decreased  
-- 'stable' if no significant change
```

## 🚀 **How to Use**

1. **Access the Dashboard**: Navigate to `/simple-performance-dashboard`
2. **View Data**: The dashboard will automatically fetch data from your database
3. **Fallback**: If the API fails, it shows sample data for demonstration

## 🎨 **Design Features**

- **Clean & Simple**: Minimal design focusing on data clarity
- **Responsive**: Works on all device sizes
- **Color-Coded Trends**: Green for up, red for down, blue for stable
- **Interactive Charts**: Hover effects and tooltips on charts
- **Loading States**: Smooth loading and error handling

## 🔧 **Customization**

### **Add More Metrics**
- Add new fields to the API response
- Update the dashboard component to display them
- Modify the CSS for styling

### **Change Colors**
- Update the `COLORS` array in the component
- Modify CSS variables for theme changes

### **Add Filters**
- Implement country/date filters
- Add search functionality
- Include time period selection

## 📱 **Mobile Responsiveness**
- Grid layouts adapt to screen size
- Tables become scrollable on small screens
- Charts resize automatically
- Touch-friendly interactions

## 🚨 **Error Handling**
- Graceful fallback to sample data
- User-friendly error messages
- Retry functionality
- Loading states for better UX

## 🔄 **Data Refresh**
- Data refreshes on component mount
- Manual refresh button available
- Real-time updates can be added later

This dashboard provides a solid foundation for performance monitoring while keeping the implementation simple and database-driven as requested.
