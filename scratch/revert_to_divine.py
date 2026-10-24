import re

files = [
    "DummyData.js",
    "Code.js",
    "login.html",
    "logout.html",
    "index.html",
    "javascript.html"
]

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    # Replaces
    new_content = re.sub(r'\bMIA\b', 'Divine Classes', new_content)
    new_content = re.sub(r'\bMia\b', 'Divine Classes', new_content)
    new_content = re.sub(r'mia\.in', 'divineclasses.in', new_content)
    new_content = re.sub(r'mia@upi', 'divineclasses@upi', new_content)
    new_content = re.sub(r'MIA_', 'Divine_Classes_', new_content)
    new_content = re.sub(r'mia-materials', 'divine-classes-materials', new_content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print(f"Reverted {filepath} to Divine Classes")
