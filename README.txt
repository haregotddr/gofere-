GOFERE Design Request Portal — Netlify + Telegram
====================================================

DEPLOY
1. Upload this project folder to a GitHub repository.
2. In Netlify, choose Add new site > Import an existing project.
3. Connect the repository. The included netlify.toml configures the publish
   directory and Netlify Function folder.
4. Deploy the site.

CONFIGURE TELEGRAM SECRETS
In Netlify:
Site configuration > Environment variables > Add a variable

Add:
- TELEGRAM_BOT_TOKEN = token from @BotFather
- TELEGRAM_CHAT_ID = your private chat ID (or group chat ID)

Set the variables' scope to Functions (or all scopes), save, then trigger
a new deploy. Never put the bot token in index.html or commit it to GitHub.

GET YOUR PRIVATE CHAT ID
1. Open https://t.me/GOFERE_Design_Orders_bot and press Start.
2. Send the bot a message such as "Hello".
3. In a browser, open:
   https://api.telegram.org/botYOUR_TOKEN/getUpdates
4. Find message.chat.id in the returned JSON.
5. Put that number in TELEGRAM_CHAT_ID in Netlify.
Do not share your bot token publicly. If it has been exposed, revoke it with
@BotFather and create a new one.

TEST
1. Open your deployed website.
2. Submit a test brief with a small image/logo attachment.
3. Confirm that Telegram receives the brief and attachment.
4. Check Netlify > Functions > submit > Logs if something fails.

UPLOAD LIMIT
This version limits the combined attachments to 5 MB per submission. This is
deliberately conservative for a synchronous serverless upload. Telegram's
sendDocument supports larger documents, but the request first has to reach
Netlify. For larger artwork packages, use direct-to-cloud storage and send
download links through Telegram.

WHAT IS SENT
- All non-empty form fields (club/contact details, item and style choices,
  colors, design notes, logo/sponsor details, names/numbers and extra services)
- Every selected file upload (inspiration, club logo, sponsor logos, names list)
Files are sent as Telegram documents, followed by a text summary.

IMPORTANT
The public/ folder contains the website files; netlify/functions/ contains the server-side Telegram integration.

This is a front-end + Netlify Function integration. Netlify must be deployed
with the function and both environment variables configured before submissions
can reach Telegram. The bot must have been started by the recipient, or added
to the destination group and given permission to send messages.
