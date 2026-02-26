Your task is to develop a website for managing various private keys.　The project's name is Kagi(鍵 かぎ), which means "key" in Japanese.

I’ve already set up the base technology stack:

* **Framework:** Next.js (App Router), using RSC throughout
* **Database:** drizzle + PostgreSQL
* **UI:** shadcn/ui + lucide-react + Tailwind CSS
* **Authentication:** better-auth
* **AI SDK:** vercel/ai
* **Other common libraries:** Jotai + Immer + UUID + lodash (not installed yet; install only if needed) + Prettier + ESLint

---

### Technical Requirements

* Use **TypeScript everywhere**, manage types properly, and **do not use `any`**
* Use **@tanstack/react-query** for all http requests
* Use **shadcn/ui components** as much as possible for the UI; use **@tanstack/react-form** wherever forms are involved
* Properly **split components**; do not cram all functionality into a single component, spilt tools and UI into separate components, and ensure good code organization
* Use **zod** for request parameter validation, database schema constraints, and strict form validation
* Integrate the authentication system with my existing **Keycloak** platform
* Implement some statistics and analytics features in dashboard pages, I've already set up the dashboard template.
* Finally, provide a **Dockerfile** and **docker-compose.yml** for easy deployment

---

### Features

* Support all the private key (SK) formats I can think of; add more if you find any:

  * The simplest case, such as `OPENAI_API_KEY`, which is just a plain string
  * Some keys consist of a group of strings, for example AWS S3, which involves
    `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, etc.
  * Various **SSH keys**, which are file-based and can be uploaded via drag-and-drop, with download support later
  * **JSON files**, such as Google OAuth 2.0 Client IDs (`client_secret.json`), which can be uploaded via drag-and-drop and downloaded later
  * Various **two-factor authentication recovery tokens**
  * The main style should be Geeky, maybe with a green and black color scheme, but you can be creative with the design

---

### Technical Design

* When registering keys, use a **two-level structure**.
  For example, `OPENAI_API_KEY` is the first level; the second level represents different projects, such as “Blog.”
  The actual SK is registered at the second level. The creation time should be optional (and you can consider what other parameters are worth storing).
* When registering keys, support the different formats mentioned above
  (except for two-factor authentication recovery tokens, which should be managed in a separate menu).
* Keys must be **encrypted before being stored in the database and decrypted when used** to ensure security—design this part carefully.
* Each first-level key should support adding a **brand or logo icon** for easier identification.
* Provide **search functionality**.

---

### AI-Powered Intelligent Extraction

* Example prompt:
  “Extract the private keys for the Blog project: the OPENAI private key, the Google Analytics key, and the AWS S3–related keys for a Next.js project.”
* Your job is to feed the AI with the names of all first-level and second-level keys so it can perform matching.
  More specifically, since this example is a Next.js project, you should intelligently recognize that the GA key is used on the frontend, so the final key the user wants should be `NEXT_PUBLIC_GA_KEY`.
* **Do not send any actual private keys to the AI.**
  Only let the AI select and filter key names. Then, based on the selected keys, match the real SKs and generate the final `.env` file (displayed using the Monaco Editor).

---

### Vibe Coding Requirements

* All comments and documentation in the project must be written in **English**
* If anything is unclear, **stop and ask me**
* Ensure proper **linting and formatting**; quality comes first
