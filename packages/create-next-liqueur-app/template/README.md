# Liqueur Dashboard

AI-driven dashboard generator built with [Liquid Protocol](https://github.com/anthropics/liqueur).

## Getting Started

1. **Configure API Key**

   Copy `.env.example` to `.env.local` and add your AI provider API key:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add at least one API key (Anthropic, OpenAI, or Gemini).

2. **Run the development server**

   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)**

   Try entering prompts like:
   - "Show a pie chart"
   - "Create a line chart"
   - "Add a data table"

## Project Structure

```
├── app/
│   ├── api/liquid/generate/  # AI schema generation endpoint
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main dashboard page
│   └── globals.css           # Global styles
├── .env.example              # Environment variables template
└── package.json
```

## Learn More

- [Liquid Protocol Documentation](https://github.com/anthropics/liqueur)
- [Next.js Documentation](https://nextjs.org/docs)
