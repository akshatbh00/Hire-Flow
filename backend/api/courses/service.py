"""
api/courses/service.py — skill gap → course suggestions
Curated mapping of skills to Coursera courses by top companies.
Google, IBM, Microsoft, Meta certified courses only.
"""

COURSE_CATALOG = {
    # Python
    "python": [
        {"title": "Google IT Automation with Python",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-it-automation",
         "type": "Professional Certificate", "duration": "6 months"},
        {"title": "Python for Everybody",
         "provider": "University of Michigan", "platform": "Coursera",
         "url": "https://www.coursera.org/specializations/python",
         "type": "Specialization", "duration": "8 months"},
    ],
    # Machine Learning / AI
    "machine learning": [
        {"title": "IBM Machine Learning Professional Certificate",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/ibm-machine-learning",
         "type": "Professional Certificate", "duration": "6 months"},
        {"title": "Machine Learning Specialization",
         "provider": "DeepLearning.AI", "platform": "Coursera",
         "url": "https://www.coursera.org/specializations/machine-learning-introduction",
         "type": "Specialization", "duration": "3 months"},
    ],
    "ml": [
        {"title": "IBM Machine Learning Professional Certificate",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/ibm-machine-learning",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    # Deep Learning
    "deep learning": [
        {"title": "Deep Learning Specialization",
         "provider": "DeepLearning.AI", "platform": "Coursera",
         "url": "https://www.coursera.org/specializations/deep-learning",
         "type": "Specialization", "duration": "5 months"},
    ],
    # Cloud
    "aws": [
        {"title": "AWS Cloud Technology Consultant",
         "provider": "AWS", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/aws-cloud-technology-consultant",
         "type": "Professional Certificate", "duration": "4 months"},
    ],
    "google cloud": [
        {"title": "Google Cloud Professional Certificate",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-cloud-digital-leader-training",
         "type": "Professional Certificate", "duration": "3 months"},
    ],
    "azure": [
        {"title": "Microsoft Azure Fundamentals",
         "provider": "Microsoft", "platform": "Coursera",
         "url": "https://www.coursera.org/specializations/microsoft-azure-fundamentals-az-900",
         "type": "Specialization", "duration": "3 months"},
    ],
    # DevOps
    "docker": [
        {"title": "IBM DevOps and Software Engineering",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/devops-and-software-engineering",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    "kubernetes": [
        {"title": "IBM DevOps and Software Engineering",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/devops-and-software-engineering",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    "devops": [
        {"title": "IBM DevOps and Software Engineering",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/devops-and-software-engineering",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    # Data
    "data science": [
        {"title": "IBM Data Science Professional Certificate",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
         "type": "Professional Certificate", "duration": "11 months"},
        {"title": "Google Data Analytics",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    "data analysis": [
        {"title": "Google Data Analytics",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    "sql": [
        {"title": "IBM Data Science Professional Certificate",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
         "type": "Professional Certificate", "duration": "11 months"},
    ],
    # Cybersecurity
    "cybersecurity": [
        {"title": "Google Cybersecurity Certificate",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-cybersecurity",
         "type": "Professional Certificate", "duration": "6 months"},
        {"title": "Microsoft Cybersecurity Analyst",
         "provider": "Microsoft", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/microsoft-cybersecurity-analyst",
         "type": "Professional Certificate", "duration": "4 months"},
    ],
    # Web Dev
    "javascript": [
        {"title": "Meta Front-End Developer",
         "provider": "Meta", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
         "type": "Professional Certificate", "duration": "7 months"},
    ],
    "react": [
        {"title": "Meta Front-End Developer",
         "provider": "Meta", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
         "type": "Professional Certificate", "duration": "7 months"},
    ],
    "backend": [
        {"title": "Meta Back-End Developer",
         "provider": "Meta", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/meta-back-end-developer",
         "type": "Professional Certificate", "duration": "8 months"},
    ],
    # Project Management
    "project management": [
        {"title": "Google Project Management Certificate",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-project-management",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    # UX
    "ux": [
        {"title": "Google UX Design Certificate",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-ux-design",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    "ui": [
        {"title": "Google UX Design Certificate",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-ux-design",
         "type": "Professional Certificate", "duration": "6 months"},
    ],
    # Business / Marketing
    "digital marketing": [
        {"title": "Google Digital Marketing & E-commerce",
         "provider": "Google", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce",
         "type": "Professional Certificate", "duration": "6 months"},
        {"title": "Meta Social Media Marketing",
         "provider": "Meta", "platform": "Coursera",
         "url": "https://www.coursera.org/professional-certificates/facebook-social-media-marketing",
         "type": "Professional Certificate", "duration": "7 months"},
    ],
    # Blockchain
    "blockchain": [
        {"title": "IBM Blockchain Foundation Developer",
         "provider": "IBM", "platform": "Coursera",
         "url": "https://www.coursera.org/learn/ibm-blockchain-essentials",
         "type": "Course", "duration": "3 weeks"},
    ],
}


def get_courses_for_skills(skill_gaps: list[str]) -> list[dict]:
    """
    Map skill gaps to relevant Coursera courses.
    Returns deduplicated list of courses sorted by relevance.
    """
    seen_urls = set()
    results   = []

    for skill in skill_gaps:
        skill_lower = skill.lower().strip()

        # exact match first
        courses = COURSE_CATALOG.get(skill_lower, [])

        # partial match if no exact
        if not courses:
            for key, val in COURSE_CATALOG.items():
                if key in skill_lower or skill_lower in key:
                    courses = val
                    break

        for course in courses:
            if course["url"] not in seen_urls:
                seen_urls.add(course["url"])
                results.append({
                    **course,
                    "for_skill": skill,
                })

    return results


def get_courses_for_job(
    job_title:   str,
    user_skills: list[str],
) -> list[dict]:
    """
    Suggest courses based on job title keywords
    when no specific skill gaps are available.
    """
    title_lower  = job_title.lower()
    suggestions  = []
    seen_urls    = set()

    for keyword, courses in COURSE_CATALOG.items():
        if keyword in title_lower:
            for course in courses:
                if course["url"] not in seen_urls:
                    seen_urls.add(course["url"])
                    suggestions.append({
                        **course,
                        "for_skill": keyword,
                    })

    return suggestions[:6]