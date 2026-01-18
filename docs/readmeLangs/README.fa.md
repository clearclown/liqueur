<div align="center" dir="rtl">

# Liquid Protocol

**داشبوردها را با زبان طبیعی تغییر دهید.**

پروتکل متن‌باز برای تولید UI با هوش مصنوعی

[![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square&color=blue)](https://www.npmjs.com/package/@liqueur/protocol)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](../../LICENSE)

[English](../../README.md) | [日本語](./README.ja.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [Русский](./README.ru.md) | [Українська](./README.uk.md) | فارسی | [العربية](./README.ar.md)

</div>

---

<div dir="rtl">

## خلاصه

**«هزینه‌های حمل و نقل را حذف کن و هزینه‌های ماهانه را به صورت نمودار میله‌ای نشان بده»**

فقط این را بگویید و داشبورد شما به طور خودکار پیکربندی می‌شود.

</div>

<div align="center">

| قبل | بعد |
|-----|-----|
| ![داشبورد اولیه](../images/dashboard-initial.png) | ![پس از به‌روزرسانی AI](../images/dashboard-after-ai.png) |
| داشبورد پیش‌فرض | پس از گفتن «حذف حمل و نقل» |

</div>

---

<div dir="rtl">

## شروع سریع (۳۰ ثانیه)

</div>

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard
npm run dev
```

<div dir="rtl">

[http://localhost:3000](http://localhost:3000) را باز کنید و شروع به گفتگو کنید.

---

## فهرست مطالب

- [چرا Liquid Protocol؟](#چرا-liquid-protocol)
- [مقایسه با Claude Artifacts / Gemini Canvas](#مقایسه-با-claude-artifacts--gemini-canvas)
- [موارد استفاده](#موارد-استفاده)
- [نحوه کار](#نحوه-کار)
- [نصب](#نصب)
- [راه‌اندازی برای توسعه‌دهندگان](#راهاندازی-برای-توسعهدهندگان)
- [طراحی امنیتی](#طراحی-امنیتی)
- [نقشه راه](#نقشه-راه)

---

## چرا Liquid Protocol؟

### معضل سفارشی‌سازی

یک برنامه مدیریت بودجه را در نظر بگیرید. هر برنامه‌ای که استفاده کنید، همیشه درخواست‌هایی مانند این خواهید داشت:

> - «هزینه حمل و نقل را حذف کن - شرکت آن را پرداخت می‌کند»
> - «خریدهای کارت خانواده باید جدا باشد - بازپرداخت می‌شود»
> - «همه هزینه‌های سفر را با برچسب "سفر" مشخص کن»
> - «من قرمز را دوست ندارم - آبی و سیاه کن»

**راه‌حل‌های فعلی:**

| رویکرد | مثال | مشکل |
|:-------|:-----|:-----|
| همه چیز را خودتان بسازید | Notion، صفحات گسترده | سفارشی‌سازی هدف می‌شود. تمرکز از دست می‌رود |
| تنظیمات بیشتر اضافه کنید | برنامه‌های سنتی | صفحات تنظیمات پیچیده می‌شود. «آزادی بیش از حد» |

### راه‌حل Liquid

**فقط بگویید چه می‌خواهید.**

```
کاربر: «هزینه حمل و نقل را حذف کن»
    ↓
AI ساختار داشبورد را بازتولید می‌کند
    ↓
فیلترها، نمودارها و چیدمان‌ها به طور خودکار به‌روز می‌شوند
```

دیگر نیازی به جستجو در صفحات تنظیمات نیست.

---

## مقایسه با Claude Artifacts / Gemini Canvas

آیا از [Claude Artifacts](https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) یا [Gemini Canvas](https://gemini.google/overview/canvas/) استفاده کرده‌اید؟

آن‌ها ویژگی‌های شگفت‌انگیزی هستند که به شما اجازه می‌دهند داشبوردها و کد را از طریق مکالمه با AI تولید کنید.

**Liquid Protocol این تجربه را به برنامه شما می‌آورد.**

| ویژگی | Claude Artifacts | Gemini Canvas | **Liquid Protocol** |
|-------|:---------------:|:-------------:|:-------------------:|
| تولید UI با AI | ✅ | ✅ | ✅ |
| جاسازی در برنامه خودتان | ❌ | ❌ | **✅** |
| اتصال به پایگاه داده خودتان | ❌ | ❌ | **✅** |
| Row-Level Security | ❌ | ❌ | **✅** |
| ریسک اجرای کد | ⚠️ سندباکس | ⚠️ سندباکس | **✅ هیچ** |
| متن‌باز | ❌ | ❌ | **✅ MIT** |
| انتخاب ارائه‌دهنده AI | فقط Claude | فقط Gemini | **هر کدام** |

### خلاصه

```
Claude Artifacts / Gemini Canvas
  → شگفت‌انگیز. اما فقط در برنامه‌های آن‌ها.

Liquid Protocol
  → همان تجربه در برنامه شما.
    پایگاه داده شما، کاربران شما.
```

---

## موارد استفاده

ما با یک برنامه بودجه نمایش می‌دهیم، اما این فناوری برای هر برنامه‌ای کاربرد دارد:

| برنامه | مشکل سنتی | راه‌حل Liquid |
|:-------|:----------|:-------------|
| **Slack / Discord** | تنظیمات پیچیده اعلان | «فقط برای مکالمات مهم اعلان بده» |
| **معاملات سهام** | داشبوردهای ثابت | «فقط سهام فناوری را در نمودار دایره‌ای نشان بده» |
| **Twitter / SNS** | الگوریتم نامشخص | «محتوای سیاسی را پنهان کن» |
| **مدیریت پروژه** | جهنم تنظیمات Jira | «فقط وظایف این هفته من را نشان بده» |

**این فناوری به استاندارد نرم‌افزار تبدیل خواهد شد.**

---

## نصب

### بر اساس کاربرد

</div>

```bash
# فقط تعاریف اسکیما
npm install @liqueur/protocol

# اضافه کردن React UI
npm install @liqueur/protocol @liqueur/react

# فول استک (AI + پایگاه داده)
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter
```

<div dir="rtl">

### پکیج‌ها

| پکیج | کاربرد |
|:-----|:-------|
| [@liqueur/protocol](https://www.npmjs.com/package/@liqueur/protocol) | تایپ‌های اسکیما و اعتبارسنجی |
| [@liqueur/react](https://www.npmjs.com/package/@liqueur/react) | کامپوننت‌های UI |
| [@liqueur/ai-provider](https://www.npmjs.com/package/@liqueur/ai-provider) | یکپارچه‌سازی ارائه‌دهنده AI |
| [@liqueur/db-adapter](https://www.npmjs.com/package/@liqueur/db-adapter) | اجرای کوئری Prisma |
| [@liqueur/artifact-store](https://www.npmjs.com/package/@liqueur/artifact-store) | ذخیره‌سازی اسکیما |
| [create-next-liqueur-app](https://www.npmjs.com/package/create-next-liqueur-app) | CLI ساخت پروژه |

---

## راه‌اندازی برای توسعه‌دهندگان

### روش ۱: شروع سریع با CLI

</div>

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard

# پیکربندی ارائه‌دهنده AI
cp .env.example .env
# فایل .env را ویرایش کنید و API key را اضافه کنید

npm run dev
```

<div dir="rtl">

### روش ۲: افزودن به پروژه موجود

</div>

```bash
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider
```

<div dir="rtl">

### متغیرهای محیطی

هنگام استفاده از `@liqueur/ai-provider`، متغیرهای محیطی را برای ارائه‌دهنده AI انتخابی پیکربندی کنید:

</div>

```bash
# .env یا .env.local

# انتخاب ارائه‌دهنده: anthropic, openai, gemini, deepseek, glm, local
AI_PROVIDER=anthropic

# ─── Anthropic (Claude) ───────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
# مدل‌ها: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229

# ─── OpenAI (GPT) ─────────────────────────────────────
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
# مدل‌ها: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

# ─── Google Gemini ────────────────────────────────────
GOOGLE_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash
# مدل‌ها: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash

# ─── DeepSeek ─────────────────────────────────────────
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-chat
# مدل‌ها: deepseek-chat, deepseek-coder

# ─── GLM (Zhipu AI) ───────────────────────────────────
GLM_API_KEY=your-key
GLM_MODEL=glm-4
# مدل‌ها: glm-4, glm-4-flash, glm-3-turbo

# ─── Local LLM (Ollama, LM Studio) ────────────────────
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=llama3
```

<div dir="rtl">

### استفاده پایه

</div>

```typescript
import { ProviderFactory } from '@liqueur/ai-provider';
import { LiquidRenderer } from '@liqueur/react';

// ساخت Provider از متغیرهای محیطی
const provider = ProviderFactory.createFromEnv();

// تولید اسکیما از زبان طبیعی
const schema = await provider.generateSchema(
  "هزینه‌های ماهانه را به صورت نمودار میله‌ای نشان بده",
  databaseMetadata
);

// رندر داشبورد
<LiquidRenderer schema={schema} data={data} />
```

<div dir="rtl">

### مثال: Next.js API Route

</div>

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProviderFactory } from '@liqueur/ai-provider';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  const provider = ProviderFactory.createFromEnv();
  const schema = await provider.generateSchema(prompt, metadata);

  return NextResponse.json({ schema });
}
```

<div dir="rtl">

### برنامه‌های نمونه

| نمونه | توضیحات | اجرا |
|:------|:--------|:-----|
| [مدیریت بودجه](../../examples/household-budget) | کامل با چت AI | `cd examples/household-budget && pnpm dev` |
| [Playground](../../examples/playground) | محیط تست ساده | `cd examples/playground && pnpm dev` |

### اجرا از کد منبع

</div>

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur
pnpm install && pnpm build

cd examples/household-budget
cp .env.example .env  # پیکربندی کلیدهای API
pnpm dev
```

