import { AMQPClient } from "@cloudamqp/amqp-client";
import { readFileSync } from "fs";
import { resolve } from "path";

const { AMQP_URL = `amqp://guest:guest@localhost:5672` } = process.env;

const data = readFileSync(resolve(__dirname, `./data.json`), `utf-8`);
const sleep = () => new Promise((r) => setTimeout(r, 1000));

async function run(url: string) {
  try {
    const amqp = new AMQPClient(url);
    const conn = await amqp.connect();
    const ch = await conn.channel();
    const q = await ch.queue();
    const consumer = await q.subscribe({ noAck: true }, async (msg) => {
      console.log(msg.bodyToString()?.length);
      await consumer.cancel();
    });
    for (let index = 0; index < 3; index++) {
      q.publish(data).catch(console.error);
    }
    await consumer.wait(); // will block until consumer is canceled or throw an error if server closed channel/connection
    await conn.close();
  } catch (e) {
    console.error("ERROR", e);
  }
}

(async () => {
  run(AMQP_URL);
  await sleep();
})();
