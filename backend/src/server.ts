import "dotenv/config";
import { app } from "./app.js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
app.listen(port, () => console.log(`API listening on ${port}`));
