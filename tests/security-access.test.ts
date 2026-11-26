import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Live integration tests. Provide short-lived admin/client sessions as JSON files
// containing {token,userId}; never put credentials in this repository.
const adminPath = process.env.SECURITY_ADMIN_SESSION;
const clientPath = process.env.SECURITY_CLIENT_SESSION;
const live = adminPath && clientPath ? describe : describe.skip;

live("Isolation réelle des données clients", () => {
  const url = process.env.VITE_SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const makeClient = (token?: string) => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
  let admin: ReturnType<typeof makeClient>;
  let client: ReturnType<typeof makeClient>;
  let anonymous: ReturnType<typeof makeClient>;
  const invoiceIds = [crypto.randomUUID(), crypto.randomUUID()];
  const requestIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  const appointmentIds = [crypto.randomUUID(), crypto.randomUUID()];
  const saleId = crypto.randomUUID();
  const imagePath = `security-tests/${crypto.randomUUID()}.png`;
  const day = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const endDay = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  let clientUserId = "";

  beforeAll(async () => {
    if (!adminPath || !clientPath) throw new Error("Sessions de test absentes");
    const a = JSON.parse(readFileSync(adminPath, "utf8"));
    const c = JSON.parse(readFileSync(clientPath, "utf8"));
    clientUserId = c.userId;
    admin = makeClient(a.token); client = makeClient(c.token); anonymous = makeClient();
    expect((await admin.rpc("is_admin")).data).toBe(true);
    expect((await client.rpc("is_admin")).data).toBe(false);
    for (const [index, userId] of [a.userId, c.userId].entries()) {
      expect((await admin.from("bordereaux").insert({ id: invoiceIds[index], user_id: userId,
        bordereau_number: `SECURITY-TEST-${invoiceIds[index]}`, adjudication_price: 100,
        fees_amount: 20, total_ttc: 120 })).error).toBeNull();
      expect((await admin.from("estimation_requests").insert({ id: requestIds[index], user_id: userId,
        nom: "Test de sécurité temporaire", email: "security-test@example.com", description: "Objet de test temporaire" })).error).toBeNull();
      expect((await admin.from("pickup_appointments").insert({ id: appointmentIds[index], user_id: userId,
        appointment_date: day, appointment_time: index === 0 ? "03:17:01" : "03:17:02",
        notes: "Note confidentielle de test" })).error).toBeNull();
    }
    expect((await admin.from("interencheres_sales").insert({ id: saleId, house_id: "security-test",
      title: "Vente temporaire de test de sécurité", sale_url: "/security-test" })).error).toBeNull();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ioAAAAASUVORK5CYII=", "base64");
    expect((await admin.storage.from("sale-images").upload(imagePath, png, { contentType: "image/png" })).error).toBeNull();
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("bordereaux").delete().in("id", invoiceIds);
    await admin.from("estimation_requests").delete().in("id", requestIds);
    await admin.from("pickup_appointments").delete().in("id", appointmentIds);
    await admin.from("interencheres_sales").delete().eq("id", saleId);
    await admin.storage.from("sale-images").remove([imagePath]);
  });

  for (const [table, ids] of [["bordereaux", invoiceIds], ["estimation_requests", requestIds.slice(0, 2)],
    ["pickup_appointments", appointmentIds]] as const) {
    test(`Un visiteur ne peut pas lire ${table}`, async () => {
      const { data, error } = await anonymous.from(table).select("id").in("id", [...ids]);
      expect(error !== null || data?.length === 0).toBe(true);
    });
    test(`Un client ne lit que ses propres ${table}`, async () => {
      const { data, error } = await client.from(table).select("id").in("id", [...ids]);
      expect(error).toBeNull();
      expect(data).toEqual([{ id: ids[1] }]);
    });
  }
  test("Un client ne peut pas modifier son bordereau ni celui d’autrui", async () => {
    const result = await client.from("bordereaux").update({ total_ttc: 1 }).in("id", invoiceIds).select("id");
    expect(result.error !== null || result.data?.length === 0).toBe(true);
    const { data } = await admin.from("bordereaux").select("total_ttc").in("id", invoiceIds);
    expect(data?.map(row => row.total_ttc)).toEqual([120, 120]);
  });
  test("Un client ne peut pas modifier l’estimation d’autrui", async () => {
    const result = await client.from("estimation_requests").update({ status: "responded" }).eq("id", requestIds[0]).select("id");
    expect(result.error !== null || result.data?.length === 0).toBe(true);
    expect((await admin.from("estimation_requests").select("status").eq("id", requestIds[0]).single()).data?.status).toBe("new");
  });
  test("Les créneaux occupés révèlent seulement une date et une heure", async () => {
    const { data, error } = await client.rpc("get_booked_pickup_slots", { start_date: day, end_date: endDay });
    expect(error).toBeNull();
    const fixture = data?.find(row => row.appointment_time === "03:17:01");
    expect(fixture).toEqual({ appointment_date: day, appointment_time: "03:17:01" });
    expect(Object.keys(fixture || {}).sort()).toEqual(["appointment_date", "appointment_time"]);
  });
  test("La demande d’estimation anonyme reste possible sans lecture publique", async () => {
    const result = await anonymous.from("estimation_requests").insert({ id: requestIds[2], user_id: null,
      nom: "Test anonyme temporaire", email: "security-test@example.com", description: "Objet de test temporaire" });
    expect(result.error).toBeNull();
    expect((await admin.from("estimation_requests").select("id").eq("id", requestIds[2]).single()).data?.id).toBe(requestIds[2]);
  });
  test("Un client ne peut pas se nommer administrateur", async () => {
    expect((await client.from("user_roles").insert({ user_id: clientUserId, role: "admin" })).error).not.toBeNull();
    expect((await client.rpc("is_admin")).data).toBe(false);
  });
  test("Le catalogue reste public mais non modifiable par un client", async () => {
    expect((await anonymous.from("interencheres_sales").select("id").eq("id", saleId).single()).data?.id).toBe(saleId);
    const result = await client.from("interencheres_sales").update({ title: "Modification interdite" }).eq("id", saleId).select("id");
    expect(result.error !== null || result.data?.length === 0).toBe(true);
    expect((await admin.from("interencheres_sales").select("title").eq("id", saleId).single()).data?.title).toBe("Vente temporaire de test de sécurité");
  });
  test("Les images restent lisibles mais ne peuvent pas être remplacées par un client", async () => {
    expect((await anonymous.storage.from("sale-images").download(imagePath)).error).toBeNull();
    expect((await client.storage.from("sale-images").upload(imagePath, new Uint8Array([0]),
      { upsert: true, contentType: "image/png" })).error).not.toBeNull();
  });
});