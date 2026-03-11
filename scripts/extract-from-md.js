// 从 markdown 文件提取字表并生成 JSON 数据
const fs = require('fs');
const path = require('path');

// 读取原始 markdown 文件内容
const mdPath = path.join(__dirname, '..', '..', 'Sophia 中文学习计划', 'Sophia中文识字进阶表_2000字.md');
const mdContent = fs.readFileSync(mdPath, 'utf-8');

// 从文本行提取汉字（过滤掉非汉字字符）
function extractChars(line) {
  const chars = [];
  for (const char of line) {
    // 检查是否是汉字（Unicode范围）
    if (/[\u4e00-\u9fa5]/.test(char)) {
      chars.push(char);
    }
  }
  return chars;
}

// Fisher-Yates 洗牌算法
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 将字数组按单元划分
function splitIntoUnits(chars, unitSize = 20) {
  const units = [];
  for (let i = 0; i < chars.length; i += unitSize) {
    units.push({
      unit: Math.floor(i / unitSize) + 1,
      chars: chars.slice(i, i + unitSize)
    });
  }
  return units;
}

// 生成阶段数据
function generateStageData(stageNum, chars) {
  // 去重
  const uniqueChars = [...new Set(chars)];
  
  // 打乱字序
  const shuffledChars = shuffleArray(uniqueChars);
  
  // 按单元划分
  const units = splitIntoUnits(shuffledChars);
  
  return {
    stage: stageNum,
    totalChars: uniqueChars.length,
    totalUnits: units.length,
    units: units
  };
}

// 解析 markdown 内容并按阶段提取汉字
function parseMarkdown(content) {
  const lines = content.split('\n');
  const stageChars = {
    1: [],
    2: [],
    3: [],
    4: []
  };
  
  let currentStage = null;
  
  for (const line of lines) {
    // 检测阶段标题
    const stageMatch = line.match(/^##\s+第([一二三四])阶段/);
    if (stageMatch) {
      const stageNumMap = { '一': 1, '二': 2, '三': 3, '四': 4 };
      currentStage = stageNumMap[stageMatch[1]];
      continue;
    }
    
    // 如果当前在某个阶段内，提取汉字
    if (currentStage && !line.startsWith('#')) {
      const chars = extractChars(line);
      stageChars[currentStage].push(...chars);
    }
  }
  
  return stageChars;
}

// 主函数
function main() {
  console.log('开始解析字表数据...\n');
  
  const outputDir = path.join(__dirname, '..', 'src', 'data');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 解析 markdown
  const stageChars = parseMarkdown(mdContent);
  
  console.log('字表统计：');
  console.log('='.repeat(50));
  
  let totalAll = 0;
  
  // 生成每个阶段的数据
  Object.entries(stageChars).forEach(([stageNum, chars]) => {
    const num = parseInt(stageNum);
    const data = generateStageData(num, chars);
    
    const outputPath = path.join(outputDir, `stage${num}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    totalAll += data.totalChars;
    
    console.log(`阶段 ${num}: ${data.totalChars} 字, ${data.totalUnits} 单元`);
    console.log(`  -> 保存到: src/data/stage${num}.json`);
  });
  
  console.log('='.repeat(50));
  console.log(`总计: ${totalAll} 字\n`);
  console.log('字表数据生成完成！');
}

main();
