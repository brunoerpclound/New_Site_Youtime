import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";
export async function createStore(
  seed,
  {
    databaseUrl = process.env.DATABASE_URL,
    file = path.resolve("data/content.json"),
  } = {},
) {
  if (databaseUrl) {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    await pool.query(
      "CREATE TABLE IF NOT EXISTS youtime_publication (id integer PRIMARY KEY CHECK(id=1), state jsonb NOT NULL)",
    );
    await pool.query(
      "INSERT INTO youtime_publication VALUES(1,$1) ON CONFLICT DO NOTHING",
      [JSON.stringify({ content: seed, history: [] })],
    );
    return {
      read: async () =>
        (await pool.query("SELECT state FROM youtime_publication WHERE id=1"))
          .rows[0].state,
      async save(content, expected) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const old = (
            await client.query(
              "SELECT state FROM youtime_publication WHERE id=1 FOR UPDATE",
            )
          ).rows[0].state;
          const state = nextState(old, content, expected);
          await client.query(
            "UPDATE youtime_publication SET state=$1 WHERE id=1",
            [JSON.stringify(state)],
          );
          await client.query("COMMIT");
          return state;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  }
  if (process.env.NODE_ENV === "production")
    throw Error("DATABASE_URL obrigatória em produção");
  await mkdir(path.dirname(file), { recursive: true });
  try {
    await writeFile(file, JSON.stringify({ content: seed, history: [] }), {
      flag: "wx",
    });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  let queue = Promise.resolve();
  const read = async () => JSON.parse(await readFile(file, "utf8"));
  return {
    read,
    save(content, expected) {
      const result = queue.then(async () => {
        const state = nextState(await read(), content, expected);
        const temp = file + "." + randomUUID();
        await writeFile(temp, JSON.stringify(state));
        await rename(temp, file);
        return state;
      });
      queue = result.catch(() => {});
      return result;
    },
    close: async () => {},
  };
}
function nextState(old, content, expected) {
  if (old.content.revision !== expected)
    throw Object.assign(
      Error(
        "Outra publicação foi salva. Recarregue o painel e recupere seu rascunho antes de tentar novamente.",
      ),
      { status: 409 },
    );
  return {
    content,
    history: [
      {
        revision: content.revision,
        updatedAt: content.updatedAt,
        savedAt: content.updatedAt,
      },
      ...old.history,
    ].slice(0, 50),
  };
}
