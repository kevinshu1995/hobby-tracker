import { db } from "./db";

/**
 * 初始化資料庫連接並加載預設資料（如果需要）
 * @returns Promise<boolean> 初始化是否成功
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // 檢查資料庫連接
    await db.open();
    console.log("資料庫連接成功");

    // 檢查並加載預設分類資料
    const categoriesCount = await db.categories.count();
    if (categoriesCount === 0) {
      await addDefaultCategories();
    }

    return true;
  } catch (error) {
    console.error("資料庫初始化失敗:", error);
    return false;
  }
}

/**
 * 添加預設的分類資料
 */
async function addDefaultCategories(): Promise<void> {
  const now = new Date();
  const defaultCategories = [
    {
      id: crypto.randomUUID(),
      name: "運動",
      color: "#4CAF50",
      icon: "fitness",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "學習",
      color: "#2196F3",
      icon: "school",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "創作",
      color: "#FF9800",
      icon: "create",
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.categories.bulkAdd(defaultCategories);
  console.log("已添加預設分類資料");
}
