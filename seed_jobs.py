import requests
import json

BASE = "http://localhost:8001/api/v1"

# Login as recruiter first — replace with your recruiter credentials
login = requests.post(f"{BASE}/auth/login", data={
    "username": "akshat1@hireflow.com",  # replace with your recruiter email
    "password": "Asdf@1234"          # replace with your password
})
token = login.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

jobs = [
    {"title": "Frontend Engineer", "description": "Build beautiful UIs with React and TypeScript. You will work on our core product used by millions.", "requirements": ["React", "TypeScript", "CSS", "3+ years experience"], "job_type": "fulltime", "location": "Bangalore", "remote_ok": True, "salary_min": 1200000, "salary_max": 1800000},
    {"title": "Backend Engineer", "description": "Design and build scalable APIs using Python and FastAPI. Own services end to end.", "requirements": ["Python", "FastAPI", "PostgreSQL", "2+ years experience"], "job_type": "fulltime", "location": "Hyderabad", "remote_ok": True, "salary_min": 1000000, "salary_max": 1600000},
    {"title": "Data Scientist", "description": "Build ML models to improve hiring outcomes and candidate matching.", "requirements": ["Python", "ML", "SQL", "Statistics"], "job_type": "fulltime", "location": "Bangalore", "remote_ok": False, "salary_min": 1400000, "salary_max": 2000000},
    {"title": "Product Manager", "description": "Define the roadmap for HireFlow's core product features.", "requirements": ["Product thinking", "SQL", "Communication", "3+ years PM experience"], "job_type": "fulltime", "location": "Mumbai", "remote_ok": True, "salary_min": 1600000, "salary_max": 2400000},
    {"title": "DevOps Engineer", "description": "Manage our cloud infrastructure on AWS. Build CI/CD pipelines.", "requirements": ["AWS", "Docker", "Kubernetes", "Terraform"], "job_type": "fulltime", "location": "Remote", "remote_ok": True, "salary_min": 1200000, "salary_max": 1800000},
    {"title": "UI/UX Designer", "description": "Design intuitive interfaces for job seekers and recruiters.", "requirements": ["Figma", "Prototyping", "User Research", "Design Systems"], "job_type": "fulltime", "location": "Bangalore", "remote_ok": True, "salary_min": 800000, "salary_max": 1400000},
    {"title": "Mobile Engineer - React Native", "description": "Build the HireFlow mobile app for iOS and Android.", "requirements": ["React Native", "TypeScript", "iOS", "Android"], "job_type": "fulltime", "location": "Pune", "remote_ok": True, "salary_min": 1000000, "salary_max": 1600000},
    {"title": "Data Analyst", "description": "Analyze hiring trends and build dashboards for our recruiter clients.", "requirements": ["SQL", "Python", "Tableau", "Excel"], "job_type": "fulltime", "location": "Delhi", "remote_ok": False, "salary_min": 600000, "salary_max": 1000000},
    {"title": "Software Engineer Intern", "description": "6 month internship — work on real features shipped to production.", "requirements": ["Any programming language", "DSA basics", "Curiosity"], "job_type": "internship", "location": "Bangalore", "remote_ok": True, "salary_min": 300000, "salary_max": 500000},
    {"title": "Business Development Manager", "description": "Grow HireFlow's recruiter client base across India.", "requirements": ["Sales", "Communication", "B2B experience", "CRM tools"], "job_type": "fulltime", "location": "Mumbai", "remote_ok": False, "salary_min": 1000000, "salary_max": 1600000},
]

for job in jobs:
    res = requests.post(f"{BASE}/jobs", json=job, headers=headers)
    print(f"{job['title']}: {res.status_code} - {res.json().get('id', res.json())}")