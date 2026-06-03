# User Manual — TZW LTD Fire Extinguisher Management System

## Overview

FEMS is a RESTful microservices-based system for managing fire extinguishers, inspections, maintenance, and compliance reporting.

## Roles

### Admin
- Manage users (create, update, delete)
- Full CRUD on fire extinguishers
- View all reports and export PDF/CSV
- Complete inspections and log maintenance

### Inspector
- View extinguishers
- Schedule inspections
- Complete inspections
- Log maintenance activities
- View and export reports

### User
- View extinguisher status
- Schedule inspections
- View own inspection history
- View basic reports

## Common Tasks

### Register / Login
1. Open http://localhost:3000/register to create an account
2. Or login at /login with your credentials

### Register a Fire Extinguisher (Admin)
1. Go to **Extinguishers** → **Register New**
2. Enter serial number, location, type, size, dates, status
3. Save

### Schedule an Inspection
1. Go to **Inspections** → **Schedule Inspection**
2. Select extinguisher, date (today or future), time (HH:MM)
3. Inspectors and admins receive a notification

### Complete an Inspection (Inspector/Admin)
1. Open **Inspections**
2. Click **Complete** on a pending or overdue item

### Log Maintenance (Inspector/Admin)
1. Go to **Maintenance**
2. Fill action taken, date, issues, notes
3. Submit

### Reports
1. Go to **Reports**
2. Switch tabs: Inventory, Inspections, Compliance, Maintenance
3. Admin/Inspector: use **Export PDF** or **Export CSV**

### Forgot Password
1. Click **Forgot password** on login page
2. Check backend console for reset token (demo mode)
3. Open reset link with token

## API Documentation

Swagger UI: http://localhost:4000/api/docs
