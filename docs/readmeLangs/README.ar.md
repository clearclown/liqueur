<div align="center" dir="rtl">

# Liquid Protocol

**حوّل لوحات المعلومات باستخدام اللغة الطبيعية.**

بروتوكول مفتوح المصدر لتوليد واجهات المستخدم بالذكاء الاصطناعي

[![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square&color=blue)](https://www.npmjs.com/package/@liqueur/protocol)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](../../LICENSE)

[English](../../README.md) | [日本語](./README.ja.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [Русский](./README.ru.md) | [Українська](./README.uk.md) | [فارسی](./README.fa.md) | العربية

</div>

---

<div dir="rtl">

## باختصار

**"استبعد تكاليف النقل واعرض المصروفات الشهرية كرسم بياني شريطي"**

فقط قل هذا، وستتم إعادة تكوين لوحة المعلومات تلقائياً.

</div>

<div align="center">

| قبل | بعد |
|-----|-----|
| ![لوحة المعلومات الأولية](../images/dashboard-initial.png) | ![بعد تحديث الذكاء الاصطناعي](../images/dashboard-after-ai.png) |
| لوحة المعلومات الافتراضية | بعد قول "استبعد النقل" |

</div>

---

<div dir="rtl">

## البدء السريع (30 ثانية)

</div>

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard
npm run dev
```

<div dir="rtl">

افتح [http://localhost:3000](http://localhost:3000) وابدأ المحادثة.

---

## جدول المحتويات

- [لماذا Liquid Protocol؟](#لماذا-liquid-protocol)
- [المقارنة مع Claude Artifacts / Gemini Canvas](#المقارنة-مع-claude-artifacts--gemini-canvas)
- [حالات الاستخدام](#حالات-الاستخدام)
- [كيف يعمل](#كيف-يعمل)
- [التثبيت](#التثبيت)
- [إعداد المطورين](#إعداد-المطورين)
- [تصميم الأمان](#تصميم-الأمان)
- [خارطة الطريق](#خارطة-الطريق)

---

## لماذا Liquid Protocol؟

### معضلة التخصيص

خذ تطبيق تتبع الميزانية كمثال. أياً كان التطبيق الذي تستخدمه، ستكون لديك دائماً طلبات مثل:

> - "استبعد تكاليف النقل - الشركة تسددها"
> - "مشتريات البطاقة العائلية يجب أن تكون منفصلة - أحصل على استرداد"
> - "ضع علامة 'سفر' على جميع النفقات أثناء رحلتي"
> - "لا أحب الأحمر - اجعله أزرق وأسود"

**الحلول الحالية:**

| النهج | مثال | المشكلة |
|:------|:-----|:--------|
| بناء كل شيء بنفسك | Notion، جداول البيانات | التخصيص يصبح الهدف. تفقد التركيز |
| إضافة المزيد من الإعدادات | التطبيقات التقليدية | شاشات الإعدادات تصبح معقدة. "حرية مفرطة" |

### حل Liquid

**فقط قل ما تريد.**

```
المستخدم: "استبعد تكاليف النقل"
    ↓
الذكاء الاصطناعي يعيد توليد هيكل لوحة المعلومات
    ↓
الفلاتر والرسوم البيانية والتخطيطات تُحدَّث تلقائياً
```

لا مزيد من البحث في شاشات الإعدادات.

---

## المقارنة مع Claude Artifacts / Gemini Canvas

هل استخدمت [Claude Artifacts](https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) أو [Gemini Canvas](https://gemini.google/overview/canvas/)؟

إنها ميزات رائعة تتيح لك توليد لوحات المعلومات والكود من خلال المحادثة مع الذكاء الاصطناعي.

**Liquid Protocol يجلب هذه التجربة إلى تطبيقك.**

| الميزة | Claude Artifacts | Gemini Canvas | **Liquid Protocol** |
|--------|:---------------:|:-------------:|:-------------------:|
| توليد UI بالذكاء الاصطناعي | ✅ | ✅ | ✅ |
| التضمين في تطبيقك الخاص | ❌ | ❌ | **✅** |
| الاتصال بقاعدة بياناتك | ❌ | ❌ | **✅** |
| Row-Level Security | ❌ | ❌ | **✅** |
| مخاطر تنفيذ الكود | ⚠️ صندوق رمل | ⚠️ صندوق رمل | **✅ لا شيء** |
| مفتوح المصدر | ❌ | ❌ | **✅ MIT** |
| اختيار مزود الذكاء الاصطناعي | Claude فقط | Gemini فقط | **أي مزود** |

### الخلاصة

```
Claude Artifacts / Gemini Canvas
  → رائع. لكن فقط داخل تطبيقاتهم.

Liquid Protocol
  → نفس التجربة في تطبيقك.
    قاعدة بياناتك، مستخدميك.
```

---

## حالات الاستخدام

نحن نعرض باستخدام تطبيق الميزانية، لكن هذه التقنية تنطبق على أي تطبيق:

| التطبيق | المشكلة التقليدية | حل Liquid |
|:--------|:-----------------|:----------|
| **Slack / Discord** | إعدادات إشعارات معقدة | "أخبرني فقط عن المحادثات المهمة" |
| **تداول الأسهم** | لوحات معلومات ثابتة | "اعرض فقط أسهم التكنولوجيا في رسم دائري" |
| **Twitter / SNS** | خوارزمية غير شفافة | "أخفِ المحتوى السياسي" |
| **إدارة المشاريع** | جحيم إعدادات Jira | "اعرض فقط مهامي لهذا الأسبوع" |

**هذه التقنية ستصبح معياراً للبرمجيات.**

---

## التثبيت

### حسب الاستخدام

</div>

```bash
# تعريفات Schema فقط
npm install @liqueur/protocol

# إضافة React UI
npm install @liqueur/protocol @liqueur/react

# Full stack (AI + قاعدة البيانات)
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter
```

<div dir="rtl">

### الحزم

| الحزمة | الغرض |
|:-------|:------|
| [@liqueur/protocol](https://www.npmjs.com/package/@liqueur/protocol) | أنواع Schema والتحقق |
| [@liqueur/react](https://www.npmjs.com/package/@liqueur/react) | مكونات UI |
| [@liqueur/ai-provider](https://www.npmjs.com/package/@liqueur/ai-provider) | تكامل مزود الذكاء الاصطناعي |
| [@liqueur/db-adapter](https://www.npmjs.com/package/@liqueur/db-adapter) | تنفيذ استعلامات Prisma |
| [@liqueur/artifact-store](https://www.npmjs.com/package/@liqueur/artifact-store) | حفظ Schema |
| [create-next-liqueur-app](https://www.npmjs.com/package/create-next-liqueur-app) | CLI لإنشاء المشروع |

---

## إعداد المطورين

### الطريقة 1: البدء السريع مع CLI

</div>

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard

# تكوين مزود الذكاء الاصطناعي
cp .env.example .env
# حرر .env وأضف مفتاح API

npm run dev
```

<div dir="rtl">

### الطريقة 2: الإضافة إلى مشروع موجود

</div>

```bash
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider
```

<div dir="rtl">

### متغيرات البيئة

عند استخدام `@liqueur/ai-provider`، قم بتكوين متغيرات البيئة لمزود الذكاء الاصطناعي الذي اخترته:

</div>

```bash
# .env أو .env.local

# اختر المزود: anthropic, openai, gemini, deepseek, glm, local
AI_PROVIDER=anthropic

# ─── Anthropic (Claude) ───────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# ─── OpenAI (GPT) ─────────────────────────────────────
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini

# ─── Google Gemini ────────────────────────────────────
GOOGLE_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash

# ─── DeepSeek ─────────────────────────────────────────
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-chat

# ─── GLM (Zhipu AI) ───────────────────────────────────
GLM_API_KEY=your-key
GLM_MODEL=glm-4

# ─── Local LLM (Ollama, LM Studio) ────────────────────
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=llama3
```

<div dir="rtl">

---

## تصميم الأمان

### لماذا لا نسمح للذكاء الاصطناعي بكتابة JavaScript؟

| النهج | المخاطر |
|:------|:--------|
| الذكاء الاصطناعي يولد JS/SQL | XSS، حقن SQL، تنفيذ كود عشوائي |
| **Liquid: JSON فقط** | لا كود قابل للتنفيذ. الحقول غير المعروفة ترفض |

### ثلاث طبقات من الدفاع

١. **تقييد مخرجات الذكاء الاصطناعي** — Schema JSON فقط. لا توليد كود
٢. **التحقق من Schema** — الحقول غير المعروفة ترفض فوراً (Fail Fast)
٣. **Row-Level Security** — المستخدمون يمكنهم الوصول فقط إلى بياناتهم

---

## خارطة الطريق

- [x] المرحلة 1: البروتوكول الأساسي ومكونات React
- [x] المرحلة 2: تكامل مزودي الذكاء الاصطناعي
- [x] المرحلة 3: تطبيق نموذجي (الميزانية)
- [ ] المرحلة 4: مكونات إضافية (التقويم، الخريطة، إلخ.)
- [ ] المرحلة 5: التحرير التعاوني في الوقت الفعلي
- [ ] المرحلة 6: نظام الإضافات

---

## الترخيص

[MIT](../../LICENSE)

---

</div>

<div align="center">

**Liquid Protocol**

إنهاء عصر صراع المستخدمين مع الإعدادات

[GitHub](https://github.com/clearclown/liqueur) · [npm](https://www.npmjs.com/package/@liqueur/protocol)

</div>
