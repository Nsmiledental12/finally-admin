# AWS Deployment Guide

This guide covers deploying the Dental Portal application to AWS with RDS PostgreSQL database.

## Architecture Overview

- **Frontend**: React + Vite (Static hosting on S3 + CloudFront or Amplify)
- **Backend**: Node.js + Express (EC2, Elastic Beanstalk, or ECS)
- **Database**: AWS RDS PostgreSQL

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js and npm installed locally
4. Git repository with your code

## Part 1: Database Setup (AWS RDS PostgreSQL)

### Step 1: Create RDS PostgreSQL Instance

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose:
   - Engine: PostgreSQL
   - Version: 15.x or later
   - Template: Production (or Dev/Test for testing)
   - DB Instance Class: db.t3.micro (free tier) or larger
   - Storage: 20 GB minimum
   - Enable storage autoscaling

4. Configure settings:
   - DB instance identifier: `dental-portal-db`
   - Master username: `postgres` (or your choice)
   - Master password: Create a strong password
   - VPC: Default or create new
   - Public access: Yes (for initial setup, restrict later)
   - VPC security group: Create new or use existing

5. Additional configuration:
   - Initial database name: `dental_app`
   - Enable automated backups
   - Backup retention: 7 days minimum

6. Click "Create database"
7. Wait 5-10 minutes for creation
8. Note down the endpoint: `your-instance.region.rds.amazonaws.com`

### Step 2: Configure Security Group

1. Go to RDS instance details
2. Click on the VPC security group
3. Edit inbound rules:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your backend server IP (or 0.0.0.0/0 for testing only)

### Step 3: Initialize Database Schema

Connect to your RDS instance using psql or a database client:

```bash
psql -h your-instance.region.rds.amazonaws.com -U postgres -d dental_app
```

Run your database migrations/schema creation scripts.

## Part 2: Backend Deployment

### Option A: AWS Elastic Beanstalk (Recommended for beginners)

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize Elastic Beanstalk:
```bash
cd backend
eb init -p node.js dental-portal-backend --region us-east-1
```

3. Create environment:
```bash
eb create dental-portal-backend-env
```

4. Set environment variables:
```bash
eb setenv DB_HOST=your-rds-endpoint.region.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_NAME=dental_app \
  DB_USER=postgres \
  DB_PASSWORD=your_password \
  PORT=3002 \
  CORS_ORIGIN=https://your-frontend-domain.com \
  DB_SSL=true
```

5. Deploy:
```bash
eb deploy
```

6. Get your backend URL:
```bash
eb status
```

### Option B: AWS EC2

1. Launch EC2 instance:
   - AMI: Amazon Linux 2023 or Ubuntu
   - Instance type: t2.micro or larger
   - Security group: Allow ports 22 (SSH) and 3002 (backend)

2. SSH into instance:
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

3. Install Node.js:
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

4. Clone your repository:
```bash
git clone your-repo-url
cd your-repo/backend
```

5. Install dependencies:
```bash
npm install
```

6. Create .env file:
```bash
nano .env
```

Add your environment variables:
```
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=dental_app
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3002
CORS_ORIGIN=https://your-frontend-domain.com
DB_SSL=true
```

7. Install PM2 for process management:
```bash
sudo npm install -g pm2
pm2 start server.js --name dental-backend
pm2 startup
pm2 save
```

8. Configure security group to allow port 3002

## Part 3: Frontend Deployment

### Option A: AWS Amplify (Recommended - easiest)

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Configure build settings:
   - Build command: `npm run build`
   - Base directory: `/`
   - Output directory: `dist`

5. Add environment variables:
   - `VITE_API_BASE_URL`: Your backend URL (e.g., `http://your-backend.elasticbeanstalk.com`)

6. Deploy

7. Get your Amplify URL and update backend CORS_ORIGIN

### Option B: S3 + CloudFront

1. Build frontend locally:
```bash
npm run build
```

2. Create S3 bucket:
```bash
aws s3 mb s3://dental-portal-frontend
```

3. Configure bucket for static website hosting:
```bash
aws s3 website s3://dental-portal-frontend --index-document index.html --error-document index.html
```

4. Update bucket policy for public read:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dental-portal-frontend/*"
    }
  ]
}
```

5. Upload build files:
```bash
aws s3 sync dist/ s3://dental-portal-frontend
```

6. Create CloudFront distribution:
   - Origin domain: Your S3 bucket website endpoint
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Alternate domain name: your-domain.com (optional)

7. Update backend CORS_ORIGIN with CloudFront URL

## Part 4: Environment Variables Summary

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-backend-domain.com
```

### Backend (.env)
```
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=dental_app
DB_USER=postgres
DB_PASSWORD=your_secure_password
PORT=3002
CORS_ORIGIN=https://your-frontend-domain.com
DB_SSL=true
```

## Part 5: SSL/HTTPS Configuration

### Backend (EC2)
Use AWS Certificate Manager + Application Load Balancer:
1. Request SSL certificate in ACM
2. Create Application Load Balancer
3. Configure target group pointing to EC2 instance
4. Add HTTPS listener with ACM certificate

### Frontend
- Amplify: Automatic HTTPS
- CloudFront: Add ACM certificate in CloudFront settings

## Part 6: Post-Deployment

1. Test health endpoint:
```bash
curl https://your-backend-domain.com/api/health
```

2. Update backend CORS to restrict to your frontend domain only

3. Update RDS security group to only allow backend server IP

4. Enable CloudWatch logs for monitoring

5. Set up automated backups

6. Configure Route 53 for custom domain (optional)

## Troubleshooting

### Database Connection Issues
- Verify security group allows inbound from backend
- Check RDS endpoint is correct
- Verify SSL settings match (DB_SSL=true for AWS RDS)
- Check VPC settings allow connectivity

### CORS Errors
- Verify CORS_ORIGIN matches exact frontend URL
- Include protocol (https://)
- No trailing slash

### Build Failures
- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs for specific errors

## Cost Optimization

1. Use RDS t3.micro (free tier eligible)
2. Use EC2 t2.micro (free tier eligible)
3. Enable S3 lifecycle policies for old backups
4. Use CloudFront caching to reduce origin requests
5. Set up auto-scaling only if needed

## Security Best Practices

1. Never commit .env files
2. Use AWS Secrets Manager for sensitive data
3. Restrict RDS security group to backend IP only
4. Enable RDS encryption at rest
5. Use IAM roles instead of access keys where possible
6. Enable AWS CloudTrail for audit logs
7. Regular security updates for EC2 instances
8. Use AWS WAF with CloudFront for DDoS protection

## Monitoring

1. Enable RDS Enhanced Monitoring
2. Set up CloudWatch alarms:
   - RDS CPU > 80%
   - Backend server health checks
   - Database connection count
3. Enable AWS X-Ray for distributed tracing
4. Use CloudWatch Logs for application logs

## Backup and Recovery

1. RDS automated backups (enabled by default)
2. Manual RDS snapshots before major changes
3. Backend code in Git repository
4. Document recovery procedures
5. Test restore process regularly
