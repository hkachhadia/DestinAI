"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_SKILL_REQUIREMENTS = void 0;
exports.getRequiredSkillsForRole = getRequiredSkillsForRole;
/** Required-skill lists per target role, used to compute Skill Match Score.
 * Plain configuration — extend freely without touching scoring.service.ts.
 * Matching is case-insensitive substring: "Machine Learning Engineer" matches
 * the key "machine learning engineer". */
exports.ROLE_SKILL_REQUIREMENTS = {
    // ── Software Engineering ──────────────────────────────────────────────────
    'software engineer': [
        'Data Structures', 'Algorithms', 'System Design', 'Git', 'SQL',
        'REST API', 'Testing', 'Docker', 'CI/CD', 'Problem Solving',
    ],
    'software developer': [
        'JavaScript', 'Python', 'Git', 'SQL', 'REST API',
        'Testing', 'Agile', 'Problem Solving', 'OOP', 'Data Structures',
    ],
    'frontend developer': [
        'JavaScript', 'TypeScript', 'React', 'HTML', 'CSS',
        'Git', 'Redux', 'Webpack', 'Testing', 'Accessibility',
    ],
    'backend developer': [
        'Node.js', 'Python', 'SQL', 'MongoDB', 'PostgreSQL',
        'REST API', 'Docker', 'AWS', 'Git', 'System Design',
    ],
    'full stack developer': [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL',
        'MongoDB', 'Docker', 'Git', 'REST API', 'AWS',
    ],
    'react developer': [
        'React', 'JavaScript', 'TypeScript', 'Redux', 'HTML',
        'CSS', 'Testing', 'Git', 'REST API', 'Performance Optimization',
    ],
    'angular developer': [
        'Angular', 'TypeScript', 'RxJS', 'HTML', 'CSS',
        'Git', 'Testing', 'REST API', 'NgRx', 'CI/CD',
    ],
    'vue developer': [
        'Vue.js', 'JavaScript', 'TypeScript', 'Vuex', 'HTML',
        'CSS', 'Git', 'Testing', 'REST API', 'Vite',
    ],
    'android developer': [
        'Kotlin', 'Java', 'Android SDK', 'Jetpack Compose', 'MVVM',
        'Room', 'Retrofit', 'Git', 'Testing', 'Material Design',
    ],
    'ios developer': [
        'Swift', 'SwiftUI', 'UIKit', 'Xcode', 'Core Data',
        'MVVM', 'Combine', 'Git', 'Testing', 'REST API',
    ],
    'flutter developer': [
        'Flutter', 'Dart', 'Provider', 'BLoC', 'REST API',
        'Firebase', 'Git', 'Testing', 'Material Design', 'State Management',
    ],
    'react native developer': [
        'React Native', 'JavaScript', 'TypeScript', 'Redux', 'REST API',
        'Firebase', 'Git', 'Testing', 'iOS', 'Android',
    ],
    // ── AI & ML ───────────────────────────────────────────────────────────────
    'ai engineer': [
        'Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
        'LLM', 'Prompt Engineering', 'Vector Databases', 'MLOps', 'Docker',
    ],
    'machine learning engineer': [
        'Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
        'Docker', 'Kubernetes', 'MLOps', 'SQL', 'AWS',
    ],
    'deep learning engineer': [
        'Python', 'Deep Learning', 'PyTorch', 'TensorFlow', 'CNNs',
        'RNNs', 'Transformers', 'CUDA', 'Model Optimization', 'Research',
    ],
    'generative ai engineer': [
        'Python', 'LLM', 'Prompt Engineering', 'LangChain', 'Vector Databases',
        'RAG', 'Fine-tuning', 'OpenAI API', 'Hugging Face', 'Docker',
    ],
    'llm engineer': [
        'Python', 'LLM', 'Transformers', 'Hugging Face', 'Fine-tuning',
        'RLHF', 'Prompt Engineering', 'LangChain', 'Evaluation', 'Docker',
    ],
    'prompt engineer': [
        'LLM', 'Prompt Engineering', 'Python', 'NLP', 'Chain-of-Thought',
        'Few-shot Learning', 'OpenAI API', 'Evaluation', 'Communication', 'RAG',
    ],
    'nlp engineer': [
        'Python', 'NLP', 'Transformers', 'BERT', 'spaCy',
        'NLTK', 'Hugging Face', 'Text Classification', 'Named Entity Recognition', 'PyTorch',
    ],
    'computer vision engineer': [
        'Python', 'Computer Vision', 'OpenCV', 'PyTorch', 'CNNs',
        'Object Detection', 'Image Segmentation', 'YOLO', 'TensorFlow', 'CUDA',
    ],
    'ai research engineer': [
        'Python', 'Research', 'Deep Learning', 'PyTorch', 'Mathematics',
        'Statistics', 'Paper Reading', 'Experimentation', 'LaTeX', 'GPU Computing',
    ],
    'mlops engineer': [
        'Python', 'Docker', 'Kubernetes', 'MLflow', 'Airflow',
        'CI/CD', 'AWS', 'Monitoring', 'Model Deployment', 'DevOps',
    ],
    // ── Data ──────────────────────────────────────────────────────────────────
    'data scientist': [
        'Python', 'SQL', 'Machine Learning', 'Pandas', 'NumPy',
        'Scikit-learn', 'Statistics', 'Data Visualization', 'TensorFlow', 'Jupyter',
    ],
    'data analyst': [
        'SQL', 'Python', 'Excel', 'Tableau', 'Power BI',
        'Statistics', 'Data Visualization', 'Pandas', 'Communication', 'Business Intelligence',
    ],
    'business analyst': [
        'SQL', 'Excel', 'Data Visualization', 'Business Requirements', 'Process Modeling',
        'Power BI', 'Communication', 'Agile', 'Stakeholder Management', 'Documentation',
    ],
    'analytics engineer': [
        'SQL', 'dbt', 'Python', 'Data Modeling', 'Snowflake',
        'BigQuery', 'Airflow', 'Git', 'ETL', 'Data Warehousing',
    ],
    'data engineer': [
        'Python', 'SQL', 'Apache Spark', 'Kafka', 'Airflow',
        'AWS', 'Docker', 'Data Pipelines', 'ETL', 'Database Design',
    ],
    'bi developer': [
        'SQL', 'Power BI', 'Tableau', 'DAX', 'Data Modeling',
        'Excel', 'Data Warehousing', 'ETL', 'Business Requirements', 'Reporting',
    ],
    // ── Cloud & Infrastructure ────────────────────────────────────────────────
    'cloud engineer': [
        'AWS', 'GCP', 'Azure', 'Terraform', 'Kubernetes',
        'Docker', 'Linux', 'Networking', 'CI/CD', 'Python',
    ],
    'devops engineer': [
        'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform',
        'Linux', 'Python', 'Monitoring', 'Git', 'System Design',
    ],
    'platform engineer': [
        'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'AWS',
        'Linux', 'Python', 'Observability', 'GitOps', 'Helm',
    ],
    'site reliability engineer': [
        'Linux', 'Python', 'Monitoring', 'Kubernetes', 'Docker',
        'AWS', 'Incident Management', 'SLOs', 'Observability', 'Automation',
    ],
    'infrastructure engineer': [
        'Linux', 'Networking', 'AWS', 'Terraform', 'Docker',
        'Kubernetes', 'Security', 'Scripting', 'Monitoring', 'CI/CD',
    ],
    // ── Security ──────────────────────────────────────────────────────────────
    'cyber security engineer': [
        'Networking', 'Linux', 'Security Protocols', 'Penetration Testing', 'SIEM',
        'Cryptography', 'Incident Response', 'OWASP', 'Firewalls', 'Compliance',
    ],
    'soc analyst': [
        'SIEM', 'Incident Response', 'Threat Intelligence', 'Networking', 'Linux',
        'Security Monitoring', 'Forensics', 'IDS/IPS', 'MITRE ATT&CK', 'Log Analysis',
    ],
    'ethical hacker': [
        'Penetration Testing', 'Kali Linux', 'Metasploit', 'Burp Suite', 'OWASP',
        'Networking', 'Scripting', 'Web Security', 'Social Engineering', 'Reporting',
    ],
    'application security engineer': [
        'OWASP', 'SAST', 'DAST', 'Secure Coding', 'Penetration Testing',
        'Python', 'Code Review', 'Threat Modeling', 'DevSecOps', 'Compliance',
    ],
    'penetration tester': [
        'Penetration Testing', 'Kali Linux', 'Metasploit', 'Burp Suite', 'Nmap',
        'Scripting', 'Networking', 'Web Security', 'Reporting', 'OWASP',
    ],
    // ── Specialized ───────────────────────────────────────────────────────────
    'blockchain developer': [
        'Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'Cryptography',
        'DeFi', 'Hardhat', 'JavaScript', 'Security Auditing', 'IPFS',
    ],
    'embedded engineer': [
        'C', 'C++', 'RTOS', 'Microcontrollers', 'ARM',
        'Debugging', 'Hardware Interfaces', 'Linux Kernel', 'Assembly', 'Memory Management',
    ],
    'iot engineer': [
        'C', 'C++', 'Python', 'MQTT', 'Embedded Systems',
        'AWS IoT', 'Networking', 'Sensors', 'Microcontrollers', 'Security',
    ],
    'automation engineer': [
        'Python', 'Selenium', 'CI/CD', 'Testing', 'Scripting',
        'Robot Framework', 'API Testing', 'Git', 'Jenkins', 'Performance Testing',
    ],
    'qa engineer': [
        'Testing', 'Python', 'Selenium', 'Manual Testing', 'Test Planning',
        'Bug Tracking', 'API Testing', 'Agile', 'Documentation', 'CI/CD',
    ],
    'test automation engineer': [
        'Selenium', 'Python', 'Java', 'CI/CD', 'API Testing',
        'Cypress', 'Playwright', 'Jenkins', 'Test Frameworks', 'Git',
    ],
    'game developer': [
        'C++', 'Unity', 'Unreal Engine', 'C#', 'Game Design',
        'Physics Simulation', 'Graphics', 'Shaders', 'Performance Optimization', 'Git',
    ],
    'ar/vr developer': [
        'Unity', 'C#', 'Unreal Engine', 'OpenXR', '3D Modeling',
        'Spatial Computing', 'WebXR', 'Performance Optimization', 'UX Design', 'Git',
    ],
    // ── Architecture & Leadership ─────────────────────────────────────────────
    'solutions architect': [
        'System Design', 'AWS', 'Microservices', 'Cloud Architecture', 'Security',
        'Communication', 'Cost Optimization', 'Networking', 'API Design', 'Documentation',
    ],
    'product engineer': [
        'System Design', 'JavaScript', 'Product Thinking', 'API Design', 'SQL',
        'Agile', 'Git', 'Communication', 'A/B Testing', 'Metrics',
    ],
    'technical consultant': [
        'Communication', 'System Design', 'Documentation', 'Cloud', 'Agile',
        'Problem Solving', 'Client Management', 'Architecture', 'SQL', 'Integration',
    ],
    'technical lead': [
        'System Design', 'Code Review', 'Mentoring', 'Architecture', 'Agile',
        'Communication', 'Git', 'CI/CD', 'SQL', 'Problem Solving',
    ],
    'engineering manager': [
        'Leadership', 'Communication', 'System Design', 'Agile', 'Hiring',
        'Roadmap Planning', 'Mentoring', 'Stakeholder Management', 'Performance Reviews', 'Strategy',
    ],
    // ── Additional Developer Roles (CHANGE 7) ─────────────────────────────────
    'node.js developer': [
        'Node.js', 'JavaScript', 'TypeScript', 'Express', 'REST API',
        'MongoDB', 'Docker', 'Git', 'Testing', 'SQL',
    ],
    'python developer': [
        'Python', 'Django', 'FastAPI', 'SQL', 'REST API',
        'Docker', 'Testing', 'Git', 'Linux', 'AWS',
    ],
    'java developer': [
        'Java', 'Spring Boot', 'SQL', 'Microservices', 'Maven',
        'REST API', 'Docker', 'Git', 'Testing', 'AWS',
    ],
    'go developer': [
        'Go', 'REST API', 'Docker', 'Kubernetes', 'SQL',
        'Microservices', 'Git', 'Testing', 'Linux', 'Concurrency',
    ],
    'web developer': [
        'HTML', 'CSS', 'JavaScript', 'React', 'REST API',
        'Git', 'Responsive Design', 'Testing', 'SQL', 'Node.js',
    ],
    'mobile developer': [
        'React Native', 'Flutter', 'Swift', 'Kotlin', 'REST API',
        'Git', 'State Management', 'Testing', 'Firebase', 'CI/CD',
    ],
    'database engineer': [
        'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Database Design',
        'Query Optimization', 'Indexing', 'Backup/Recovery', 'Data Modeling', 'Performance Tuning',
    ],
    'big data engineer': [
        'Apache Spark', 'Hadoop', 'Kafka', 'Hive', 'Scala',
        'Python', 'AWS', 'SQL', 'Data Pipelines', 'Airflow',
    ],
    'bi engineer': [
        'SQL', 'Power BI', 'Tableau', 'Data Warehousing', 'ETL',
        'DAX', 'Python', 'Excel', 'Data Modeling', 'Business Intelligence',
    ],
    'product manager': [
        'Product Roadmap', 'Agile', 'User Research', 'Data Analysis', 'Communication',
        'Stakeholder Management', 'SQL', 'A/B Testing', 'Prioritization', 'Metrics',
    ],
    'research scientist': [
        'Python', 'Machine Learning', 'Statistics', 'Mathematics', 'Research',
        'PyTorch', 'Paper Writing', 'Experimentation', 'Data Analysis', 'GPU Computing',
    ],
};
const DEFAULT_SKILL_REQUIREMENTS = [
    'Git', 'SQL', 'Problem Solving', 'Data Structures', 'Algorithms',
    'System Design', 'Testing', 'Communication', 'Documentation', 'Agile',
];
function getRequiredSkillsForRole(targetRole) {
    if (!targetRole)
        return DEFAULT_SKILL_REQUIREMENTS;
    const normalized = targetRole.toLowerCase();
    const key = Object.keys(exports.ROLE_SKILL_REQUIREMENTS).find((role) => normalized.includes(role) || role.includes(normalized));
    return key ? exports.ROLE_SKILL_REQUIREMENTS[key] : DEFAULT_SKILL_REQUIREMENTS;
}
//# sourceMappingURL=roleSkillMap.js.map