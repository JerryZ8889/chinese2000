import sys, io, re
from collections import Counter
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import os
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

with open('Sophia中文识字进阶表_2000字.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract ALL stage 1 characters by category
in_stage1 = False
cats = {}
current_cat = None

for line in content.split('\n'):
    stripped = line.strip()
    if stripped.startswith('## ') and '第一阶段' in stripped:
        in_stage1 = True
        continue
    if stripped.startswith('## ') and in_stage1 and '第一阶段' not in stripped:
        break
    if not in_stage1:
        continue
    if stripped.startswith('### '):
        m = re.match(r'### (.+?)\s*\((\d+)字\)', stripped)
        if m:
            current_cat = m.group(1)
            cats[current_cat] = []
    elif stripped and not stripped.startswith('#') and not stripped.startswith('>') and not stripped.startswith('---') and current_cat:
        chars = re.findall(r'[\u4e00-\u9fff]', stripped)
        if chars:
            cats[current_cat].extend(chars)

all_original = []
for v in cats.values():
    all_original.extend(v)
assert len(set(all_original)) == 1200

# === BUILD 4 PARTS ===
# Split plan verified: P1=300, P2=300, P3=300, P4=300
# Splits needed:
#   情感感受(37): first 29 → P1, last 8 → P2
#   学校学习(38): first 18 → P2, last 20 → P3
#   常用动词扩展(83): first 31 → P3, last 52 → P4

qg = cats['情感感受']
xx = cats['学校学习']
dv = cats['常用动词扩展']

part1_data = [
    ('人称亲属', cats['人称亲属']),         # 30
    ('数字量词', cats['数字量词']),          # 40
    ('方位空间', cats['方位空间']),          # 30
    ('基本动作', cats['基本动作']),          # 83
    ('代词虚词', cats['代词虚词']),          # 43
    ('描述形容', cats['描述形容']),          # 45
    ('情感感受', qg[:29]),                   # 29
]

part2_data = [
    ('情感感受续', qg[29:]),                 # 8
    ('身体部位', cats['身体部位']),          # 26
    ('时间日期', cats['时间日期']),          # 32
    ('自然天气', cats['自然天气']),          # 38
    ('动物世界', cats['动物世界']),          # 43
    ('食物饮品', cats['食物饮品']),          # 36
    ('烘焙甜点', cats['烘焙甜点']),         # 21
    ('颜色形状', cats['颜色形状']),          # 27
    ('衣物用品', cats['衣物用品']),          # 20
    ('家居生活', cats['家居生活']),          # 31
    ('学校基础', xx[:18]),                   # 18
]

part3_data = [
    ('学校进阶', xx[18:]),                   # 20
    ('社会交往', cats['社会交往']),          # 31
    ('交通出行', cats['交通出行']),          # 25
    ('日常行为', cats['日常行为']),          # 37
    ('植物园艺', cats['植物园艺']),          # 16
    ('游戏娱乐', cats['游戏娱乐']),         # 25
    ('故事阅读', cats['故事阅读']),          # 34
    ('场所地点', cats['场所地点']),          # 29
    ('高频词汇', cats['高频词汇']),          # 52
    ('常用动词', dv[:31]),                   # 31
]

part4_data = [
    ('动词扩展', dv[31:]),                   # 52
    ('社会生活', cats['社会生活']),          # 42
    ('形容副词', cats['形容副词']),          # 27
    ('品德素养', cats['品德素养']),          # 34
    ('连接词补充', cats['连接词补充']),      # 24
    ('生活常用扩展', cats['生活常用扩展']),  # 121
]

# Verify counts
for name, data in [('P1', part1_data), ('P2', part2_data), ('P3', part3_data), ('P4', part4_data)]:
    total = sum(len(chars) for _, chars in data)
    assert total == 300, f"{name} has {total} chars, expected 300"
    print(f"{name}: {total} chars")

# Verify no duplicates and completeness
all_new = []
for data in [part1_data, part2_data, part3_data, part4_data]:
    for _, chars in data:
        all_new.extend(chars)

assert len(all_new) == 1200
assert len(set(all_new)) == 1200, "Duplicates found!"
assert set(all_new) == set(all_original), "Character mismatch!"
print(f"All checks passed! 1200 unique chars, 4x300")

# === GENERATE NEW MARKDOWN ===

def format_chars(chars, per_line=25):
    """Format characters with fullwidth spaces, max per_line per line"""
    lines = []
    for i in range(0, len(chars), per_line):
        lines.append('\u3000'.join(chars[i:i+per_line]))
    return '\n'.join(lines)

# Find where stage 1 content starts and ends in the original markdown
lines = content.split('\n')
stage1_start = None
stage1_end = None
for i, line in enumerate(lines):
    if line.startswith('## ') and '第一阶段' in line:
        stage1_start = i
    elif line.startswith('## ') and stage1_start is not None and '第一阶段' not in line:
        # Find the --- before this
        stage1_end = i
        # Look for --- separator before stage 2
        for j in range(i-1, stage1_start, -1):
            if lines[j].strip() == '---':
                stage1_end = j
                break
        break

print(f"Stage 1: lines {stage1_start} to {stage1_end}")

# Build new stage 1 content
part_titles = [
    ('第一部分：核心高频（300字）', '最基础的日常交流用字，日常对话中使用频率最高'),
    ('第二部分：日常认知（300字）', '身边常见的具体事物，生活中看得见摸得着的字'),
    ('第三部分：学习社交（300字）', '学校、社交、活动场景中常用的字'),
    ('第四部分：进阶拓展（300字）', '更丰富的表达和描述，拓展阅读理解能力'),
]

all_parts = [part1_data, part2_data, part3_data, part4_data]

new_stage1_lines = [
    '## 第一阶段：基础识字（1200字）',
    '',
    '> 对应1-3月，绘本+桥梁书级别',
    '> 参考书目：《不一样的卡梅拉》→《神奇校车》→《米小圈上学记》',
    '> 分4部分，每部分300字，由易到难递进',
    '',
]

for pi, (part_data, (title, desc)) in enumerate(zip(all_parts, part_titles)):
    new_stage1_lines.append(f'### {title}')
    new_stage1_lines.append('')
    new_stage1_lines.append(f'> {desc}')
    new_stage1_lines.append('')

    for cat_name, chars in part_data:
        new_stage1_lines.append(f'#### {cat_name} ({len(chars)}字)')
        new_stage1_lines.append('')
        new_stage1_lines.append(format_chars(chars))
        new_stage1_lines.append('')

    new_stage1_lines.append('')

# Reconstruct the full document
new_lines = lines[:stage1_start] + new_stage1_lines + lines[stage1_end:]
new_content = '\n'.join(new_lines)

# Final verification on the new content
# Extract stage 1 chars from new content
in_s1 = False
new_s1_chars = []
for line in new_content.split('\n'):
    stripped = line.strip()
    if stripped.startswith('## ') and '第一阶段' in stripped:
        in_s1 = True
        continue
    if stripped.startswith('## ') and in_s1 and '第一阶段' not in stripped:
        break
    if not in_s1:
        continue
    if stripped and not stripped.startswith('#') and not stripped.startswith('>') and not stripped.startswith('---'):
        chars = re.findall(r'[\u4e00-\u9fff]', stripped)
        if chars:
            new_s1_chars.extend(chars)

print(f"New stage 1 total chars: {len(new_s1_chars)}")
print(f"New stage 1 unique chars: {len(set(new_s1_chars))}")

# Also verify stages 2-4 are intact
all_doc_chars = []
for line in new_content.split('\n'):
    stripped = line.strip()
    if stripped and not stripped.startswith('#') and not stripped.startswith('>') and not stripped.startswith('---'):
        if '\u3000' in stripped:
            chars = re.findall(r'[\u4e00-\u9fff]', stripped)
            all_doc_chars.extend(chars)
        elif re.match(r'^[\u4e00-\u9fff]$', stripped):
            all_doc_chars.extend(re.findall(r'[\u4e00-\u9fff]', stripped))

print(f"Total doc chars (char lines): {len(all_doc_chars)}")
print(f"Total doc unique: {len(set(all_doc_chars))}")

counts = Counter(all_doc_chars)
dups = {c: n for c, n in counts.items() if n > 1}
if dups:
    print(f"WARNING: {len(dups)} duplicates found")
    for c, n in sorted(dups.items()):
        print(f"  '{c}' x{n}")
else:
    print("No duplicates in entire document!")

# Write the file
with open('Sophia中文识字进阶表_2000字.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("\nFile updated successfully!")
