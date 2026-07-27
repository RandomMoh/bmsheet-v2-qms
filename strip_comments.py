import os
import re

directories = ['api', 'src']
extensions = ['.php', '.js', '.jsx']

def strip_comments():
    count = 0
    for d in directories:
        for root, _, files in os.walk(d):
            for f in files:
                if any(f.endswith(ext) for ext in extensions):
                    path = os.path.join(root, f)
                    with open(path, 'r', encoding='utf-8') as file:
                        lines = file.readlines()
                    
                    new_lines = []
                    for line in lines:
                        # Match full line single-line comments
                        if re.match(r'^\s*(//|#).*$', line):
                            continue
                        # Match full line block comments
                        if re.match(r'^\s*/\*.*\*/\s*$', line):
                            continue
                        new_lines.append(line)
                    
                    if len(lines) != len(new_lines):
                        count += (len(lines) - len(new_lines))
                        with open(path, 'w', encoding='utf-8') as file:
                            file.writelines(new_lines)
    print(f"Removed {count} comment lines.")

if __name__ == "__main__":
    strip_comments()