<div dir="rtl">

---

## طراحی امنیتی

### چرا به AI اجازه نوشتن JavaScript نمی‌دهیم؟

| رویکرد | ریسک |
|:-------|:-----|
| AI کد JS/SQL تولید می‌کند | XSS، تزریق SQL، اجرای کد دلخواه |
| **Liquid: فقط JSON** | کد اجرایی وجود ندارد. فیلدهای ناشناخته رد می‌شوند |

### سه لایه دفاعی

۱. **محدودیت خروجی AI** — فقط اسکیمای JSON. بدون تولید کد
۲. **اعتبارسنجی اسکیما** — فیلدهای ناشناخته فوراً رد می‌شوند (Fail Fast)
۳. **Row-Level Security** — کاربران فقط می‌توانند به داده‌های خود دسترسی داشته باشند

---

## نقشه راه

- [x] فاز ۱: پروتکل اصلی و کامپوننت‌های React
- [x] فاز ۲: یکپارچه‌سازی ارائه‌دهنده AI
- [x] فاز ۳: برنامه نمونه (بودجه)
- [ ] فاز ۴: کامپوننت‌های اضافی (تقویم، نقشه و غیره)
- [ ] فاز ۵: ویرایش مشترک بلادرنگ
- [ ] فاز ۶: سیستم پلاگین

---

## مجوز

[MIT](../../LICENSE)

---

</div>

<div align="center">

**Liquid Protocol**

پایان دادن به دوران جنگیدن کاربران با تنظیمات

[GitHub](https://github.com/clearclown/liqueur) · [npm](https://www.npmjs.com/package/@liqueur/protocol)

</div>
