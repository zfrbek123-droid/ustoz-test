/**
 * Demo ma'lumotlar bilan bazani to'ldirish.
 * Ishga tushirish: bun prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function q(text: string, a: string, b: string, c: string, d: string, correct: string) {
  return { text, optionA: a, optionB: b, optionC: c, optionD: d, correct }
}

async function main() {
  await db.answer.deleteMany()
  await db.attempt.deleteMany()
  await db.sessionQuestion.deleteMany()
  await db.testSession.deleteMany()
  await db.purchase.deleteMany()
  await db.question.deleteMany()
  await db.topic.deleteMany()
  await db.module.deleteMany()
  await db.shopItem.deleteMany()
  await db.level.deleteMany()
  await db.setting.deleteMany()
  await db.user.deleteMany()

  // ---------- Ustoz ----------
  await db.user.create({
    data: {
      login: 'ustoz',
      password: 'ustoz123',
      name: 'Nodir Karimov',
      role: 'TEACHER',
    },
  })

  // ---------- Darajalar ----------
  const levels = [
    { order: 1, name: 'Yangi boshlovchi', requiredPoints: 0, icon: 'sprout' },
    { order: 2, name: 'Shogird', requiredPoints: 60, icon: 'book' },
    { order: 3, name: 'Bilimdon', requiredPoints: 120, icon: 'bulb' },
    { order: 4, name: 'Ekspert', requiredPoints: 180, icon: 'medal' },
    { order: 5, name: 'Ustoz', requiredPoints: 240, icon: 'cap' },
    { order: 6, name: 'Legenda', requiredPoints: 300, icon: 'crown' },
  ]
  for (const l of levels) await db.level.create({ data: l })

  // ---------- Sozlamalar ----------
  const settings = [
    { key: 'pointsPerCorrectGroup', value: '10' },
    { key: 'moneyPerCorrectGroup', value: '5' },
    { key: 'moneyPerCorrectIndividual', value: '3' },
    { key: 'totalModules', value: '30' },
    { key: 'modulesPerLevel', value: '5' },
    { key: 'avgPointsPerModule', value: '60' },
  ]
  for (const s of settings) await db.setting.create({ data: s })

  // ---------- Modullar, mavzular, savollar (matematika namunasi) ----------
  const moduleData: { title: string; covered: boolean; topics: { title: string; covered: boolean; questions: ReturnType<typeof q>[] }[] }[] = [
    {
      title: '1-modul: Sonlar va hisob',
      covered: true,
      topics: [
        {
          title: 'Tabiiy sonlar',
          covered: true,
          questions: [
            q('24 × 6 nechaga teng?', '124', '144', '134', '154', 'B'),
            q('144 ÷ 12 nechaga teng?', '12', '14', '16', '11', 'A'),
            q('Eng kichik tabiiy son qaysi?', '0', '1', '2', '10', 'B'),
            q('999 + 1 nechaga teng?', '998', '1000', '1001', '990', 'B'),
          ],
        },
        {
          title: 'Qo‘shish va ayirish',
          covered: true,
          questions: [
            q('345 + 267 nechaga teng?', '602', '612', '622', '592', 'B'),
            q('1000 − 487 nechaga teng?', '513', '523', '503', '613', 'A'),
            q('87 + 56 nechaga teng?', '133', '143', '153', '142', 'B'),
            q('200 − 75 nechaga teng?', '115', '125', '135', '145', 'B'),
          ],
        },
      ],
    },
    {
      title: '2-modul: Ko‘paytirish va bo‘lish',
      covered: true,
      topics: [
        {
          title: 'Ko‘paytma jadvali',
          covered: true,
          questions: [
            q('12 × 8 nechaga teng?', '86', '96', '106', '88', 'B'),
            q('7 × 9 nechaga teng?', '56', '63', '64', '72', 'B'),
            q('15 × 4 nechaga teng?', '45', '55', '60', '65', 'C'),
            q('11 × 11 nechaga teng?', '111', '121', '122', '131', 'B'),
          ],
        },
        {
          title: 'Bo‘linma va qoldiq',
          covered: true,
          questions: [
            q('47 ni 5 ga bo‘lgandagi qoldiq nechaga teng?', '1', '2', '3', '4', 'B'),
            q('100 ÷ 25 nechaga teng?', '2', '3', '4', '5', 'C'),
            q('81 ÷ 9 nechaga teng?', '8', '9', '7', '6', 'B'),
            q('52 ni 6 ga bo‘lgandagi to‘liq bo‘linma nechaga teng?', '7', '8', '9', '6', 'B'),
          ],
        },
      ],
    },
    {
      title: '3-modul: Kasrlar va foizlar',
      covered: true,
      topics: [
        {
          title: 'Oddiy kasrlar',
          covered: true,
          questions: [
            q('1/2 + 1/4 nechaga teng?', '2/6', '3/4', '2/4', '1/6', 'B'),
            q('3/5 ulushni foizda ifodalang', '30%', '50%', '60%', '65%', 'C'),
            q('12 ning 2/3 ulushi nechaga teng?', '6', '8', '9', '4', 'B'),
            q('1 − 3/8 nechaga teng?', '3/8', '5/8', '4/8', '6/8', 'B'),
          ],
        },
        {
          title: 'Foizlar',
          covered: true,
          questions: [
            q('200 ning 15% i nechaga teng?', '20', '25', '30', '35', 'C'),
            q('50 ning 20% i nechaga teng?', '5', '10', '15', '20', 'B'),
            q('80 ning 25% i nechaga teng?', '16', '18', '20', '24', 'C'),
            q('400 ning 12% i nechaga teng?', '36', '42', '48', '54', 'C'),
          ],
        },
      ],
    },
    {
      title: '4-modul: Geometriya',
      covered: false,
      topics: [
        {
          title: 'Perimetr',
          covered: false,
          questions: [
            q('Tomoni 5 sm bo‘lgan kvadratning perimetri qancha?', '10 sm', '15 sm', '20 sm', '25 sm', 'C'),
            q('To‘g‘ri to‘rtburchakning tomonlari 6 sm va 4 sm. Perimetri qancha?', '20 sm', '24 sm', '10 sm', '12 sm', 'A'),
            q('Teng tomonli uchburchak tomoni 7 sm. Perimetri qancha?', '14 sm', '21 sm', '28 sm', '49 sm', 'B'),
            q('Tomoni 9 sm bo‘lgan kvadratning perimetri qancha?', '18 sm', '27 sm', '36 sm', '81 sm', 'C'),
          ],
        },
        {
          title: 'Yuza',
          covered: false,
          questions: [
            q('To‘g‘ri to‘rtburchakning tomonlari 8 sm va 5 sm. Yuzasi qancha?', '26 sm²', '40 sm²', '13 sm²', '45 sm²', 'B'),
            q('Tomoni 6 sm bo‘lgan kvadratning yuzasi qancha?', '24 sm²', '36 sm²', '12 sm²', '18 sm²', 'B'),
            q('Uchburchakning asosi 10 sm, balandligi 6 sm. Yuzasi qancha?', '60 sm²', '30 sm²', '16 sm²', '20 sm²', 'B'),
          ],
        },
      ],
    },
    {
      title: '5-modul: Algebra asoslari',
      covered: false,
      topics: [
        {
          title: 'Ifodalar',
          covered: false,
          questions: [
            q('x = 4 bo‘lganda 3x + 2 qiymati nechaga teng?', '12', '14', '16', '10', 'B'),
            q('a = 3, b = 5 bo‘lganda a + b·2 qiymati nechaga teng?', '16', '13', '11', '26', 'B'),
            q('x = 5 bo‘lganda 2(x + 3) qiymati nechaga teng?', '13', '16', '10', '22', 'B'),
          ],
        },
        {
          title: 'Tenglamalar',
          covered: false,
          questions: [
            q('x + 7 = 15 tenglamada x nechaga teng?', '6', '7', '8', '9', 'C'),
            q('3x = 27 tenglamada x nechaga teng?', '6', '8', '9', '24', 'C'),
            q('2x − 4 = 10 tenglamada x nechaga teng?', '3', '5', '7', '14', 'C'),
          ],
        },
      ],
    },
    {
      title: '6-modul: Amaliy matematika',
      covered: false,
      topics: [
        {
          title: 'Proporsiyalar',
          covered: false,
          questions: [
            q('2 : 3 = x : 12 proporsiyada x nechaga teng?', '6', '8', '9', '10', 'B'),
            q('Mashina 60 km/soat tezlikda 2,5 soatda qancha yo‘l bosadi?', '120 km', '135 km', '150 km', '180 km', 'C'),
            q('3 ta daftar 12 000 so‘m bo‘lsa, 5 ta daftar necha so‘m?', '18 000', '20 000', '24 000', '16 000', 'B'),
          ],
        },
        {
          title: 'Statistika elementlari',
          covered: false,
          questions: [
            q('3, 6, 9 sonlarining o‘rta arifmetigi nechaga teng?', '5', '6', '7', '9', 'B'),
            q('2, 4, 4, 6, 9 sonlar qatorining medianasi qaysi?', '4', '5', '6', '9', 'A'),
            q('5, 5, 5 sonlarining o‘rta arifmetigi nechaga teng?', '3', '5', '15', '1', 'B'),
          ],
        },
      ],
    },
  ]

  let moduleOrder = 1
  let questionCount = 0
  for (const m of moduleData) {
    const createdModule = await db.module.create({
      data: { title: m.title, order: moduleOrder++ },
    })
    for (const t of m.topics) {
      const createdTopic = await db.topic.create({
        data: {
          moduleId: createdModule.id,
          title: t.title,
          isCovered: t.covered,
        },
      })
      for (const question of t.questions) {
        await db.question.create({ data: { ...question, topicId: createdTopic.id } })
        questionCount++
      }
    }
  }
  console.log(`Modullar: ${moduleData.length}, savollar: ${questionCount}`)

  // ---------- O'quvchilar ----------
  const students = [
    { name: 'Ali Valiyev', login: 'ali', points: 130, money: 90, levelOrder: 2, owned: ['qalam', 'daftar', 'lineyka', 'gumka', 'kalkulyator'] },
    { name: 'Malika Yo‘ldosheva', login: 'malika', points: 95, money: 55, levelOrder: 2, owned: ['qalam', 'daftar', 'lineyka'] },
    { name: 'Bekzod Karimov', login: 'bekzod', points: 55, money: 35, levelOrder: 1, owned: ['daftar'] },
    { name: 'Dilnoza Rahimova', login: 'dilnoza', points: 20, money: 20, levelOrder: 1, owned: [] },
    { name: 'Jasur Toshmatov', login: 'jasur', points: 10, money: 15, levelOrder: 1, owned: [] },
    { name: 'Nilufar Saidova', login: 'nilufar', points: 40, money: 25, levelOrder: 1, owned: ['qalam'] },
    { name: 'Aziz Rahmonov', login: 'aziz', points: 0, money: 10, levelOrder: 1, owned: [] },
    { name: 'Kamola Nurmatova', login: 'kamola', points: 70, money: 40, levelOrder: 1, owned: ['qalam', 'daftar'] },
    { name: 'Sardor Umarov', login: 'sardor', points: 5, money: 12, levelOrder: 1, owned: [] },
    { name: 'Zuhra Qodirova', login: 'zuhra', points: 25, money: 18, levelOrder: 1, owned: [] },
  ]

  // Jihozlar kaliti -> keyin sotib olishda ishlatiladi
  const itemKeys = [
    'qalam', 'daftar', 'lineyka', 'gumka', 'qaychi', 'ranglar', // 1-daraja
    'kalkulyator', 'geometriya', 'sumka', 'lugat', 'markerlar', 'atlas', 'abak', // 2-darajadan
    'planshet', 'mikroskop', 'globus', 'ensiklopediya', 'soat', // 3-darajadan
    'noutbuk', 'printer', 'kitoblar', 'quloqchin', 'kanselyariya', // 4-darajadan
    'kubok', 'medal', 'toj', 'olmos', 'superkompyuter', // 5-darajadan
  ]

  const shopItems: { key: string; name: string; icon: string; price: number; minLevel: number; requiredForLevel: number }[] = [
    { key: 'qalam', name: 'Qalam to‘plami', icon: '✏️', price: 25, minLevel: 1, requiredForLevel: 2 },
    { key: 'daftar', name: 'Daftar (5 dona)', icon: '📓', price: 15, minLevel: 1, requiredForLevel: 2 },
    { key: 'lineyka', name: 'Lineyka', icon: '📏', price: 20, minLevel: 1, requiredForLevel: 2 },
    { key: 'gumka', name: 'Gumka', icon: '🧽', price: 10, minLevel: 1, requiredForLevel: 0 },
    { key: 'qaychi', name: 'Qaychi', icon: '✂️', price: 18, minLevel: 1, requiredForLevel: 0 },
    { key: 'ranglar', name: 'Rangkarlar to‘plami', icon: '🎨', price: 35, minLevel: 1, requiredForLevel: 0 },
    { key: 'kalkulyator', name: 'Kalkulyator', icon: '🔢', price: 60, minLevel: 2, requiredForLevel: 3 },
    { key: 'geometriya', name: 'Geometriya to‘plami', icon: '📐', price: 50, minLevel: 2, requiredForLevel: 3 },
    { key: 'sumka', name: 'Maktab sumkasi', icon: '🎒', price: 70, minLevel: 2, requiredForLevel: 3 },
    { key: 'lugat', name: 'O‘zbekcha lug‘at', icon: '📖', price: 55, minLevel: 2, requiredForLevel: 3 },
    { key: 'markerlar', name: 'Markerlar to‘plami', icon: '🖍', price: 30, minLevel: 2, requiredForLevel: 0 },
    { key: 'atlas', name: 'Atlas xaritalari', icon: '🗺', price: 40, minLevel: 2, requiredForLevel: 0 },
    { key: 'abak', name: 'Hisob abaki', icon: '🧮', price: 45, minLevel: 2, requiredForLevel: 0 },
    { key: 'planshet', name: 'Planshet', icon: '📱', price: 150, minLevel: 3, requiredForLevel: 4 },
    { key: 'mikroskop', name: 'Mikroskop', icon: '🔬', price: 180, minLevel: 3, requiredForLevel: 4 },
    { key: 'globus', name: 'Globus', icon: '🌍', price: 120, minLevel: 3, requiredForLevel: 4 },
    { key: 'ensiklopediya', name: 'Ensiklopediya', icon: '📚', price: 140, minLevel: 3, requiredForLevel: 4 },
    { key: 'soat', name: 'Uy soati', icon: '⏰', price: 90, minLevel: 3, requiredForLevel: 0 },
    { key: 'noutbuk', name: 'Noutbuk', icon: '💻', price: 300, minLevel: 4, requiredForLevel: 5 },
    { key: 'printer', name: 'Printer', icon: '🖨', price: 260, minLevel: 4, requiredForLevel: 5 },
    { key: 'kitoblar', name: 'Klassik kitoblar to‘plami', icon: '📕', price: 240, minLevel: 4, requiredForLevel: 5 },
    { key: 'quloqchin', name: 'Quloqchin', icon: '🎧', price: 200, minLevel: 4, requiredForLevel: 5 },
    { key: 'kanselyariya', name: 'Kanselyariya to‘plami', icon: '🖇', price: 150, minLevel: 4, requiredForLevel: 0 },
    { key: 'kubok', name: 'Oltin kubok', icon: '🏆', price: 500, minLevel: 5, requiredForLevel: 6 },
    { key: 'medal', name: 'Faxriy medal', icon: '🏅', price: 450, minLevel: 5, requiredForLevel: 6 },
    { key: 'toj', name: 'Legenda toji', icon: '👑', price: 600, minLevel: 5, requiredForLevel: 6 },
    { key: 'olmos', name: 'Olmos yulduz', icon: '💎', price: 550, minLevel: 5, requiredForLevel: 6 },
    { key: 'superkompyuter', name: 'Super kompyuter', icon: '🖥', price: 700, minLevel: 5, requiredForLevel: 0 },
  ]

  const createdItems = new Map<string, string>()
  for (const item of shopItems) {
    const created = await db.shopItem.create({
      data: {
        name: item.name,
        icon: item.icon,
        price: item.price,
        minLevel: item.minLevel,
        requiredForLevel: item.requiredForLevel,
      },
    })
    createdItems.set(item.key, created.id)
  }

  for (const s of students) {
    const user = await db.user.create({
      data: {
        login: s.login,
        password: '1234',
        name: s.name,
        role: 'STUDENT',
        points: s.points,
        money: s.money,
        levelOrder: s.levelOrder,
      },
    })
    for (const key of s.owned) {
      const itemId = createdItems.get(key)
      if (itemId) await db.purchase.create({ data: { userId: user.id, itemId } })
    }
  }

  console.log('Demo ma\'lumotlar bazaga yozildi ✔')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
