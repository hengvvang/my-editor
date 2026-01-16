// Dictionary configuration based on qwerty-learner structure
export interface Dictionary {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  length: number
  languageCategory: string
  url: string
}

export const dictionaries: Dictionary[] = [
  {
    id: 'cet4',
    name: 'CET-4',
    description: '大学英语四级词汇',
    category: 'en',
    tags: ['CET-4', '四级'],
    length: 2607,
    languageCategory: 'en',
    url: '/dicts/CET4_T.json',
  },
  {
    id: 'cet6',
    name: 'CET-6',
    description: '大学英语六级词汇',
    category: 'en',
    tags: ['CET-6', '六级'],
    length: 2345,
    languageCategory: 'en',
    url: '/dicts/CET6_T.json',
  },
  {
    id: 'gre',
    name: 'GRE',
    description: 'GRE 词汇',
    category: 'en',
    tags: ['GRE'],
    length: 3140,
    languageCategory: 'en',
    url: '/dicts/GRE_T.json',
  },
  {
    id: 'ielts',
    name: 'IELTS',
    description: '雅思词汇',
    category: 'en',
    tags: ['IELTS', '雅思'],
    length: 3575,
    languageCategory: 'en',
    url: '/dicts/IELTS_T.json',
  },
  {
    id: 'toefl',
    name: 'TOEFL',
    description: '托福词汇',
    category: 'en',
    tags: ['TOEFL', '托福'],
    length: 4264,
    languageCategory: 'en',
    url: '/dicts/TOEFL_T.json',
  },
  {
    id: 'programmer',
    name: 'Programmer',
    description: '程序员常用词汇',
    category: 'code',
    tags: ['编程', 'Programming'],
    length: 50,
    languageCategory: 'code',
    url: '/dicts/programmer.json',
  },
  {
    id: 'basic',
    name: 'Basic Algorithm',
    description: '基础算法词汇',
    category: 'code',
    tags: ['算法', 'Algorithm'],
    length: 30,
    languageCategory: 'code',
    url: '/dicts/basic.json',
  },
]

export const idDictionaryMap = dictionaries.reduce<Record<string, Dictionary>>((acc, dict) => {
  acc[dict.id] = dict
  return acc
}, {})

export const defaultDictId = 'cet4'
