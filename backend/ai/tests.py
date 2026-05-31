from django.test import TestCase
from ai.views import AICVParsingView

class CVParserTestCase(TestCase):
    def setUp(self):
        self.parser = AICVParsingView()

    def test_empty_resume(self):
        text = "Jane Doe\njane.doe@example.com\n(123) 456-7890\n"
        res = self.parser.fallback_parse_cv(text)
        
        self.assertEqual(res["bio"], "A dedicated software developer.")
        self.assertEqual(res["skills"], ["Software Development", "Web Design"])  # default fallback skills
        self.assertEqual(res["experience"], [])
        self.assertEqual(res["education"], [])
        self.assertEqual(res["projects"], [])

    def test_resume_with_skills_and_no_experience(self):
        text = """
        John Doe
        john@doe.com
        
        Summary
        A passionate developer specializing in React and TypeScript.
        
        Skills
        React, TypeScript, Node.js, Python, CSS, HTML
        
        Education
        Bachelor of Science in Computer Science, Stanford University, 2018 - 2022
        """
        res = self.parser.fallback_parse_cv(text)
        
        # Bio
        self.assertIn("React and TypeScript", res["bio"])
        
        # Skills
        self.assertIn("React", res["skills"])
        self.assertIn("TypeScript", res["skills"])
        self.assertIn("Node.js", res["skills"])
        self.assertIn("Python", res["skills"])
        
        # Education (captured from same line split)
        self.assertEqual(len(res["education"]), 1)
        self.assertEqual(res["education"][0]["school"], "Stanford University")
        self.assertEqual(res["education"][0]["degree"], "Bachelor of Science in Computer Science")
        self.assertEqual(res["education"][0]["period"], "2018 - 2022")
        self.assertFalse(res["education"][0]["isCurrent"])
        
        # Experience and projects should be empty
        self.assertEqual(res["experience"], [])
        self.assertEqual(res["projects"], [])

    def test_resume_with_experience_and_projects(self):
        text = """
        Alice Smith
        alice@smith.com
        
        Professional Experience
        Software Engineer
        Google | Jan 2020 - Dec 2022
        - Built frontend components using React and TypeScript.
        - Improved load times by 40%.
        
        Projects
        E-Commerce Web App
        Built a full-stack shopping portal.
        Tech: React, Node.js, PostgreSQL
        https://github.com/alice/shop
        """
        res = self.parser.fallback_parse_cv(text)
        
        # Experience
        self.assertEqual(len(res["experience"]), 1)
        self.assertEqual(res["experience"][0]["role"], "Software Engineer")
        self.assertEqual(res["experience"][0]["company"], "Google")
        self.assertEqual(res["experience"][0]["period"], "Jan 2020 - Dec 2022")
        self.assertFalse(res["experience"][0]["isCurrent"])
        self.assertIn("Built frontend components", res["experience"][0]["description"])
        
        # Projects
        self.assertEqual(len(res["projects"]), 1)
        self.assertEqual(res["projects"][0]["title"], "E-Commerce Web App")
        self.assertIn("Built a full-stack shopping portal", res["projects"][0]["description"])
        self.assertIn("React", res["projects"][0]["tech"])
        self.assertEqual(res["projects"][0]["github"], "https://github.com/alice/shop")

    def test_indrasish_resume(self):
        text = """
        Indrasish Adhya

        "Enthusiastic and meticulous Computer Science graduate eager to apply my skills and contribute to cutting-edge projects."

        B-3/45 , Kalyani, Nadia
        Kalyani, Pin: 741235
        indrasishadhya770@gmail.com
        7439667724
        Github : https://github.com/Indrasish007

        EDUCATION

        Pannalal Institution, Kalyani, Nadia— Madhyamik
        May - 2019
        Marks - 80.57%

        Pannalal Institution, Kalyani, Nadia —Higher Secondary
        July - 2021
        Marks - 79.6%

        Kalyani University, Kalyani, Nadia —Graduation
        August - 2024
        I have pursued my graduation in B.Sc. Computer Science Hons. from Kanchrapara College , Kalyani University in August 2024 with CGPA-7.91

        Academy of Technology, Adisaptagram- MCA
        August - 2026
        I have pursued Masters of Computer Application from Academy of Technology , Makaut University in August 2026

        PROJECTS

        PredictXplorer —A Complete AI/ML project. The website which Predicts the Car Price , Analyzes the Whatsapp Chat and Predicts the Stock Price using Machine Learning
        Used technologies : Python streamlit , Jupyter notebook , Regular expression , HTML , Css
        Used Methodologies : Linear regression , Finding R2 score
        Project Link : https://github.com/Indrasish007/PredictXplorer

        Technical Skills
        • AI/ML
        • Python
        • Sql
        • Java
        • C
        • C++
        • Html
        • Css
        • php

        Soft Skills
        • Communication
        • Teamwork

        Languages
        • Bengali
        • English
        • Hindi
        """
        res = self.parser.fallback_parse_cv(text)
        # We assert that contact details and address parts are NOT in skills
        for bad_skill in ["B-3/45", "Kalyani", "Nadia", "Pin:", "741235", "indrasishadhya770@gmail.com", "7439667724", "Github", "Bengali", "English", "Hindi"]:
            self.assertNotIn(bad_skill, res["skills"])

        # Assert human languages are separated from skills
        self.assertEqual(len(res["languages"]), 3)
        self.assertEqual({l["name"] for l in res["languages"]}, {"Bengali", "English", "Hindi"})
        for l in res["languages"]:
            self.assertEqual(l["proficiency"], "Fluent")

    def test_differentiate_skills_and_languages(self):
        from ai.services.ai_parser import differentiate_skills_and_languages
        skills = ["Python", "JavaScript", "English - Native", "Spanish (Conversational)", "React", "French"]
        languages = [{"name": "Bengali", "proficiency": "Native"}]
        
        clean_skills, clean_languages = differentiate_skills_and_languages(skills, languages)
        
        # Human languages should be separated from skills
        self.assertEqual(clean_skills, ["Python", "JavaScript", "React"])
        
        self.assertEqual(len(clean_languages), 4)
        self.assertEqual(clean_languages[0], {"name": "Bengali", "proficiency": "Native"})
        self.assertEqual(clean_languages[1], {"name": "English", "proficiency": "Native"})
        self.assertEqual(clean_languages[2], {"name": "Spanish", "proficiency": "Conversational"})
        self.assertEqual(clean_languages[3], {"name": "French", "proficiency": "Fluent"})

    def test_defensive_sanitizers(self):
        from ai.services.ai_parser import _sanitise_edu, _sanitise_exp, _sanitise_proj
        
        # Test sanitise edu with non-dict/str values
        self.assertEqual(_sanitise_edu("Harvard University"), {
            "school": "Harvard University",
            "degree": "",
            "start_date": "",
            "end_date": "",
            "grade": "",
        })
        self.assertEqual(_sanitise_edu(None), {
            "school": "",
            "degree": "",
            "start_date": "",
            "end_date":   "",
            "grade":      "",
        })
        
        # Test sanitise exp with non-dict/str values
        self.assertEqual(_sanitise_exp("Developer at Google"), {
            "company": "",
            "role": "Developer at Google",
            "start_date": "",
            "end_date": "",
            "dates": "",
            "description": "",
        })

        # Test sanitise proj with non-dict/str values
        self.assertEqual(_sanitise_proj("Cool App"), {
            "title": "Cool App",
            "description": "",
            "tech_stack": "",
            "github_url": "",
            "live_url": "",
        })



