
const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN topilmadi!");
}

const bot = new Telegraf(BOT_TOKEN);

// Reklama bilan bog'liq xitoycha so'zlar
const chineseSpam = [
  "支付宝",
  "口令红包",
  "赚钱",
  "收款",
  "无风险",
  "红包",
  "日赚",
  "高价收u",
  "搬砖",
  "保证金"
];

// Reklama va to'lov so'zlari
const paymentWords = [
  "payment",
  "payments",
  "bank card",
  "bank cards",
  "merchant",
  "merchants",
  "usdt",
  "crypto",
  "commission",
  "commissions",
  "cash out",
  "money transfer",
  "alipay",
  "paypal",
  "收款",
  "支付宝"
];

// Reklama takliflari
const promoWords = [
  "earn money",
  "make money",
  "daily profit",
  "daily income",
  "guaranteed",
  "no risk",
  "no deposit",
  "looking for",
  "seeking",
  "we offer",
  "contact us",
  "join now",
  "recruiting",
  "high profit",
  "稳赚",
  "无风险",
  "日赚",
  "包教",
  "长期招"
];

// Davlat nomlari
const countries = [
  "ghana", "egypt", "philippines", "mongolia",
  "singapore", "malaysia", "bangladesh", "bengal",
  "saudi arabia", "canada", "kyrgyzstan",
  "ukraine", "india", "russia", "britain",
  "pakistan", "colombia", "south africa",
  "usa", "ethiopia", "turkiye", "taiwan",
  "portugal", "laos", "south korea", "germany",
  "myanmar", "thailand", "kazakhstan", "poland",
  "japan", "tajikistan", "mexico", "morocco",
  "uae", "qatar", "italy", "argentina"
];

function countMatches(text, words) {
  return words.filter(word => text.includes(word)).length;
}

function isSpam(text) {
  const lower = text.toLowerCase();

  const chineseCount =
    (text.match(/[\u3400-\u4DBF\u4E00-\u9FFF]/g) || []).length;

  const chineseKeywords = countMatches(
    lower,
    chineseSpam
  );

  const paymentCount = countMatches(
    lower,
    paymentWords
  );

  const promoCount = countMatches(
    lower,
    promoWords
  );

  const countryCount = countMatches(
    lower,
    countries
  );

  const telegramContact =
    /t\.me\/|telegram|@[a-z0-9_]{5,}/i.test(text);

  const whatsappContact =
    /whatsapp|wa\.me|whats\s*app/i.test(text);

  const phoneContact =
    /\+\d[\d\s().-]{7,}/.test(text);

  const contactCount =
    Number(telegramContact) +
    Number(whatsappContact) +
    Number(phoneContact);

  const chineseAdvertisement =
    chineseCount >= 5 &&
    chineseKeywords >= 1 &&
    (
      paymentCount >= 1 ||
      promoCount >= 1 ||
      contactCount >= 1
    );

  const internationalAdvertisement =
    paymentCount >= 2 &&
    promoCount >= 1 &&
    (
      contactCount >= 1 ||
      countryCount >= 5
    );

  const countryAdvertisement =
    countryCount >= 5 &&
    paymentCount >= 1 &&
    promoCount >= 1 &&
    contactCount >= 1;

  return (
    chineseAdvertisement ||
    internationalAdvertisement ||
    countryAdvertisement
  );
}

bot.on("message", async (ctx) => {
  try {
    const message = ctx.message;
    const chat = ctx.chat;

    // Faqat guruh va superguruhlarda ishlaydi
    if (
      chat.type !== "group" &&
      chat.type !== "supergroup"
    ) {
      return;
    }

    // Matn va media captionlarini tekshirish
    const text =
      message.text ||
      message.caption ||
      "";

    if (!text) return;

    // Adminlarga tegmaydi
    if (message.from) {
      const member = await ctx.telegram.getChatMember(
        chat.id,
        message.from.id
      );

      if (
        member.status === "creator" ||
        member.status === "administrator"
      ) {
        return;
      }
    }

    // Spam bo'lmasa hech narsa qilmaydi
    if (!isSpam(text)) return;

    const userId = message.from?.id;

    if (!userId || message.from.is_bot) return;

    // Avval xabarni o'chirish
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.log("Xabarni o'chirishda xato:", error.message);
    }

    // Keyin foydalanuvchini BAN qilish
    try {
      await ctx.telegram.banChatMember(
        chat.id,
        userId
      );

      console.log(
        `SPAM BAN: ${userId} | ${chat.id}`
      );
    } catch (error) {
      console.log("BAN xatosi:", error.message);
    }

  } catch (error) {
    console.log("Tekshirish xatosi:", error.message);
  }
});

// Xatolarni qayd qilish
bot.catch((error) => {
  console.log("Bot xatosi:", error.message);
});

// Botni ishga tushirish
bot.launch()
  .then(() => {
    console.log("Anti-Spam Bot ishga tushdi!");
  })
  .catch((error) => {
    console.log("Ishga tushirish xatosi:", error.message);
  });

// To'g'ri to'xtatish
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
