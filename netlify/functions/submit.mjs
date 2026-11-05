const TELEGRAM_API = "https://api.telegram.org";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function telegramCall(method, body) {
  const response = await fetch(`${TELEGRAM_API}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    body
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error(`Telegram ${method} error:`, result);
    throw new Error(result?.description || `Telegram ${method} request failed`);
  }
  return result;
}

function safeText(value) {
  return String(value ?? "").trim();
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variable.");
    return json({ success: false, error: "Telegram is not configured yet. Please contact the site administrator." }, 500);
  }

  // A bot cannot message itself: the chat ID must be the customer-facing chat, not the bot's own ID.
  if (String(chatId).trim() === String(token).split(":")[0]) {
    console.error("TELEGRAM_CHAT_ID is set to the bot's own ID. Set it to the ID of the chat that should receive briefs.");
    return json({ success: false, error: "Telegram is not configured correctly yet. Please contact GOFERE." }, 500);
  }

  try {
    const form = await request.formData();
    const fields = [];
    const files = [];

    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        const text = safeText(value);
        if (text) fields.push(`${key}: ${text}`);
      } else if (value && typeof value === "object" && "arrayBuffer" in value && value.size > 0) {
        files.push({ field: key, file: value });
      }
    }

    const totalBytes = files.reduce((sum, item) => sum + item.file.size, 0);
    const maxTotalBytes = 5 * 1024 * 1024;
    if (totalBytes > maxTotalBytes) {
      return json({ success: false, error: "Attachments exceed the 5 MB combined upload limit. Please reduce the file sizes and try again." }, 413);
    }

    // Send attachments as Telegram documents. The field name identifies each upload type.
    for (const item of files) {
      const telegramForm = new FormData();
      telegramForm.append("chat_id", chatId);
      telegramForm.append("caption", `GOFERE design brief — ${item.field}`);
      telegramForm.append("document", item.file, item.file.name || `${item.field}-upload`);
      await telegramCall("sendDocument", telegramForm);
    }

    const club = safeText(form.get("club")) || "New customer";
    const heading = `🎨 GOFERE — NEW DESIGN REQUEST\nClub: ${club}\nReceived: ${new Date().toISOString()}\n\n`;
    const body = fields.length ? fields.join("\n") : "No text fields were supplied.";
    const attachmentLine = files.length
      ? `\n\n📎 Attachments sent: ${files.length}\n${files.map(x => `• ${x.field}: ${x.file.name}`).join("\n")}`
      : "\n\n📎 No files attached.";

    const message = (heading + body + attachmentLine).slice(0, 4000);
    const telegramForm = new FormData();
    telegramForm.append("chat_id", chatId);
    telegramForm.append("text", message);
    await telegramCall("sendMessage", telegramForm);

    return json({ success: true, message: "Your design brief was sent successfully." });
  } catch (error) {
    console.error("Design brief submission failed:", error);
    return json({
      success: false,
      error: "We couldn't send your design brief to Telegram. Please try again or contact GOFERE."
    }, 502);
  }
};

export const config = {
  path: "/.netlify/functions/submit"
};
