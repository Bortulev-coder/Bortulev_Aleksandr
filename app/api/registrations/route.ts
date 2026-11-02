import { getDb } from "../../../db";
import { registrations } from "../../../db/schema";

const error = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return error("Отправьте заявку с сайта мероприятия.", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return error("Неподдерживаемый формат заявки.", 415);
  }
  let data: Record<string, unknown>;
  try {
    const body = await request.text();
    if (body.length > 8000) return error("Заявка слишком длинная.", 413);
    data = JSON.parse(body);
    if (!data || typeof data !== "object" || Array.isArray(data)) return error("Проверьте данные заявки.");
  } catch { return error("Не удалось прочитать заявку."); }
  if (data.website) return error("Не удалось отправить заявку.");
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const question = typeof data.question === "string" ? data.question.trim() : "";
  if (name.length < 2 || name.length > 120) return error("Укажите имя и фамилию (от 2 до 120 символов).");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Укажите корректный адрес электронной почты.");
  if (question.length > 1200) return error("Сократите вопрос до 1200 символов.");
  if (data.consent !== true) return error("Подтвердите согласие на обработку данных заявки.");
  if (data.eventId !== "olympiads-to-itmo") return error("Мероприятие не найдено.", 404);
  try {
    const now = new Date().toISOString();
    await getDb().insert(registrations).values({
      id: crypto.randomUUID(), eventId: "olympiads-to-itmo", name, email, question,
      consentAt: now, createdAt: now,
    }).onConflictDoNothing();
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Сейчас не удалось сохранить заявку. Пожалуйста, попробуйте позже.", 503);
  }
}
