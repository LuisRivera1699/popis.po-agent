# pochi.po - The AI Meme Token Hunter 🚀

## What is pochi.po? 🤖

The blockchain world is living the **meme phenomenon**—every viral event turns into a meme, and people create tokens around them. If a meme gains traction, the token explodes, and some make a fortune. But...

- Not all meme tokens succeed—many are **rug pulls** or just don't take off.
- As soon as a meme goes viral, **1000 copycat tokens** appear, confusing buyers.
- Finding the next meme requires **being glued to Twitter 24/7**, which is unrealistic for most.

**Enter pochi.po**, an AI agent inspired by the nickname of its creator's girlfriend. pochi.po **scrapes Twitter, detects potential memes, and automatically creates meme tokens** before anyone else.

---

## How It Works 🛠️

1. **Scraping Twitter** 🕵️‍♂️ - pochi.po constantly monitors **nitter.net** for new tweets.
2. **Meme Detection** 🔍 - Uses AI (Claude by Anthropic) to analyze if a tweet is meme-worthy.
3. **Token Creation** 🎰 - If a tweet qualifies, pochi.po **creates a token on Moonshot**, buys a percentage, and tweets about it.
4. **Engagement & Automation** 🤖 - Users can interact with pochi.po via chat to:
   - Check token details & tweets.
   - Create a wallet (custodial for now, **MPC coming soon**).
   - Buy/sell tokens created by pochi.po.
   - Auto-buy every new pochi.po token (**sniping mode**!).

---

## System Architecture 🏗️

![Architecture](https://pbs.twimg.com/media/GjXBIZGXkAAX5zk?format=jpg&name=large)

### Components:

- **Scraper** 📡
  - Built with Python, Selenium, and BeautifulSoup.
  - Scrapes tweets from **nitter.net** and stores them in an AWS **PostgreSQL DB**.
  - Evaluates tweets using the pochi.po AI agent.

- **Autonome (pochi.po Agent)** 🧠
  - Hosted on **Autonome**, powered by **Coinbase AgentKit** and **Anthropic Claude**.
  - Handles user interactions and meme token creation.
  - Equipped with powerful tools:
    - `create_moonshot_token` → Deploys tokens, buys for snipers, and tweets.
    - `tweet_evaluator` → Analyzes meme potential, explains why, and saves it.
    - `create_user_wallet` → Creates a secure custodial wallet.
    - `get_balance` → Fetches user wallet balance.
    - `search_token` → Searches tokens by name, symbol, or contract address.
    - `get_private_key` → Retrieves the user’s stored private key.
    - `send_eth` → Sends ETH to another wallet.
    - `buy_token` → Buys pochi.po-created tokens.
    - `sell_token` → Sells pochi.po-created tokens.
    - `snipe_tokens` → Enables auto-buying of new pochi.po tokens.
    - `stop_sniping` → Stops auto-buying.

- **Blockchain (Base Sepolia + Moonshot)** 🔗
  - All tokens are deployed on **Base Sepolia** via **Moonshot Protocol**.
  - Transactions are stored and accessible in pochi.po’s database.

- **Frontend (pochipo.xyz)** 🎨
  - Built with **Vite.js**, hosted on **Vercel**.
  - Displays all tokens created by pochi.po and their associated tweets.
  - Integrates chat-based interaction with the pochi.po agent.

- **Twitter Bot (@PochiPo1589473)** 🐦
  - Publishes new tokens **instantly** when created.
  - Engages with users and provides real-time updates.

---

## Get Started 🚀

### Try pochi.po:
- 🌐 **Web App:** [pochipo.xyz](https://pochipo.xyz)
- 🤖 **AI Agent (Autonome):** [Live Deployment](
https://autonome.alt.technology/pochi-po-ljtoie)
- 🐦 **Twitter:** [@PochiPo1589473](https://x.com/PochiPo1589473)

### How to Use:
1. **Browse the dashboard** for the latest meme tokens.
2. **Ask pochi.po** about a token’s details in the chat.
3. **Create a wallet** and manage funds.
4. **Enable sniping mode** and let pochi.po auto-buy new tokens!

---

## Future Plans 🔮
- ✅ **MPC Wallets** → Fully non-custodial wallets using Coinbase’s MPC tech.
- ✅ **More refined meme detection** → Integrating broader sentiment analysis.
- ✅ **Multi-chain deployment** → Expanding beyond Base Sepolia.

---

## Authors
- [Diego Parra](https://github.com/divait)
- [Luis Rivera](https://github.com/LuisRivera1699)

---

## Contributing 🛠️
PRs welcome! If you have cool ideas, feel free to open an issue or hit us up on Twitter.

---

## License 📜
MIT - Do whatever you want, just don’t rug. 😉

