# AI Chatbot Platform MVP

This is a complete MVP for a Custom Context Chatbot platform. It consists of:
1. **Pocketbase**: Database and Authentication provider.
2. **Middleware Backend**: Node.js/Express server handling AI logic (Gemini).
3. **Admin Frontend**: React/Vite dashboard for managing chatbots.
4. **Chat Widget**: Embeddable JS snippet for client websites.

## 1. Pocketbase Setup (VPS / Local)

1. Download Pocketbase for your OS: [https://pocketbase.io/docs/](https://pocketbase.io/docs/)
2. Place the executable in the `/pocketbase` directory.
3. Run Pocketbase:
   ```bash
   ./pocketbase serve
   ```
4. Go to `http://127.0.0.1:8090/_/` and create your Admin account.

### Create Collections
You need to create 3 collections in Pocketbase manually (or via migration if you set that up):

#### **Clients** (Type: `base`)
- `name` (Text)
- `websiteUrl` (Text)
- `chatbotId` (Text, Unique)
- `contextText` (Text, Editor/Long)
- `isActive` (Bool)
- **API Rules**: Public Read (Unlock the padlock for List/View). *Advanced: Add filter rule `chatbotId != ""` if needed, but public is fine for MVP.*

#### **Conversations** (Type: `base`)
- `chatbotId` (Relation -> Clients)
- `sessionId` (Text, Unique)
- `messages` (JSON)
- `startTime` (Date)
- **API Rules**: Admin only (Locked).

#### **ChatLogs** (Type: `base`)
- `chatbotId` (Relation -> Clients)
- `timestamp` (Date)
- `type` (Text)
- `content` (Text)
- **API Rules**: Admin only (Locked).

## 2. Middleware Backend Setup

1. Navigate to `/middleware-backend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   ```env
   PORT=3000
   POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=your_admin_email@example.com
   POCKETBASE_ADMIN_PASSWORD=your_admin_password
   GEMINI_API_KEY=your_google_gemini_api_key
   ALLOWED_ORIGINS=http://localhost:5173
   ```
4. Run the server:
   ```bash
   node index.js
   ```

## 3. Admin Frontend Setup

1. Navigate to `/admin-frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   ```env
   VITE_POCKETBASE_URL=http://127.0.0.1:8090
   VITE_MIDDLEWARE_URL=http://localhost:3000
   ```
   
   For production deployment (e.g., Coolify):
   ```env
   VITE_POCKETBASE_URL=https://your-pocketbase-url.com
   VITE_MIDDLEWARE_URL=https://your-middleware-url.com
   ```
4. Run locally:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```
   (Serve the `dist` folder using Nginx or a static file server).

## 4. Client Widget Integration

To add the chatbot to a website, click the **Code** icon on any chatbot in the Dashboard to get the embed code. It looks like:

```html
<script 
  src="https://YOUR_FRONTEND_URL/widget.js" 
  data-chatbot-id="YOUR_CHATBOT_ID_HERE"
  data-api-url="https://YOUR_MIDDLEWARE_URL/api/v1/chat">
</script>
```

### Attributes
- `data-chatbot-id`: The unique ID of your chatbot (required)
- `data-api-url`: The URL of your middleware API endpoint (required for production, defaults to localhost for local dev)

*Note: The widget is automatically served from your admin frontend. The Dashboard generates the correct embed code with your middleware URL.*

## Deployment on VPS

1. **Pocketbase**: Run as a systemd service.
2. **Middleware**: Use PM2 (`npm install -g pm2`, `pm2 start index.js`).
3. **Frontend**: Build with `npm run build` and serve with Nginx.
4. **Nginx**: Reverse proxy `/api` to `localhost:3000` and serve static files for the frontend.
