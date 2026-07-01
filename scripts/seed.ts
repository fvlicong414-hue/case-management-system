/**
 * 初期データ投入スクリプト
 * 実行方法: npm run db:seed
 * (テーブルが無ければ自動作成されます。既存データがあれば重複作成しません)
 */
import { getOrCreateDefaultTenant } from "../src/lib/db/tenants";
import { getUserByEmail, createUser } from "../src/lib/db/users";
import { updateSettings } from "../src/lib/db/settings";
import { ensureDefaultFormats } from "../src/lib/db/documentFormats";
import { createCustomer, listCustomers } from "../src/lib/db/customers";
import { createItemMaster, listItemMasters } from "../src/lib/db/itemMaster";
import { createProject, listProjects } from "../src/lib/db/projects";

async function main() {
  const tenant = await getOrCreateDefaultTenant();
  console.log("テナント:", tenant.name, tenant.id);

  await ensureDefaultFormats(tenant.id);

  await updateSettings(tenant.id, {
    companyName: "株式会社フォーバル",
    companyAddress: "東京都渋谷区南平台町16-17",
    companyPhone: "03-0000-0000",
    companyInvoiceRegistrationNumber: "T0000000000000",
    bankInfo: "〇〇銀行 〇〇支店 普通 0000000 カ)フォーバル",
    overheadRate: 0.15,
  });

  const users: { name: string; email: string; password: string; role: "forval_admin" | "customer_admin" | "staff" }[] = [
    { name: "フォーバル管理者", email: "admin@forval.local", password: "password123", role: "forval_admin" },
    { name: "顧客管理者", email: "customer-admin@forval.local", password: "password123", role: "customer_admin" },
    { name: "担当者", email: "staff@forval.local", password: "password123", role: "staff" },
  ];

  const bcrypt = await import("bcryptjs");
  for (const u of users) {
    if (!(await getUserByEmail(u.email))) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await createUser({ tenantId: tenant.id, name: u.name, email: u.email, passwordHash, role: u.role });
      console.log(`ユーザー作成: ${u.email} / ${u.password} (${u.role})`);
    } else {
      console.log(`ユーザー既存: ${u.email}`);
    }
  }

  // サンプル品目
  if ((await listItemMasters(tenant.id, { includeInactive: true })).length === 0) {
    const items = [
      { itemCode: "I0001", name: "足場仮設工事", specification: "枠組足場", unit: "m2", defaultSalesPrice: 1500, defaultCostPrice: 900, category: "仮設工事" },
      { itemCode: "I0002", name: "外壁塗装工事", specification: "シリコン系塗料", unit: "m2", defaultSalesPrice: 3200, defaultCostPrice: 1800, category: "塗装工事" },
      { itemCode: "I0003", name: "屋根防水工事", specification: "ウレタン防水", unit: "m2", defaultSalesPrice: 4500, defaultCostPrice: 2600, category: "防水工事" },
      { itemCode: "I0004", name: "シーリング打替", specification: "変成シリコン", unit: "m", defaultSalesPrice: 900, defaultCostPrice: 450, category: "シーリング工事" },
    ];
    for (const it of items) {
      await createItemMaster(tenant.id, { ...it, isActive: true } as any);
    }
    console.log("サンプル品目マスターを作成しました");
  }

  // サンプル顧客
  if ((await listCustomers(tenant.id, { includeInactive: true })).length === 0) {
    const customer = await createCustomer(tenant.id, {
      name: "株式会社サンプル建設",
      billingName: "株式会社サンプル建設",
      postalCode: "150-0036",
      address: "東京都渋谷区南平台町1-1",
      phone: "03-1111-2222",
      contactPerson: "山田太郎",
      closingDay: "末日",
      paymentTerms: "翌月末払い",
      invoiceFormatId: null,
      quoteFormatId: null,
      specFormatId: null,
      memo: null,
    } as any);
    console.log("サンプル顧客を作成しました:", customer.name);

    if ((await listProjects(tenant.id)).length === 0) {
      const project = await createProject(tenant.id, {
        customerId: customer.id,
        projectName: "サンプルマンション大規模修繕工事",
        siteName: "サンプルマンションA棟",
        siteAddress: "東京都渋谷区南平台町2-2",
        internalOwnerId: null,
        customerContact: "山田太郎",
        workCategory: "大規模修繕",
        status: "見積中",
        startPlanDate: null,
        completionPlanDate: null,
        completedDate: null,
        memo: null,
      } as any);
      console.log("サンプル案件を作成しました:", project.projectName);
    }
  }

  console.log("\n=== 初期データ投入が完了しました ===");
  console.log("ログイン情報:");
  for (const u of users) {
    console.log(`  ${u.role.padEnd(15)} : ${u.email} / ${u.password}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
